#!/bin/bash

GREEN='\033[0;32m'
NC='\033[0m'

# Primo, ferma tutto tramite docker-compose (se usi docker-compose)
echo -e "${GREEN}Stopping all containers with docker compose down...${NC}"
docker compose down

# Filtra i container per nome (modifica qui i prefissi rilevanti per il tuo progetto)
FILTERS="opensearch|keycloak|webapp|backend|analyzer|dashboard"

# Trova i container che matchano i nomi
CONTAINERS=$(docker ps -a --format '{{.Names}}' | grep -E "^($FILTERS)")

# Ferma e rimuove i container filtrati
for c in $CONTAINERS; do
  docker stop "$c" > /dev/null 2>&1
  docker rm "$c" > /dev/null 2>&1
  echo -e " ${GREEN}✔${NC} Container $c stopped and removed"
done

# Trova reti docker con nomi che matchano (modifica il filtro se vuoi)
NETWORKS=$(docker network ls --format '{{.Name}}' | grep -E "^($FILTERS)")

# Rimuove le reti filtrate
for n in $NETWORKS; do
  docker network rm "$n" > /dev/null 2>&1
  echo -e " ${GREEN}✔${NC} Network $n removed"
done

echo -e "${GREEN}Cleanup complete.${NC}"
