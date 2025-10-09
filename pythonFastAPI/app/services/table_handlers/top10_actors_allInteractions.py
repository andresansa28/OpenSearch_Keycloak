#Trovare i 10 attori (actor) più attivi (in base al numero di documenti) che hanno comunicato usando i protocolli Modbus o S7Comm in 
#un certo intervallo di tempo, e per ciascuno, calcolare quanti host di origine unici (id.orig_h) hanno generato quei dati.
from datetime import datetime
from fastapi.responses import JSONResponse
from opensearchpy import OpenSearch
from app.main import es  # usa l'istanza globale oppure inietta
from app.services.utils import convert_time_range

async def get_data(tenant: str, time_range: dict = None):
    index_name = f"{tenant}_interactions"
    headers = {"security_tenant": tenant}
    
    # Converti il range temporale nel formato appropriato usando l'utility condivisa
    time_filter = convert_time_range(time_range)

    query = {
  "aggs": {
    "actors": {
      "terms": {
        "field": "actor.keyword",
        "order": {
          "_count": "desc"
        },
        "size": 10
      },
      "aggs": {
        "unique_ips": {
          "terms": {
            "field": "id.orig_h.keyword",
            "size": 1000
          }
        }
      }
    }
  },
  "size": 0,
  "stored_fields": [
    "*"
  ],
  "script_fields": {},
  "docvalue_fields": [
    {
      "field": "ts",
      "format": "date_time"
    }
  ],
  "_source": {
    "excludes": []
  },
  "query": {
    "bool": {
      "filter": [
        {
          "range": {
            "ts": time_filter
          }
        }
      ]
    }
  }
}


    try:
        response = es.search(index=index_name, body=query, headers=headers)
        return response
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
