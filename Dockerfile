# --- STAGE 1: Builder ---
    FROM node:22 AS builder

    WORKDIR /app
    COPY package*.json ./
    # Installiere alle Dependencies inkl. devDependencies
    RUN npm install
    
    # Kopiere Quellcode
    COPY . .
    
    RUN npx medusa build
    
    # --- STAGE 2: Production Image ---
    FROM node:22-slim AS production
    
    WORKDIR /app
    
    # Nur Production-Dependencies
    COPY package*.json ./
    RUN npm install --only=production
    RUN apt-get update && apt-get install -y curl
    
    # Kopiere den Build aus dem Builder-Container
    COPY --from=builder /app/.medusa/server ./.medusa/server
    
