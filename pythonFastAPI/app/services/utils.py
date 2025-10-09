"""
Utilità condivise per i servizi della dashboard
"""
from datetime import datetime


def convert_time_range(time_range):
    """
    Converte il range temporale dal frontend al formato ElasticSearch.
    
    Args:
        time_range (dict): Dizionario con 'from' e 'to' dal frontend
        
    Returns:
        dict: Range temporale nel formato ElasticSearch
        
    Examples:
        # Range predefinito (es: "last_24h")
        convert_time_range({"from": "now-24h", "to": "now"})
        
        # Range personalizzato (ISO string)
        convert_time_range({"from": "2025-01-01T00:00:00", "to": "2025-01-02T00:00:00"})
    """
    if not time_range:
        # Fallback: ultime 24 ore
        return {
            "gte": "now-24h",
            "lte": "now",
            "format": "strict_date_optional_time"
        }
    
    from_time = time_range.get("from", "now-24h")
    to_time = time_range.get("to", "now")
    
    # Se sono date relative (now-X), mantienile così
    if from_time.startswith("now") or to_time.startswith("now"):
        return {
            "gte": from_time,
            "lte": to_time,
            "format": "strict_date_optional_time"
        }
    
    # Se sono timestamp ISO personalizzati, validali
    try:
        # Valida che siano date valide
        datetime.fromisoformat(from_time.replace("Z", "+00:00"))
        datetime.fromisoformat(to_time.replace("Z", "+00:00"))
        
        return {
            "gte": from_time,
            "lte": to_time,
            "format": "strict_date_optional_time"
        }
    except ValueError:
        # Fallback se le date non sono valide
        print(f"Date non valide ricevute: from={from_time}, to={to_time}. Uso fallback.")
        return {
            "gte": "now-24h",
            "lte": "now",
            "format": "strict_date_optional_time"
        }


def create_time_filter_query(time_range, timestamp_field="ts"):
    """
    Crea un filtro temporale per le query ElasticSearch.
    
    Args:
        time_range (dict): Range temporale dal frontend
        timestamp_field (str): Nome del campo timestamp (default: "ts")
        
    Returns:
        dict: Filtro range per ElasticSearch
    """
    time_filter = convert_time_range(time_range)
    
    return {
        "range": {
            timestamp_field: time_filter
        }
    }


def add_time_filter_to_query(query, time_range, timestamp_field="ts"):
    """
    Aggiunge un filtro temporale a una query ElasticSearch esistente.
    
    Args:
        query (dict): Query ElasticSearch esistente
        time_range (dict): Range temporale dal frontend  
        timestamp_field (str): Nome del campo timestamp (default: "ts")
        
    Returns:
        dict: Query con filtro temporale aggiunto
    """
    time_filter = create_time_filter_query(time_range, timestamp_field)
    
    # Assicurati che esista la struttura bool.filter
    if "query" not in query:
        query["query"] = {"bool": {"filter": []}}
    elif "bool" not in query["query"]:
        query["query"] = {"bool": {"filter": [query["query"]]}}
    elif "filter" not in query["query"]["bool"]:
        query["query"]["bool"]["filter"] = []
    
    # Aggiungi il filtro temporale
    query["query"]["bool"]["filter"].append(time_filter)
    
    return query
