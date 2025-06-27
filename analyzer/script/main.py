import json
import os
import sched
import subprocess
import threading
import time

import logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(filename)s:%(lineno)d - %(funcName)s() - %(levelname)s: %(message)s'
)

# Disabilita i log di paramiko e delle sue sottolibrerie
logging.getLogger("paramiko").setLevel(logging.WARNING)

import numpy as np
import pandas as pd
import opensearchpy.helpers.response

from opensearchpy import OpenSearch, helpers
from pathlib import Path
from tqdm import tqdm
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import shutil

from zat.log_to_dataframe import LogToDataFrame
import opensearch_management
import ssh_management
import threatIntelligence, threat_intelligence
import geoip_updater
import interaction_calc

auth = ('admin', 'admin')  # For testing only. Don't store credentials in code.


with open("../Config.json", "r") as jsonfile:
    data = json.load(jsonfile)
pcapPath = data["pcapFolder"]
delay = data["delay"]
zeek_path = data["zeek_path"]
greynoiseapikey = data["greynoise_api_key"]
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

my_scheduler = sched.scheduler(time.time, time.sleep)
event = None
running = False
counter = 0 #aggiungerla al get_pcaps per tenere traccia delle riprogrammazioni effettuate

es = OpenSearch(
    [{'host': '172.17.0.1', 'port': 9200}],
    http_auth=auth,
    use_ssl=True,
    verify_certs=False,
    ssl_assert_hostname=False,
    ssl_show_warn=False,
    # ca_certs=ca_certs_path,
)


def get_remote_deployments():
    with open("../Config.json", "r") as jsonfile:
        data = json.load(jsonfile)
    return data["RemoteDeployments"]


def bulk_load(vm_name, plc_name, path_log):
    def generate_docs():
        logging.info(f"path log: {path_log}")
        logList = os.listdir(path_log)
        logging.info(f"log list: {logList}")
        if "conn.log" not in logList:
            logging.warning(f"'conn.log' not found in {path_log}. Skipping bulk load.")
            return  #Significa che non ha ricevuto nessuna connessione
        conlog = logList.index("conn.log")
        logList.insert(0, logList.pop(conlog))
        for log in tqdm(logList, leave=False):
            if log != "reporter.log":
                print("Uploading " + log)
                log_to_df = LogToDataFrame()
                zeek_df = log_to_df.create_dataframe("pcaps/" + vm_name + "/LOGS/" + log)

                # Threat Intelligence
                if log == "conn.log":
                    threat_intelligence.greynoise(es, vm_name + "_intel", zeek_df, greynoiseapikey)

                df_iter = zeek_df.iterrows()
                log_name = vm_name + "_" + log.split(".")[0]

                if log.split(".")[0] == "conn" and not es.indices.exists(index=log_name):
                    opensearch_management.create_index_with_mapping(es, log_name)

                l = []
                for idx, row in df_iter:
                    row = row.replace(np.nan, None)
                    row = row.to_dict()
                    row['ts'] = idx
                    row["container_name"] = plc_name
                    if 'duration' in row and row['duration'] is not None:
                        row['duration'] = row['duration'].total_seconds()

                    if 'suppress_for' in row and row['suppress_for'] is not None:
                        row['suppress_for'] = row['suppress_for'].total_seconds()
                    l.append(row)

                new_df = pd.DataFrame(l)
                # Session Calc
                if log == "http.log" or log == "modbus.log" or log == "s7comm.log":
                    d = interaction_calc.support_index(es, vm_name, new_df, log.split(".")[0])
                else:
                    d = {}
                for row in l:
                    if "uid" in row:
                        if row["uid"] in d:
                            row["request_id"] = d[row["uid"]]
                    doc = {
                        "_index": log_name,
                        "_source": row
                    }
                    yield doc

                os.remove(str(path_log) + "/" + log)
                try:
                    opensearch_management.create_index_pattern(log_name, True)
                except opensearchpy.helpers.response.Response as e:
                    print(e)

    res = helpers.bulk(es, generate_docs())
    return res


