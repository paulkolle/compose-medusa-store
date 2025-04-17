#!/bin/bash

# Farben definieren
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funktion für Ladeanimation
function loading {
    echo -ne "${CYAN}Bitte warten${NC}"
    for i in {1..5}; do
        echo -ne "."
        sleep 0.5
    done
    echo ""
}

# Abfrage der Commit-Nachricht
echo -e "${YELLOW}Bitte geben Sie die Commit-Nachricht ein:${NC}"
read commit_message

# Lokale Befehle
echo -e "${CYAN}Führe lokale Befehle aus...${NC}"
loading
echo -e "${GREEN}Füge Änderungen hinzu...${NC}"
git add .
loading
echo -e "${GREEN}Commit mit der Nachricht: '${commit_message}'${NC}"
git commit -m "$commit_message"
loading
echo -e "${GREEN}Push zu 'origin master'...${NC}"
git push origin master
loading

# Entfernte Befehle
echo -e "${CYAN}Verbindung zum Remote-Server herstellen und entfernte Befehle ausführen...${NC}"
loading
ssh root@116.203.203.22 << 'ENDSSH'
echo -e "${CYAN}Wechsle ins Verzeichnis ~/medusa.paulkolle.de/compose-medusa-store...${NC}"
cd ~/medusa.paulkolle.de/compose-medusa-store
echo -e "${GREEN}Hole Änderungen von origin master...${NC}"
git fetch origin master
echo -e "${GREEN}Führe merge mit 'origin master' aus...${NC}"
git merge origin/master
echo -e "${GREEN}Docker compose down......${NC}"
docker compose down
echo -e "${GREEN}Docker-Container neu aufbauen und starten...${NC}"
docker compose up -d --build
ENDSSH

echo -e "${GREEN}Deployment abgeschlossen!${NC}"
