import json
import os

import geoip2.database
import requests
import pickle

from geoip2.errors import AddressNotFoundError
from opensearchpy import OpenSearch, helpers
from tqdm import tqdm
from zat.log_to_dataframe import LogToDataFrame
import opensearch_management

log_to_df = LogToDataFrame()


def greynoise(es, log_name, conn_dataframe, apikey):
    # GreyNoise
    df = conn_dataframe
    ips = df["id.orig_h"].unique()
    ipslist = ips.tolist()
    print(ips, ipslist)

    if not es.indices.exists(index=log_name):
        mapping = {
            "mappings": {
                "properties": {
                    "geo": {
                        "properties": {
                            "orig": {
                                "properties": {
                                    "point": {
                                        "type": "geo_point"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        es.indices.create(index=log_name, body=json.dumps(mapping))

    def generate_docs():
        print("Ip to analyze: " + str(len(ips)))

        if os.stat("iptoanalyze").st_size != 0:
            with open('iptoanalyze', 'rb') as fp:
                ipss = ipslist.append(pickle.load(fp))
        else:
            ipss = ipslist
        if ipss is not None:
            for ip in tqdm(ipss):
                query = {"size": 0,
                         "query":
                             {"match":
                                 {
                                     "id.orig_h": "%s" % ip
                                 }
                             }
                         }
                s = es.search(index=log_name, body=json.dumps(query))["hits"]["total"]["value"]
                if s == 0:
                    url = "https://api.greynoise.io/v3/community/" + ip
                    try:
                        r = requests.get(url, headers={'accept': 'application/json', 'key': apikey})
                        if r.status_code == 200 or r.status_code == 400:
                            d = r.json()
                            noise_profile = {}
                            if "error" not in d:
                                noise_profile = d
                                noise_profile["id.orig_h"] = noise_profile.pop("ip")
                                noise_profile["actor"] = noise_profile.pop("name")
                                with geoip2.database.Reader('GeoLite2DB/GeoLite2-City.mmdb') as reader:
                                    try:
                                        response = reader.city(ip)
                                        noise_profile["geo.orig.point"] = {"lat": response.location.latitude,
                                                                           "lon": response.location.longitude}
                                        noise_profile["geo.orig.country"] = response.country.name
                                    except AddressNotFoundError:
                                        noise_profile["geo.orig.point"] = {"lat": 0, "lon": 0}
                                        pass
                            elif r.status_code == 400:
                                noise_profile = {"id.orig_h": ip, "classification": "blank"}

                            doc = {
                                "_index": log_name,
                                "_source": noise_profile
                            }

                            yield doc

                        if r.status_code == 429:
                            with open('iptoanalyze', 'wb') as fp:
                                pickle.dump(ipss, fp)
                            
                            print("API Limit")
                            break
                            
                    except requests.exceptions.RequestException as e:
                        pass

    docs = generate_docs()
    if docs is not None:
        res = helpers.bulk(es, docs)
    opensearch_management.create_index_pattern(log_name, False)
    return res
