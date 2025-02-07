
# 🛒 Medusa Store with Docker Compose

Hi,

This is my Medusa setup using Docker Compose. It took quite some effort to get it running, but it works now. It may not be perfect, so if you have any suggestions for improvements – feel free to share!

## 🚀 Setup

To deploy this project, run:

```bash
git clone https://github.com/paulkolle/compose-medusa-store.git compose-medusa-store
```

### 1️⃣ Navigate into the project directory:

```bash
cd compose-medusa-store
```

### 2️⃣ Create the `env_files` directory and set up your environment variables:

```bash
cp env_files_example env_files
```

Edit the `.env` files in `env_files/` according to your setup. The environment files store critical configuration such as database credentials, API keys, and service settings.

---

## 🔐 Setting Up PostgreSQL SSL Certificates

Since this setup enables SSL for PostgreSQL, you need to generate the necessary certificates.

### 3️⃣ Create the `postgres-certs` directory:

```bash
cd postgres && cp -r postgres-certs-example postgres-certs && cd postgres-certs
```

### 4️⃣ Generate a private key (`server.key`):

```bash
openssl genrsa -out server.key 2048
```

🔹 **Why?** This is the private key that PostgreSQL will use for encrypting connections.  

### 5️⃣ Set correct permissions for PostgreSQL:

```bash
chmod 600 server.key
```

🔹 **Why?** PostgreSQL requires the key file to be accessible only by the owner, otherwise, it refuses to start with SSL enabled.

### 6️⃣ (Optional) Generate a Certificate Signing Request (CSR):

```bash
openssl req -new -key server.key -out server.csr -subj "/C=DE/ST=Berlin/L=Berlin/O=Test/OU=IT/CN=localhost"
```

🔹 **Why?** If you're using a Certificate Authority (CA), you would typically send this request to get a trusted certificate.

### 7️⃣ Create a self-signed certificate (`server.crt`):

```bash
openssl x509 -req -in server.csr -signkey server.key -out server.crt -days 365
```

🔹 **Why?** This allows PostgreSQL to use SSL encryption. The certificate will be valid for **365 days**.

At this point, you should have the following files in `postgres-certs/`:

```
postgres-certs/
├── server.crt   # Public certificate
├── server.key   # Private key (permissions must be 600)
```

Ensure that PostgreSQL is configured to use SSL in `postgresql.conf`:

```ini
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file  = 'server.key'
```

---

## 🏗️ Start the Containers

Once everything is set up, start the containers with:

```bash
docker compose up -d
```

🔹 **What does this do?**  
- Launches PostgreSQL, Redis, Medusa server, and Medusa worker as defined in `compose.yaml`.  
- Services will run in detached mode (`-d`), meaning they will run in the background.  

To check if all services are running, use:

```bash
docker ps
```

---

## 📜 Monitoring Logs

To follow real-time logs for debugging:

```bash
docker compose logs -f
```

🔹 **What does this do?**  
- Shows logs from all services.  
- The `-f` flag means it will keep streaming logs until you stop it (`Ctrl + C`).  

If you only want logs for a specific service, e.g., Medusa:

```bash
docker compose logs -f medusa-server
```

---

## 🛠️ Troubleshooting

1️⃣ **Check container statuses**  
```bash
docker ps
```
Make sure all containers are running. If any container is in an "unhealthy" state, check its logs:

```bash
docker logs <container_name>
```

2️⃣ **Restart containers if necessary**  
```bash
docker compose restart
```

3️⃣ **Rebuild if needed**  
If changes were made to `Dockerfile`, `compose.yaml`, or dependencies:

```bash
docker compose up --build -d
```

4️⃣ **Check PostgreSQL SSL Setup**  
If SSL is not working, ensure:
- `server.key` has **permissions 600** (`chmod 600 server.key`).
- The correct certificates are in `/var/lib/postgresql/data/` inside the container.

---

## 🎉 Success!

Now, Medusa should be running and accessible at:

- **Medusa Admin:** `http://localhost:9000/app`

---

### **🛠️ Creating an Admin User**
After starting the Medusa server, you need to create an admin user to access the system.

#### **1️⃣ Open a shell inside the Medusa server container**
First, get the container ID or name:
```bash
docker ps
```
Then, open an interactive shell inside the Medusa server container:
```bash
docker exec -it <medusa-server-container> bash
```

#### **2️⃣ Navigate to the Medusa server directory**
Once inside the container, move into the correct directory where Medusa is installed:
```bash
cd .medusa/server
```

#### **3️⃣ Create the admin user**
Now, run the following command to create an admin user:
```bash
npx medusa user -e admin@example.com -p supersecure
```
🔹 **Replace** `admin@example.com` and `supersecure` with your desired credentials.

#### **4️⃣ Exit the container**
Once the user is created, exit the container:
```bash
exit
```

Now you can log in to the Medusa Admin dashboard using the credentials you just created. 


### **Explore Medusa's APIs**
   - Test endpoints with Postman or CURL.
   - Check [MedusaJS Documentation](https://docs.medusajs.com/) for further configurations.

---

## ❓ Need Help?

If you run into any issues, feel free to open an issue on this repository or reach out to the MedusaJS community.




