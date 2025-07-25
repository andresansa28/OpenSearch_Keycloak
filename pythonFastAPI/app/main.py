import json
import os
import sys
import jwt
import requests
from typing import Annotated

import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi_keycloak import FastAPIKeycloak, KeycloakError, OIDCUser, KeycloakUser
from opensearchpy import OpenSearch, helpers
from pydantic import BaseModel
from starlette.requests import Request
from starlette.responses import JSONResponse

sys.path.append(os.path.abspath("../code/app/"))
import sslpatch, osQueryFile, dataFunctions

with sslpatch.no_ssl_verification():
    idp = FastAPIKeycloak(
        server_url="https://172.17.0.1:8443/auth",
        client_id="fastAPI",
        client_secret="secret",
        admin_client_secret="secret",
        realm="ICSConsole",
        callback_uri="http://localhost:5000/callback"
    )

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

auth = ('admin', 'admin')  # For testing only. Don't store credentials in code.
ca_certs_path = '../code/app/ca/admin.pem'  # Provide a CA bundle if you use intermediate CAs with your root CA.

es = OpenSearch(
    [{'host': '172.17.0.1', 'port': 9200}],
    http_auth=auth,
    use_ssl=True,
    verify_certs=False,
    ssl_assert_hostname=False,
    ssl_show_warn=False,
    ca_certs=ca_certs_path,
)


def checkTokenValidity(token):
    with sslpatch.no_ssl_verification():
        if not idp.token_is_valid(token):
            raise "credential_exception"


def checkTokenAndRoleValidity(token, role):
    with sslpatch.no_ssl_verification():
        if not idp.token_is_valid(token):
            raise "credential_exception"
        else:
            if not idp.get_user_roles(token) == role:
                raise "role_exception"


app = FastAPI()
idp.add_swagger_config(app)

origins = [
    "http://localhost",
    "http://localhost:4200",
    "http://localhost:5000",
    "http://localhost:5002",
    "http://172.17.0.1:5000",
    "http://172.17.0.1:5002",
    "http://172.17.0.1:4200"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Aggiungiamo un handler per le richieste OPTIONS
@app.options("/{path:path}")
async def options_handler(request: Request):
    return JSONResponse(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@app.get("/")
def root():
    return es.info()

@app.get("/test")
def user_roles(token: Annotated[str, Depends(oauth2_scheme)]):
    return idp._decode_token(token)


class User(BaseModel):
    username: str
    last_name: str
    first_name: str
    email: str
    password: str


class UserGroup(BaseModel):
    user_id: str
    group_name: str


class GroupCreate(BaseModel):
    name: str
    description: str = ""


@app.get("/users", tags=["user-management"])
def get_users(user: OIDCUser = Depends(idp.get_current_user(required_roles=["admin"]))):
    with sslpatch.no_ssl_verification():
        return idp.get_all_users()
    
@app.put("/user/update/", tags=["user-management"])
def update_user(user: KeycloakUser, current_user: OIDCUser = Depends(idp.get_current_user(required_roles=["admin"]))):
    with sslpatch.no_ssl_verification():
        return idp.update_user(user)


@app.get("/groups", tags=["user-groups"])
def get_groups():
    with sslpatch.no_ssl_verification():
        return idp.get_all_groups()


@app.post("/group/create/", tags=["user-groups"])
def create_group(item: GroupCreate):
    try:
        with sslpatch.no_ssl_verification():
            # Verifica se il gruppo esiste già
            existing_groups = idp.get_groups([item.name])
            if existing_groups:
                return {
                    "message": "Gruppo esiste già",
                    "group_name": item.name,
                    "status": "exists"
                }
            
            # Usa l'API diretta di Keycloak
            import requests
            
            # Ottieni il token admin
            token_url = "https://172.17.0.1:8443/auth/realms/master/protocol/openid-connect/token"
            token_data = {
                "username": "admin",
                "password": "password",  # Credenziali corrette dal file .env
                "grant_type": "password",
                "client_id": "admin-cli"
            }
            
            token_response = requests.post(token_url, data=token_data, verify=False)
            if token_response.status_code != 200:
                raise Exception(f"Errore nell'ottenere il token admin: {token_response.text}")
            
            admin_token = token_response.json()["access_token"]
            
            # Crea il gruppo
            groups_url = "https://172.17.0.1:8443/auth/admin/realms/ICSConsole/groups"
            group_data = {
                "name": item.name,
                "attributes": {
                    "description": [item.description]
                }
            }
            
            headers = {
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            }
            
            create_response = requests.post(groups_url, json=group_data, headers=headers, verify=False)
            
            if create_response.status_code == 201:
                return {
                    "message": "Gruppo creato con successo",
                    "group_name": item.name,
                    "status": "created"
                }
            else:
                raise Exception(f"Errore nella creazione del gruppo: {create_response.status_code} - {create_response.text}")
            
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Errore dettagliato: {error_details}")
        return JSONResponse(
            status_code=400,
            content={"message": {"errorMessage": f"Errore nella creazione del gruppo: {str(e)}"}}
        )


@app.get("/user/group/", tags=["user-groups"])
def get_user_group(user_id: str):
    with sslpatch.no_ssl_verification():
        return idp.get_user_groups(user_id)


@app.post("/user/group/add/", tags=["user-groups"])
def add_group_to_user(item: UserGroup, user: OIDCUser = Depends(idp.get_current_user(required_roles=["admin"]))):
    try:
        with sslpatch.no_ssl_verification():
            groups = idp.get_groups([item.group_name])
            if not groups:
                return JSONResponse(
                    status_code=400,
                    content={"message": {"errorMessage": f"Gruppo '{item.group_name}' non trovato"}}
                )
            group_id = groups[0].id
            result = idp.add_user_group(user_id=item.user_id, group_id=group_id)
            return result
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"message": {"errorMessage": f"Errore nell'assegnazione del gruppo: {str(e)}"}}
        )


