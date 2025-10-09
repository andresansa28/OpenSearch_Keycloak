# 📚 Guida alle Utility per Range Temporali

## 📍 File: `app/services/utils.py`

Questo file contiene le utility condivise per gestire i range temporali nelle query ElasticSearch.

## 🚀 Funzioni Disponibili

### 1. `convert_time_range(time_range)`

**Scopo**: Converte il range temporale dal frontend al formato ElasticSearch.

**Parametri**:
- `time_range` (dict): Dizionario con chiavi `from` e `to`

**Ritorna**: Dizionario con formato ElasticSearch (`gte`, `lte`, `format`)

**Esempi**:
```python
# Range predefinito
result = convert_time_range({"from": "now-24h", "to": "now"})
# Risultato: {"gte": "now-24h", "lte": "now", "format": "strict_date_optional_time"}

# Range personalizzato
result = convert_time_range({"from": "2025-01-01T00:00:00", "to": "2025-01-02T00:00:00"})
# Risultato: {"gte": "2025-01-01T00:00:00", "lte": "2025-01-02T00:00:00", "format": "strict_date_optional_time"}
```

### 2. `create_time_filter_query(time_range, timestamp_field="ts")`

**Scopo**: Crea un filtro temporale completo per ElasticSearch.

**Parametri**:
- `time_range` (dict): Range temporale dal frontend
- `timestamp_field` (str): Nome del campo timestamp (default: "ts")

**Esempio**:
```python
filter_query = create_time_filter_query(time_range, "timestamp")
# Risultato: {"range": {"timestamp": {"gte": "now-24h", "lte": "now", "format": "..."}}}
```

### 3. `add_time_filter_to_query(query, time_range, timestamp_field="ts")`

**Scopo**: Aggiunge automaticamente un filtro temporale a una query esistente.

**Parametri**:
- `query` (dict): Query ElasticSearch esistente
- `time_range` (dict): Range temporale dal frontend
- `timestamp_field` (str): Nome del campo timestamp (default: "ts")

## 🔧 Come Usare nelle Table Handlers

### Metodo Standard (Consigliato)

```python
from app.services.utils import convert_time_range

async def get_data(tenant: str, time_range: dict = None):
    # 1. Converti il range temporale
    time_filter = convert_time_range(time_range)
    
    # 2. Usa nella query
    query = {
        "query": {
            "bool": {
                "filter": [
                    {"range": {"ts": time_filter}}
                ]
            }
        }
    }
```

### Metodo Automatico (Per Query Complesse)

```python
from app.services.utils import add_time_filter_to_query

async def get_data(tenant: str, time_range: dict = None):
    # 1. Crea la query base
    query = {
        "aggs": {"...": "..."},
        "size": 0
    }
    
    # 2. Aggiungi automaticamente il filtro temporale
    query = add_time_filter_to_query(query, time_range)
```

## 📋 Checklist per Nuovi Handler

Quando crei un nuovo table handler:

1. ✅ Importa la utility: `from app.services.utils import convert_time_range`
2. ✅ Aggiungi il parametro: `async def get_data(tenant: str, time_range: dict = None)`
3. ✅ Converti il range: `time_filter = convert_time_range(time_range)`
4. ✅ Usa nella query: `{"range": {"ts": time_filter}}`
5. ✅ Testa con range predefiniti e personalizzati

## 🎯 Vantaggi

- **Centralizzato**: Una sola implementazione per tutti gli handler
- **Consistente**: Stesso comportamento ovunque  
- **Manutenibile**: Modifiche in un solo posto
- **Robusto**: Gestione automatica degli errori e fallback
- **Flessibile**: Supporta range relativi e assoluti

## 🔍 Debug

La funzione include logging automatico per date non valide:
```
⚠️ Date non valide ricevute: from=invalid, to=invalid. Uso fallback.
```

Questo aiuta a identificare problemi con i dati dal frontend.
