import os
import sched
import shutil
import socket
import subprocess
import threading
import time
import json
import logging
from pathlib import Path

import numpy as np
import pandas as pd
from tqdm import tqdm
from opensearchpy import OpenSearch, helpers
from opensearchpy.helpers.response import Response
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import FastAPI, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import opensearch_management
import ssh_management
import threat_intelligence
import geoip_updater
import interaction_calc
from zat.log_to_dataframe import LogToDataFrame

# ------------------------
# Logging Configuration
# ------------------------
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(filename)s:%(lineno)d - %(funcName)s() - %(levelname)s: %(message)s'
)

logging.getLogger("paramiko").setLevel(logging.WARNING)

class IgnoreStatusRoute(logging.Filter):
    def filter(self, record):
        return 'GET /status' not in record.getMessage()

logging.getLogger("uvicorn.access").addFilter(IgnoreStatusRoute())

# ------------------------
# Constants & Globals
# ------------------------
auth = ('admin', 'admin')
es = OpenSearch(
    [{'host': '172.17.0.1', 'port': 9200}],
    http_auth=auth,
    use_ssl=True,
    verify_certs=False,
    ssl_assert_hostname=False,
    ssl_show_warn=False
)

my_scheduler = sched.scheduler(time.time, time.sleep)
event = None
running = False
counter = 0

# ------------------------
# Config Utilities
# ------------------------
def load_config():
    with open("../Config.json", "r") as f:
        return json.load(f)

def save_config(data):
    with open("../Config.json", "w") as f:
        json.dump(data, f, indent=2)

config_data = load_config()

pcapPath = config_data["pcapFolder"]
delay = config_data["delay"]
zeek_path = config_data["zeek_path"]
greynoiseapikey = config_data["greynoise_api_key"]
UPLOAD_FOLDER = "uploads"

# ------------------------
# FastAPI Setup
# ------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FilterStatusLogsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.url.path == "/status":
            response.headers["x-no-log"] = "true"
        return response

app.add_middleware(FilterStatusLogsMiddleware)

# ------------------------
# Helper Functions
# ------------------------
def get_remote_deployments():
    return load_config().get("RemoteDeployments", [])

def test_host_connectivity(vm):
    try:
        logging.info(f"Test connettività TCP verso {vm['IP']}...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex((vm['IP'], 22))
        sock.close()
        if result == 0:
            logging.info(f"Host {vm['IP']} raggiungibile")
            return True
        else:
            logging.error(f"Host {vm['IP']} non raggiungibile")
            return False
    except Exception as e:
        logging.error(f"Errore connettività: {e}")
        return False

def create_sh(container_list):
    with open("capture.sh", 'w') as file:
        file.write("#!/bin/bash\n")
        for container in container_list:
            string = f"nohup tcpdump -vv -i any tcp and \"(src {container['IP']} or dst {container['IP']})\" -U -w captures/{container['name']}.$(date '+%Y-%m-%d-%H-%M').pcap & echo $! >> ./tcpdump.pid\n"
            file.write(string)

# ------------------------
# Scheduler & Zeek Runner
# ------------------------
def get_pcap(scheduler):
    global running
    if not running:
        logging.info("Scheduler interrotto")
        return
    try:
        deployments = get_remote_deployments()
        if not deployments:
            logging.info("Nessun deploy configurato")
            running = False
            return

        for vm in deployments:
            if not test_host_connectivity(vm):
                running = False
                return

            remote_host = ssh_management.Host(vm["IP"], vm["user"], vm["passw"])
            result = remote_host.run_command("ls").stdout.split()
            if "capture.sh" not in result:
                create_sh(vm["Containers"])
                remote_host.put_script("capture.sh", "capture.sh")
                remote_host.run_command("mkdir captures")
                remote_host.run_command("sudo chmod +x capture.sh")
                os.remove("capture.sh")

            os.makedirs(pcapPath + vm["name"], exist_ok=True)
            result = remote_host.run_command("ls captures").stdout.split()
            remote_host.run_command("sudo pkill -F tcpdump.pid")
            remote_host.run_command("sudo rm tcpdump.pid")
            for pcap in result:
                remote_host.get_pcap(f'captures/{pcap}', pcapPath + vm["name"] + "/")
                remote_host.run_command(f"sudo rm captures/{pcap}")
            remote_host.run_command("sudo ./capture.sh")

        run_zeek()
        logging.info("Pull completato")

        if running:
            scheduler.enter(delay, 1, get_pcap, (scheduler,))
    except Exception as e:
        logging.error(f"Errore in get_pcap: {e}")
        running = False

# ------------------------
# FastAPI Endpoints
# ------------------------
@app.get("/start")
def start_service():
    global running, event
    if running:
        return "Service already running"
    running = True
    event = my_scheduler.enter(0, 1, get_pcap, (my_scheduler,))
    threading.Thread(target=my_scheduler.run, daemon=True).start()
    return "Service started"

@app.get("/stop")
def stop_service():
    global running, event
    running = False
    if event in my_scheduler.queue:
        try:
            my_scheduler.cancel(event)
        except ValueError:
            pass
    return "Service stopped"

@app.get("/status")
def service_status():
    return {"running": running}

@app.get("/run_zeek")
def run_zeek_service(standard: bool):
    run_zeek(standard)
    return "Zeek run"

@app.get("/force_opensearch_config")
def force_opensearch_config():
    config = load_config()
    opensearch_management.opensearch_first_setup(es, config.get("RemoteDeployments", []))
    config["opensearch_configured"] = "True"
    save_config(config)
    return "Opensearch configured"

@app.post("/upload_json")
async def create_upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    try:
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return {"message": "ok", "filename": file.filename, "file_path": file_path}
    except Exception:
        return {"message": "error"}