@app.post("/user/group/remove/", tags=["user-groups"])
def remove_user_from_group(item: UserGroup, user: OIDCUser = Depends(idp.get_current_user(required_roles=["admin"]))):
    try:
        with sslpatch.no_ssl_verification():
            groups = idp.get_groups([item.group_name])
            if not groups:
                return JSONResponse(
                    status_code=400,
                    content={"message": {"errorMessage": f"Gruppo '{item.group_name}' non trovato"}}
                )
            group_id = groups[0].id
            result = idp.remove_user_group(user_id=item.user_id, group_id=group_id)
            return {
                "message": "Utente rimosso dal gruppo con successo",
                "user_id": item.user_id,
                "group_name": item.group_name
            }
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"message": {"errorMessage": f"Errore nella rimozione dell'utente dal gruppo: {str(e)}"}}
        )


@app.post("/user/create/", tags=["user-management"])
def create_user(item: User, user: OIDCUser = Depends(idp.get_current_user(required_roles=["admin"]))):
    with sslpatch.no_ssl_verification():
        return idp.create_user(username=item.username, first_name=item.first_name, last_name=item.last_name,
                               email=item.email, password=item.password, send_email_verification=False)






@app.delete("/user/delete/", tags=["user-management"])
def delete_user(user_id: str, user: OIDCUser = Depends(idp.get_current_user(required_roles=["admin"]))):
    with sslpatch.no_ssl_verification():
        return idp.delete_user(user_id=user_id)

@app.put("/user/update", tags=["user-management"])
def update_user(self, user: KeycloakUser):
    response = self._admin_request(url=f'{self.users_uri}/{user.id}', data=user.__dict__, method=HTTPMethod.PUT)
    if response.status_code == 204:  # Update successful
        return self.get_user(user_id=user.id)
    return response

@app.delete("/group/delete/", tags=["user-groups"])
def delete_group(group_name: str):
    try:
        with sslpatch.no_ssl_verification():
            # Verifica se il gruppo esiste
            existing_groups = idp.get_groups([group_name])
            if not existing_groups:
                return {
                    "message": "Gruppo non trovato",
                    "group_name": group_name,
                    "status": "not_found"
                }
            
            # Usa l'API diretta di Keycloak per eliminare il gruppo
            # Ottieni il token admin dal realm master
            token_url = "https://172.17.0.1:8443/auth/realms/master/protocol/openid-connect/token"
            token_data = {
                "username": "admin",
                "password": "password",
                "grant_type": "password",
                "client_id": "admin-cli"
            }
            
            token_response = requests.post(token_url, data=token_data, verify=False)
            if token_response.status_code != 200:
                raise Exception(f"Errore nell'ottenere il token admin: {token_response.text}")
            
            admin_token = token_response.json()["access_token"]
            
            # Elimina il gruppo usando il suo ID, nel realm ICSConsole
            group_id = existing_groups[0].id
            delete_url = f"https://172.17.0.1:8443/auth/admin/realms/ICSConsole/groups/{group_id}"
            
            headers = {
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            }
            
            delete_response = requests.delete(delete_url, headers=headers, verify=False)
            
            if delete_response.status_code == 204:
                return {
                    "message": "Gruppo eliminato con successo",
                    "group_name": group_name,
                    "status": "deleted"
                }
            else:
                raise Exception(f"Errore nell'eliminazione del gruppo: {delete_response.status_code} - {delete_response.text}")
            
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Errore dettagliato: {error_details}")
        return JSONResponse(
            status_code=400,
            content={"message": {"errorMessage": f"Errore nell'eliminazione del gruppo: {str(e)}"}}
        )


@app.exception_handler(KeycloakError)
async def keycloak_exception_handler(request: Request, exc: KeycloakError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.reason},
    )


