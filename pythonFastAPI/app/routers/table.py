from fastapi import APIRouter, Request
from services.dispatcher import dispatch_table_request
from starlette.responses import JSONResponse

router = APIRouter()

@router.post("/api/table")
async def get_table_data(request: Request):
    try:
        body = await request.json()
        tenant = body.get("tenant")
        table_type = body.get("tableType")
        time_range = body.get("timeRange")  # Nuovo parametro opzionale

        if not tenant or not table_type:
            return JSONResponse(status_code=400, content={"error": "Tenant e tipo tabella sono obbligatori"})

        result = await dispatch_table_request(tenant, table_type, time_range)
        return result

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
