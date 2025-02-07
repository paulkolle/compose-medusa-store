FROM postgres:latest

# Kopiere die Zertifikate in das Zielverzeichnis
COPY ./postgres-certs/ /etc/ssl/postgresql/

# Setze die richtigen Berechtigungen für den privaten Schlüssel
RUN chmod 600 /etc/ssl/postgresql/server.key \
    && chown -R postgres:postgres /etc/ssl/postgresql

# Kopiere ggf. auch deine angepasste Konfiguration
COPY ./postgres.conf /etc/postgresql/
