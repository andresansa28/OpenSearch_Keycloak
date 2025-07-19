import json
import numpy as np
import pandas as pd
from tqdm import tqdm
import uuid
from opensearchpy import OpenSearch, helpers
import opensearch_management

bounds = {'http': 30 * 60, 'modbus': 1, 's7comm': 1, 'http_plc': 5}
protocols = ["http", "s7comm", "ssh", "rdp", "modbus", "kerberos"]

def safe_val(val, default=None):
    if pd.isna(val):
        return default
    return val

def support_index(es, deploy, df1, protocol):
    r = ""
    if protocol == "http":
        for (container_name), group in df1.groupby("container_name"):
            if "HMI_PLC" in container_name:
                time_delta = pd.Timedelta(seconds=5)
                r = split_sessions_start_time(es, deploy, protocol, group, time_delta)
            else:
                time_delta = pd.Timedelta(seconds=bounds[protocol])
                r = split_sessions_start_time(es, deploy, protocol, group, time_delta)
    else:
        time_delta = pd.Timedelta(seconds=bounds[protocol])
        r = split_sessions_start_time(es, deploy, protocol, df1, time_delta)
    return r

def split_sessions_start_time(es, deploy, protocol, frame, time_delta):
    frame.sort_values(['id.orig_h', 'id.resp_h', 'id.orig_p', 'id.resp_p', 'ts'], inplace=True)
    sessions = []

    for (src, dst, srcp, dstp), group in tqdm(frame.groupby(['id.orig_h', 'id.resp_h', 'id.orig_p', 'id.resp_p']), leave=False):
        if group.empty:
            continue

        session = []
        last_time = group.iloc[0]['ts']

        for _, row in group.iterrows():
            intel = get_ip_intel(es, deploy, row["id.orig_h"])
            if intel is not None and "classification" in intel:
                row["classification"] = intel["classification"]
                row["actor"] = intel.get("actor", "unknown")
                row["geo.orig.point"] = intel.get("geo.orig.point", None)
                row["geo.orig.country"] = intel.get("geo.orig.country", None)
            row["service"] = protocol

            if row['ts'] > last_time + time_delta:
                sessions.append(pd.DataFrame(session))
                session = []

            last_time = row['ts']
            session.append(row)

        if session:
            sessions.append(pd.DataFrame(session))

    r = upload_sessions_to_index2(es, deploy, sessions)
    return r

def get_ip_intel(es, deploy, ip):
    query = {
        "query": {
            "match": {
                "id.orig_h": f"{ip}"
            }
        }
    }
    s = es.search(index=f"{deploy}_intel", body=json.dumps(query))["hits"]["hits"]
    if len(s) != 0:
        return s[0]["_source"]
    return None

def upload_sessions_to_index2(es, deploy, sessions):
    def generate_docs():
        for session in sessions:
            uid = uuid.uuid4()
            f = session.iloc[0]
            s = {
                "ts": f["ts"],
                "id.orig_h": f["id.orig_h"],
                "id.orig_p": f["id.orig_p"],
                "id.resp_h": f["id.resp_h"],
                "id.resp_p": f["id.resp_p"],
                "service": safe_val(f.get("service")),
                "container_name": safe_val(f.get("container_name")),
                "classification": safe_val(f.get("classification"), "unknown"),
                "actor": safe_val(f.get("actor"), "unknown"),
                "geo.orig.point": safe_val(f.get("geo.orig.point")),
                "geo.orig.country": safe_val(f.get("geo.orig.country")),
                "request_id": uid,
                "session_complexity": len(session.index),
                "session_duration": str(session.iloc[-1]["ts"] - session.iloc[0]["ts"])
            }
            doc = {
                "_index": f"{deploy}_interactions",
                "_source": s
            }
            yield doc

    helpers.bulk(es, generate_docs())
    opensearch_management.create_index_pattern(f"{deploy}_interactions", True)
    return {}

def upload_requests_to_index(es, deploy, service, data):
    def generate_docs():
        for idx, row in data.iterrows():
            row = row.replace(np.nan, None).to_dict()
            new_row = {
                "uid": row.get("uid"),
                "id.orig_h": row["id.orig_h"],
                "id.resp_h": row["id.resp_h"],
                "id.orig_p": row["id.orig_p"],
                "id.resp_p": row["id.resp_p"],
                "container_name": row.get("container_name"),
                "service": service,
                "ts": row["ts"]
            }
            doc = {
                "_index": f"{deploy}_requests",
                "_source": new_row
            }
            yield doc

    helpers.bulk(es, generate_docs())
    opensearch_management.create_index_pattern(f"{deploy}_requests", False)