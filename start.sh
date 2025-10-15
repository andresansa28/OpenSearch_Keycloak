#!/bin/bash

export $(grep -v '^#' .env | xargs)

FILE=./.done

if test ! -f "$FILE"; then
    sudo apt install -y net-tools
    echo "Checking Environment"

    echo "Creating CERTS"
    ./setup_certs.sh

    echo "Deploying Keycloak"
    docker compose up -d keycloak
    while true
    do
        STATUS=$(curl -k -s http://localhost:8080/auth/health/ready | jq -r '.status' 2>/dev/null)
        if [ "$STATUS" = "UP" ]; then
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

    ./upload_security.sh
    sleep 5
    ./security_admin.sh

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
        STATUS=$(curl -s http://localhost:8080/auth/health/ready | jq -r '.status' 2>/dev/null)
        if [ "$STATUS" = "UP" ]; then
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