#Serviva a Mattia, non serve per il funzionamento generale del progetto
""" def load_jsons(tenant, jsons_path):
    def generate_docs():
        for log in tqdm(os.listdir(jsons_path), leave=False):
            if log.endswith(".json"):
                if log != "reporter.log":
                    print("Uploading " + log)

                    df = pd.read_json(jsons_path + "/" + log)
                    df['ts'] = pd.to_datetime(df['ts'], format='%Y-%m-%dT%H:%M:%S.%f')
                    # Threat Intelligence
                    if log == "http.json":
                        threatIntelligence.greynoise(es, "deploy1_intel", df)
                    #
                    # df = df[df['id.orig_h'].isin(a)]
                    df_iter = df.iterrows()
                    log_name = tenant + "_" + log.split(".")[0]

                    if log.split(".")[0] == "conn" and not es.indices.exists(index=log_name):
                        opensearch_management.create_index_with_mapping(es, log_name)

                    l = []
                    for idx, row in df_iter:
                        row = row.replace(np.nan, None)
                        row = row.to_dict()
                        # row['ts'] = idx
                        if log.split(".")[0] == "http":
                            if ((row["id.resp_p"] == 8081) or (row["id.resp_p"] == 8082)) and (
                                    row["id.resp_h"] == "192.168.10.114"):
                                row["container_name"] = "HMI"
                            elif row["id.resp_p"] == 8080:
                                row["container_name"] = "HMI_PLC"
                        else:
                            if row["id.resp_h"] == "192.168.10.111":
                                row["container_name"] = "PLC1"
                            elif row["id.resp_h"] == "192.168.10.112":
                                row["container_name"] = "PLC2"
                            elif row["id.resp_h"] == "192.168.10.113":
                                row["container_name"] = "PLC3"

                        if 'duration' in row and row['duration'] is not None:
                            row['duration'] = row['duration'].total_seconds()

                        if 'suppress_for' in row and row['suppress_for'] is not None:
                            row['suppress_for'] = row['suppress_for'].total_seconds()
                        l.append(row)

                    new_df = pd.DataFrame(l)
                    # Session Calc
                    if log == "http.json" or log == "modbus.json" or log == "s7comm.json":
                        d = interaction_calc.support_index(es, tenant, new_df, log.split(".")[0])
                    else:
                        d = {}
                    for row in l:
                        if "uid" in row:
                            if row["uid"] in d:
                                row["request_id"] = d[row["uid"]]
                        doc = {
                            "_index": log_name,
                            "_source": row
                        }
                        yield doc

                    try:
                        opensearch_management.create_index_pattern(log_name, True)
                    except opensearchpy.helpers.response.Response as e:
                        print(e)

    res = helpers.bulk(es, generate_docs())
    return res
 """

def run_zeek(standard=True):
    logging.info("Inizio metodo run_zeek")
    
    for dirs in os.listdir(pcapPath):
        for pcap in os.listdir(pcapPath + dirs):
            if os.path.exists(pcapPath + dirs + "/LOGS/"):
                if pcap != "LOGS" and pcap != "OLDPCAP":
                    subprocess.call([zeek_path, "-Cr", pcapPath + dirs + "/" + pcap, "main.zeek",
                                     "Log::default_logdir=" + pcapPath + dirs + "/LOGS/"])
                    log_path = Path(pcapPath + dirs + "/LOGS/")

                    # Per analizzare un dataset di pcap gia presente
                    if not standard:
                        for n in pcap.split("."):
                            if n == "NEW_plc1" or n == "NEW_plc2" or n == "NEW_plc3" or n == "hmi" or n == "plc2" or n == "pcl3" or n == "plc1" or n == "plc2_arinox" or n == "plc3_arinox":
                                print(bulk_load(dirs, n, log_path))

                    # Per modalità standard
                    else:
                        print(bulk_load(dirs, pcap.split(".")[0], log_path))

                    if os.path.exists(pcapPath + dirs + "/OLDPCAP/"):
                        os.rename(pcapPath + dirs + "/" + pcap, pcapPath + dirs + "/OLDPCAP/" + pcap)
                    else:
                        os.makedirs(pcapPath + dirs + "/OLDPCAP")
                        os.rename(pcapPath + dirs + "/" + pcap, pcapPath + dirs + "/OLDPCAP/" + pcap)

            else:
                os.makedirs(pcapPath + dirs + "/LOGS")


