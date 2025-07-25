import math
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
import ast
import shlex

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
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("opensearch").setLevel(logging.WARNING)
logging.getLogger("opensearchpy").setLevel(logging.WARNING)

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
        file.write("> tcpdump.pid\n")  # svuota il file PID all'inizio
        for container in container_list:
            string = (
                f"nohup bash -c 'tcpdump -vv -i any \"(tcp or arp) and (src {container['IP']} or dst {container['IP']})\" "
                f"-U -w captures/{container['name']}.$(date +%Y-%m-%d-%H-%M).pcap > /dev/null 2>&1 &' \n"
                f"echo $! >> tcpdump.pid\n"
            )
            file.write(string)

# ------------------------
# Scheduler & Zeek Runner
# ------------------------
def get_pcap(scheduler):
    global running
    if not running:
        logging.info("Scheduler interrotto, uscita dal ciclo get_pcap")
        return
    try:
        deployments = get_remote_deployments()
        if len(deployments) == 0:
            logging.info("Non ci sono deploy nella lista")
            running = False
            return
        # Avvia la logica principale
        for vm in get_remote_deployments():
            # Test della connessione TCP prima di procedere
            if not test_host_connectivity(vm):
                logging.error(f"Host {vm['IP']} non raggiungibile, interruzione dell'operazione")
                running = False  # Interrompe tutto
                return
            
            remote_host = ssh_management.Host(
                host_ip=vm["IP"],
                username=vm["user"],
                password=vm["passw"]
            )
            
            result = remote_host.run_command("ls").stdout.split()
            logging.info("Avvio get_pcap...")
            if "capture.sh" not in result:
                data = load_config()
                docker_nets = [d["DockerNet"] for d in data["RemoteDeployments"] if d.get("DockerNet")]
                if len(docker_nets) != 0:
                    generate_zeek_table_to_file(docker_nets, remote_host)
            
                create_sh(vm["Containers"])
                remote_host.put_script("capture.sh", "capture.sh")
                remote_host.run_command("mkdir captures")
                remote_host.run_command("sudo chmod +x capture.sh")
                os.remove("capture.sh")

            if os.path.exists(pcapPath + vm["name"]):
                result = remote_host.run_command("ls captures").stdout.split()
                remote_host.run_command("for pid in $(cat tcpdump.pid); do sudo kill $pid; done")
                remote_host.run_command("sudo rm tcpdump.pid")
                for pcap in result:
                    remote_host.get_pcap('captures/' + pcap, pcapPath + vm["name"] + "/")
                    remote_host.run_command("sudo rm captures/" + pcap)
                    print(str(pcap)+" eliminato",True)
                remote_host.run_command("sudo ./capture.sh")
                logging.info("Metodo per la cattura dei pacchetti sulla vm remota avviato")
            else:
                os.makedirs(pcapPath + vm["name"])

        run_zeek()
        logging.info("Pull Complete")

        # Riprogramma solo se tutto è andato bene
        if running:
            event = scheduler.enter(delay, 1, get_pcap, (scheduler,))
            logging.info("Scheduler riprogrammato con successo")

    except Exception as e:
        logging.exception("Errore durante l'esecuzione di get_pcap")
        running = False  # FERMA il ciclo

def generate_zeek_table_to_file(docker_nets: list, remote_host, filename="trusted_macs.zeek", table_name="trusted_devices"):
    hosts = {}
    for network in docker_nets:
        # Comando docker (come stringa per SSH)
        docker_cmd = (
            f"sudo docker network inspect {shlex.quote(network)} "
            "--format '{{range .Containers}}{{printf \"  \\\"%s\\\": \\\"%s\\\",\\n\" "
            "(index (split .IPv4Address \"/\") 0) .MacAddress}}{{end}}' "
            "| sed '$ s/,$//'"
        )
        full_cmd = f"echo '{{' && {docker_cmd} && echo '}}'"
        res = remote_host.run_command(full_cmd).stdout
        res_to_dict = ast.literal_eval(res)
        hosts.update(res_to_dict)
    with open(filename, "w") as f:
        f.write(f"const {table_name}: table[addr] of string = {{\n")
        for ip, mac in hosts.items():
            f.write(f"    [{ip}] = \"{mac}\",\n")
        f.write("};\n")
    logging.info(f"File '{filename}' creato con successo.")

