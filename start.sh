#!/bin/bash

export $(grep -v '^#' .env | xargs)

FILE=./.done

if test ! -f "$FILE"; then
    sudo apt install net-tools
    echo "Checking Environment"
    WSL=$(uname -a | grep microsoft-standard-WSL2)
    echo "ip:" ${#WSL} ${WSL}

    if [ -n "$WSL" ]; then
       IP="10.0.8.3"
    else
       IP=$(ifconfig | awk '{print $2}' | head -n 2 | tail -n 1)
    fi

    OLD_IP=$(echo $KEYCLOAK_URL | cut -c 9- | cut -d ":" -f 1)

    echo "ip:" $IP "old_ip:" $OLD_IP
    SED_STRING=s/$OLD_IP/$IP/g
    echo "Sed string:" $SED_STRING

    sed -i $SED_STRING ./opensearch-dashboards.yml
    sed -i $SED_STRING ./config.yml
    sed -i $SED_STRING ./setup_keycloak.sh
    sed -i $SED_STRING ./backup/config.yml
    sed -i $SED_STRING ./.env

    echo "Creating CERTS"
    ./setup_certs.sh
    echo "Deploying Keycloak"
    docker compose up -d keycloak
    while true
    do
        if [ "$(curl -k -s https://localhost:8443/auth/health/ready status | jq -r '.status')" = "UP" ]; then
            break
        fi
        sleep 1
    done
    ./setup_keycloak.sh
    sudo sysctl -w vm.max_map_count=262144
    docker compose up -d os01
    while true
    do
        TE=$(curl -k -s https://localhost:9200)
        if [ -n "$TE" ]; then
            break
        fi
        sleep 1
    done
    ./security_admin.sh
    sleep 5
    ./upload_security.sh
    docker compose up -d dashboards
    docker compose up -d analyzer
    docker compose up -d backend
    docker compose up -d webapp_analyzer_bridge
    docker compose up -d webapp

    touch .done
fi

if test -f "$FILE"; then
    echo "Starting Services"
    docker compose up -d keycloak
    while true
        do
            if [ "$(curl -k -s https://localhost:8443/auth/health/ready status | jq -r '.status')" = "UP" ]; then
                break
            fi
            sleep 1
        done
    docker compose up -d os01 dashboards
    while true; do
        RESPONSE=$(curl -sk -u admin:admin https://localhost:9200/_cluster/health)
    
        if [[ "$RESPONSE" == *"cluster_name"* ]]; then
            break
        else
            sleep 1
        fi
    done
    docker compose up -d analyzer
    docker compose up -d backend
    docker compose up -d webapp_analyzer_bridge
    docker compose up -d webapp
fi