def create_sh(container_list):
    header = "#!/bin/bash\n"
    with open("capture.sh", 'w') as file:
        file.write(header)
        file.close()
    for container in container_list:
        string = "nohup tcpdump -vv -i any tcp and \"(src " + container["IP"] + " or dst " + container[
            "IP"] + ")\" -U -w captures/" + container["name"] + (".$(date '+%Y-%m-%d-%H-%M').pcap & echo $! >> "
                                                                         "./tcpdump.pid\n")
        with open("capture.sh", 'a') as file:
            file.write(string)
            file.close()



#Metodo eseguito dallo scheduler ogni delay secondi
def get_pcap(scheduler):
    global running
    
    if not running:
        logging.info("Scheduler interrotto, uscita dal ciclo get_pcap")
        return

    try:
        
        logging.info("Avvio get_pcap prova prova...")
        # Avvia la logica principale
        for vm in get_remote_deployments():
            remote_host = ssh_management.Host(
                host_ip=vm["IP"],
                username=vm["user"],
                password=vm["passw"]
            )
            result = remote_host.run_command("ls").stdout.split()

            if "capture.sh" not in result:
                create_sh(vm["Containers"])
                remote_host.put_script("capture.sh", "capture.sh")
                remote_host.run_command("mkdir captures")
                remote_host.run_command("sudo chmod +x capture.sh")
                os.remove("capture.sh")

            if os.path.exists(pcapPath + vm["name"]):
                result = remote_host.run_command("ls captures").stdout.split()
                remote_host.run_command("sudo pkill -F tcpdump.pid")
                remote_host.run_command("sudo rm tcpdump.pid")
                for pcap in result:
                    remote_host.get_pcap('captures/' + pcap, pcapPath + vm["name"] + "/")
                    remote_host.run_command("sudo rm captures/" + pcap)
                    print(str(pcap)+" eliminato",True)
                remote_host.run_command("sudo ./capture.sh")
                print("Metodo per la cattura dei pacchetti sulla vm remota avviato",True)
            else:
                os.makedirs(pcapPath + vm["name"])

        run_zeek()
        logging.info("Pull Complete")

        # Riprogramma solo se tutto è andato bene
        if running:
            event = scheduler.enter(delay, 1, get_pcap, (scheduler,))
            logging.info("Scheduler riprogrammato con successo")

    except Exception as e:
        logging.error(f"Errore durante l'esecuzione di get_pcap: {e}")
        running = False  # FERMA il ciclo

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
    logging.info("Analyzer stoppato, non verrà più riprogrammato")
    if event in my_scheduler.queue:
        try:
            my_scheduler.cancel(event)
            logging.info("Analyzer stoppato correttamente")
        except Exception:
            pass
    return "Service stopped"


@app.get("/status")
def service_status():
    global running
    return {"running": running}


""" La chiamata a my_scheduler.cancel(event) tenta di cancellare l'evento schedulato successivo.
Se get_pcap è già in esecuzione nel thread, lo stop farà terminare la prossima chiamata, ma non interromperà 
subito la chiamata attuale (perché sched.scheduler non è preemptive).
 """


@app.get("/run_zeek")
def run_zeek_service(standard: bool):
    run_zeek(standard)
    return "Zeek run"


@app.get("/load_jsons")
def load_jsons_service(tenant: str):
    load_jsons(tenant, "jsons")
    for json in os.listdir("jsons"):
        os.rename("jsons/" + json, "jsons/OLDJSON/" + json)
    return "Jsons loaded"


@app.post("/upload_json")
async def create_upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    try:
        with open(file_path, "wb") as file_output:
            shutil.copyfileobj(file.file, file_output)
            return {"message": "ok", "filename": file.filename, "file_path": file_path}
    except Exception as e:
        return {"message": "error"}


@app.get("/force_opensearch_config")
def force_opensearch_config():
    opensearch_management.opensearch_first_setup(es, get_remote_deployments())
    data["opensearch_configured"] = "True"
    with open("../Config.json", "w") as jsonfile:
        json.dump(data, jsonfile, indent=2)
    return "Opensearch configured"