def run_zeek(standard=True):
    logging.info("Inizio metodo run_zeek")
    for dirs in os.listdir(pcapPath):
        for pcap in os.listdir(pcapPath + dirs):
            if os.path.exists(pcapPath + dirs + "/LOGS/"):
                pcap_file = pcapPath + dirs + "/"+ pcap
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
                        bulk_load(dirs, pcap.split(".")[0], log_path, pcap_file)#print
                        logging.info("Bulk load avviato")

                    if os.path.exists(pcapPath + dirs + "/OLDPCAP/"):
                        os.rename(pcapPath + dirs + "/" + pcap, pcapPath + dirs + "/OLDPCAP/" + pcap)
                    else:
                        os.makedirs(pcapPath + dirs + "/OLDPCAP")
                        os.rename(pcapPath + dirs + "/" + pcap, pcapPath + dirs + "/OLDPCAP/" + pcap)

            else:
                os.makedirs(pcapPath + dirs + "/LOGS")



def bulk_load(vm_name, plc_name, path_log, pcap_file):
    def generate_docs():
        logList = os.listdir(path_log)
        logging.info(f"log list: {logList}")
        if "conn.log" not in logList:
            logging.warning(f"'conn.log' not found in {path_log}. Skipping bulk load.")
            return  #Significa che non ha ricevuto nessuna connessione
        conlog = logList.index("conn.log")
        logList.insert(0, logList.pop(conlog))
        for log in tqdm(logList, leave=False):
            if log != "reporter.log":
                logging.info("Uploading " + log)
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
                    if log == "modbus.log":
                        logging.info("Aggiunta payload modbus...")
                        new_df = aggiungi_payload_modbus(new_df, pcap_file)
                    elif log == "s7comm.log":
                        logging.info("Aggiunta payload s7comm...")
                        new_df = aggiungi_payload_s7(new_df, pcap_file)
                        
                elif log == "modbus_dos.log":
                    logging.info("Possible dos attack")
                    new_df = aggiungi_payload_modbus(new_df, pcap_file)
                else:
                    d = {}
                for _, row in new_df.iterrows():
                    row_dict = row.to_dict()
        
                    # Associa request_id se esiste
                    if "uid" in row_dict and row_dict["uid"] in d:
                        row_dict["request_id"] = d[row_dict["uid"]]
        
                    # Pulisci i NaN prima di mandare a OpenSearch
                    row_dict = clean_document(row_dict)

                    doc = {
                        "_index": log_name,
                        "_source": row_dict
                    }
                    yield doc
                os.remove(str(path_log) + "/" + log)
                try:
                    opensearch_management.create_index_pattern(log_name, True)
                except opensearchpy.helpers.response.Response as e:
                    print(e)

    res = helpers.bulk(es, generate_docs())
    return res


def clean_document(doc):
    """Rimpiazza NaN o valori non serializzabili in un dizionario con None."""
    for k, v in doc.items():
        if isinstance(v, float) and math.isnan(v):
            doc[k] = None
        elif isinstance(v, dict):
            doc[k] = clean_document(v)
    return doc


