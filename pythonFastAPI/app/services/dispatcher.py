from fastapi.responses import JSONResponse
from services.table_handlers import  uniqueIp, top10_actors_modbus_s7comm, top10_actors_allInteractions, top10_actors_itInteractions  # aggiungi altri moduli qui

async def dispatch_table_request(tenant: str, table_type: str, time_range: dict = None):
    handlers = {
        #"modbus-dos": modbus.get_data,
        # Aggiungi qui altri tipi di tabella
        "unique-ip": uniqueIp.get_data,
        "top10-actors-modbus-s7comm":top10_actors_modbus_s7comm.get_data,
        "top10-actors-allInteractions": top10_actors_allInteractions.get_data,
        "top10-actors-itInteractions": top10_actors_itInteractions.get_data
    }

    handler = handlers.get(table_type)
    if not handler:
        return JSONResponse(status_code=400, content={"error": f"Tipo tabella non supportato: {table_type}"})

    return await handler(tenant, time_range)
