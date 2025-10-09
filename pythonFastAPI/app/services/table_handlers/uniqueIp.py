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
    "2": {
      "terms": {
        "field": "container_name.keyword",
        "order": {
          "1": "desc"
        },
        "size": 5
      },
      "aggs": {
        "1": {
          "cardinality": {
            "field": "id.orig_h.keyword"
          }
        },
        "3": {
          "filters": {
            "filters": {
              "Total": {
                "bool": {
                  "must": [],
                  "filter": [
                    {
                      "match_all": {}
                    }
                  ],
                  "should": [],
                  "must_not": []
                }
              },
              "Malicious": {
                "bool": {
                  "must": [],
                  "filter": [
                    {
                      "bool": {
                        "should": [
                          {
                            "match": {
                              "classification.keyword": "malicious"
                            }
                          }
                        ],
                        "minimum_should_match": 1
                      }
                    }
                  ],
                  "should": [],
                  "must_not": []
                }
              },
              "Benign": {
                "bool": {
                  "must": [],
                  "filter": [
                    {
                      "bool": {
                        "should": [
                          {
                            "match": {
                              "classification.keyword": "benign"
                            }
                          }
                        ],
                        "minimum_should_match": 1
                      }
                    }
                  ],
                  "should": [],
                  "must_not": []
                }
              },
              "Unknown": {
                "bool": {
                  "must": [],
                  "filter": [
                    {
                      "bool": {
                        "should": [
                          {
                            "match": {
                              "classification.keyword": "unknown"
                            }
                          }
                        ],
                        "minimum_should_match": 1
                      }
                    }
                  ],
                  "should": [],
                  "must_not": []
                }
              }
            }
          },
          "aggs": {
            "1": {
              "cardinality": {
                "field": "id.orig_h.keyword"
              }
            }
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
      "must": [],
      "filter": [
        {
          "match_all": {}
        },
        {
          "range": {
            "ts": time_filter  # USA IL RANGE DINAMICO
          }
        }
      ],
      "should": [],
      "must_not": []
    }
  }
}
    try:
        response = es.search(index=index_name, body=query, headers=headers)
        return response
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