#login --> vedere a quali tenant l'utente loggato ha accesso --> selezionare un tenant --> vedere gli indici disponibili per quel tenant
@app.get("/api/tenants")
def user_tenants(request: Request):
    try:
        # Estrae il token dall'header Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"error": "Token di autorizzazione mancante"}
            )
        
        token = auth_header.split(" ")[1]
        
        # Prende i gruppi dell'utente dal token
        decoded = jwt.decode(token, options={"verify_signature": False})
        # Accedi al campo 'groups'
        user_groups = decoded.get("groups", [])
        
        # Controlla se l'utente è admin
        user_roles = decoded.get("realm_access", {}).get("roles", [])
        is_admin = "admin" in user_roles

        # Chiama OpenSearch per ottenere tutti i tenants
        response = es.transport.perform_request(
            "GET",
            "/_plugins/_security/api/tenants"
        )

        # Se è admin, ritorna tutti i tenant
        if is_admin:
            return response
        
        # Altrimenti filtra i tenants che matchano con i gruppi dell'utente
        filtered_tenants = {
            tenant: data
            for tenant, data in response.items()
            if tenant in user_groups
        }

        return filtered_tenants

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Errore nel recupero dei tenants: {str(e)}"}
        )
    
@app.get("/api/tenant")
def get_tenant_indices(tenant: str):
    try:
        # Recupera tutti gli indici
        indices_response = es.transport.perform_request(
            "GET",
            "/_cat/indices",
            params={"format": "json"}
        )
        
        # Se il tenant è "global_tenant" o vuoto, mostra tutti gli indici pubblici
        if tenant in ["global_tenant", ""]:
            return {"tenant": tenant, "indices": indices_response}
        
        # Per i tenant privati, filtra gli indici che hanno il prefisso del tenant
        # OpenSearch usa il formato: {tenant_hash}_{index_name}
        tenant_indices = []
        for index in indices_response:
            index_name = index.get("index", "")
            # Gli indici del tenant iniziano con il prefisso del tenant
            if index_name.startswith(f"{tenant}_") or index_name == tenant:
                tenant_indices.append(index)
        
        return {
            "tenant": tenant, 
            "indices": tenant_indices,
            "total_indices": len(tenant_indices)
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Errore nel recupero degli indici per il tenant '{tenant}': {str(e)}"}
        )
    
@app.get("/api/arp_spoof")
def get_arp_spoof_index(tenant):
    index_name = f"{tenant}_arp_spoof"
    try:
        if not es.indices.exists(index=index_name):
            return None
        
        response = es.search(
            index=index_name,
            body={
                "size": 100,
                "query": {"match_all": {}},
                "sort": [{"ts": {"order": "desc"}}]
            }
        )
        hits = response.get("hits", {}).get("hits", [])
        total = response.get("hits", {}).get("total", {}).get("value", 0)
        
        # Estrai solo _source e eventualmente _id
        docs = [
            {**hit.get("_source", {}), "_id": hit.get("_id")}
            for hit in hits
        ]
        
        return {
            "index": index_name,
            "total": total,
            "documents": docs
        }
        
    except Exception as e:
        print(f"Errore OpenSearch: {e}")
        return None


@app.get("/api/modbus_dos")
def get_modbus_dos_index(tenant):
    index_name = f"{tenant}_modbus_dos"
    try:
        if not es.indices.exists(index=index_name):
            return None
        
        response = es.search(
            index=index_name,
            body={
                "size": 100,
                "query": {"match_all": {}},
                "sort": [{"ts": {"order": "asc"}}]
            }
        )
        
        hits = response.get("hits", {}).get("hits", [])
        total = response.get("hits", {}).get("total", {}).get("value", 0)
        
        # Estrai solo _source e eventualmente _id
        docs = [
            {**hit.get("_source", {}), "_id": hit.get("_id")}
            for hit in hits
        ]
        
        return {
            "index": index_name,
            "total": total,
            "documents": docs
        }
        
    except Exception as e:
        print(f"Errore OpenSearch: {e}")
        return None


@app.post("/api/table")
async def get_table_data(request: Request):
    try:
        body = await request.json()
        tenant = body.get("tenant")
        table_type = body.get("tableType")

        if not tenant or not table_type:
            return JSONResponse(status_code=400, content={"error": "Tenant e tipo tabella sono obbligatori"})

        headers = {"security_tenant": tenant}

        # Tabella Nmap Scan Container con porte e conteggi
        if table_type == "nmap-scan-container":
            index_name = f"{tenant}_scan"
            query = {
                "size": 0,
                "query": {
                    "bool": {
                        "filter": [
                            {
                                "range": {
                                    "ts": {
                                        "gte": "2025-07-24T00:00:00.000Z",
                                        "lte": "2025-12-31T23:59:59.999Z",
                                        "format": "strict_date_optional_time"
                                    }
                                }
                            }
                        ]
                    }
                },
                "aggs": {
                    "containers": {
                        "terms": {
                            "field": "container_name.keyword",
                            "size": 10,
                            "order": {"_count": "desc"}
                        },
                        "aggs": {
                            "total_scans": {
                                "value_count": {
                                    "field": "container_name.keyword"
                                }
                            },
                            "ports": {
                                "terms": {
                                    "field": "id.resp_p",
                                    "size": 20,
                                    "order": {"_count": "desc"}
                                }
                            }
                        }
                    }
                },
                "docvalue_fields": [
                    {"field": "ts", "format": "date_time"}
                ]
            }

            response = es.search(index=index_name, body=query, headers=headers)
            return response

        else:
            return JSONResponse(status_code=400, content={"error": "Tipo di tabella non supportato"})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