def aggiungi_payload_modbus(new_df, pcap_file):
    import re

    def split_modbus_payload(payload_hex):
        """
        Divide il payload esadecimale in blocchi da 12 byte (24 caratteri)
        """
        if not payload_hex or len(payload_hex) < 24:
            return [payload_hex]  # troppo corto per essere una richiesta completa
        return re.findall('.{24}', payload_hex)

    # Verifica colonne
    required_cols = ["ts", "id.orig_h", "id.orig_p", "id.resp_h", "id.resp_p"]
    for col in required_cols:
        if col not in new_df.columns:
            raise KeyError(f"Colonna mancante in new_df: {col}")

    # Converti ts in datetime
    new_df["ts"] = pd.to_datetime(new_df["ts"].astype("int64"), unit="ns", errors="coerce")
    new_df = new_df.dropna(subset=["ts"])

    # Comando tshark
    cmd = [
        "tshark", "-r", pcap_file,
        "-Y", "modbus",
        "-T", "fields",
        "-e", "frame.time_epoch",
        "-e", "ip.src",
        "-e", "tcp.srcport",
        "-e", "ip.dst",
        "-e", "tcp.dstport",
        "-e", "tcp.payload"
    ]

    try:
        output = subprocess.check_output(cmd).decode().splitlines()
    except subprocess.CalledProcessError as e:
        print(f"Errore nell'esecuzione di tshark: {e}")
        return new_df.assign(payload="-")

    payload_rows = []
    for line in output:
        parts = line.strip().split("\t")
        if len(parts) < 6 or not parts[5]:
            continue
        try:
            ts_float = round(float(parts[0]), 6)
            split_payloads = split_modbus_payload(parts[5])  # spezza il payload in blocchi da 12 byte
            payload_str = "|".join(split_payloads)  # o lascia come lista se preferisci
            payload_rows.append({
                "ts": pd.to_datetime(ts_float, unit="s"),
                "id.orig_h": parts[1],
                "id.orig_p": int(parts[2]),
                "id.resp_h": parts[3],
                "id.resp_p": int(parts[4]),
                "payload": payload_str
            })
        except Exception:
            continue

    if not payload_rows:
        logging.info("Nessun payload TCP trovato, si assegna '-' a tutti.")
        new_df["payload"] = "-"
        return new_df

    df_tshark = pd.DataFrame(payload_rows)

    # Uniforma tipi
    new_df["id.orig_p"] = new_df["id.orig_p"].astype("int64", errors="ignore")
    new_df["id.resp_p"] = new_df["id.resp_p"].astype("int64", errors="ignore")

    # Merge
    merged = pd.merge(
        new_df,
        df_tshark,
        on=["ts", "id.orig_h", "id.orig_p", "id.resp_h", "id.resp_p"],
        how="left"
    )

    merged["payload"] = merged["payload"].fillna("-")
    return merged



def aggiungi_payload_s7(new_df, pcap_file):
    # Funzione per rimuovere l'header TPKT (4 byte) + COTP (3 byte) da ogni payload TCP
    def strip_s7_from_tcp_payload(payload_hex: str) -> str:
        try:
            return payload_hex[14:] if len(payload_hex) > 14 else "-"
        except Exception:
            return "-"

    # 🔁 Step 1: Conversione della colonna timestamp in formato compatibile per il merge
    try:
        new_df["ts"] = pd.to_datetime(new_df["ts"].astype("int64"), unit="ns").dt.round("us")
    except Exception as e:
        print(f"[S7] Errore nella conversione del timestamp: {e}")
        return new_df.assign(payload="-")  # Se errore, restituisce il DF con payload vuoto

    logging.info("[S7] Estrazione payload da tshark in esecuzione, pcap selezionato: "+pcap_file)
    #Step 2: Comando tshark per estrarre i campi desiderati dai pacchetti TCP S7 (porta 102)
    cmd = [
        "tshark", "-r", pcap_file,
        "-Y", "s7comm && tcp.dstport == 102 && tcp.len > 0",  # Solo pacchetti S7 con contenuto
        "-T", "fields",
        "-e", "frame.time_epoch",   # Timestamp
        "-e", "ip.src",             # IP sorgente
        "-e", "tcp.srcport",        # Porta sorgente
        "-e", "ip.dst",             # IP destinazione
        "-e", "tcp.dstport",        # Porta destinazione
        "-e", "tcp.payload"         # Payload esadecimale
    ]

    #Step 3: Esecuzione di tshark e raccolta output
    try:
        output = subprocess.check_output(cmd).decode().splitlines()
    except subprocess.CalledProcessError as e:
        logging.error(f"[S7] Errore nell'esecuzione di tshark: {e}")
        return new_df.assign(payload="-")

    #Step 4: Parsing dell'output di tshark in un DataFrame
    payload_rows = []
    for line in output:
        parts = line.strip().split("\t")
        if len(parts) < 6 or parts[5] == "":
            continue  # Scarta righe incomplete o senza payload
        try:
            payload_rows.append({
                "ts": pd.to_datetime(round(float(parts[0]), 6), unit="s"),
                "id.orig_h": parts[1],
                "id.orig_p": int(parts[2]),
                "id.resp_h": parts[3],
                "id.resp_p": int(parts[4]),
                "payload": strip_s7_from_tcp_payload(parts[5])
            })
        except Exception:
            logging.info("Riga saltata")
            continue  # In caso di errore nei cast, salta la riga

    df_tshark = pd.DataFrame(payload_rows)
    logging.info("DF tshark: "+df_tshark.to_string())
    # Step 5: Verifica che tutte le colonne chiave per il merge siano presenti
    expected_cols = {"ts", "id.orig_h", "id.orig_p", "id.resp_h", "id.resp_p", "payload"}
    if not expected_cols.issubset(df_tshark.columns):
        logging.info("[S7] Colonne mancanti in df_tshark, merge saltato.")
        return new_df.assign(payload="-")

    # Step 6: Conversione coerente dei tipi nelle colonne chiave
    try:
        new_df["id.orig_p"] = new_df["id.orig_p"].astype("int64")
        new_df["id.resp_p"] = new_df["id.resp_p"].astype("int64")
    except Exception:
        return new_df.assign(payload="-")

    # Step 7: Merge tra il DataFrame di Zeek e quello di tshark, usando timestamp/IP/porte
    logging.info("[S7] Fusione dei dati Zeek + tshark...")
    # Arrotonda entrambi i timestamp a microsecondi per uniformità
    new_df["ts"] = new_df["ts"].dt.round("us")
    df_tshark["ts"] = df_tshark["ts"].dt.round("us")

    logging.info(f"Esempio Zeek ts:\n{new_df[['ts', 'id.orig_h', 'id.orig_p', 'id.resp_h', 'id.resp_p']].head().to_string()}")
    logging.info(f"Esempio Tshark ts:\n{df_tshark[['ts', 'id.orig_h', 'id.orig_p', 'id.resp_h', 'id.resp_p']].head().to_string()}")

   
    merged = pd.merge(new_df, df_tshark, on=["ts", "id.orig_h", "id.orig_p", "id.resp_h", "id.resp_p"], how="left")

    #Step 8: Inserisce il payload dove trovato, "-" dove assente
    merged["payload"] = merged["payload"].fillna("-")
    logging.info("DF merged: "+merged.to_string())
    return merged

# ------------------------
# FastAPI Endpoints
# ------------------------
@app.get("/start")
def start_service():
    global running, event
    if running:
        return "Service already running"
    running = True
    write_trusted_ips()
    event = my_scheduler.enter(0, 1, get_pcap, (my_scheduler,))
    threading.Thread(target=my_scheduler.run, daemon=True).start()
    return "Service started"


def write_trusted_ips():
    data = load_config()
    hosts = []
    for deployment in data["RemoteDeployments"]:
        for container in deployment["Containers"]:
            hosts.append(container["IP"])
    with open("deployment_hosts.zeek", "w") as f:
        f.write("const trusted_ips: set[addr] = {\n")
        for ip in hosts:
            f.write(f"    {ip},\n")
        f.write("};\n")

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
