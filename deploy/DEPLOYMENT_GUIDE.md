# Operio Live Demo Deployment Guide

This guide describes how to deploy Operio to a Ubuntu VPS for the live demo.

## Prerequisites
- Ubuntu 22.04+ VPS
- Python 3.10+
- Node.js & npm (for building frontend)
- Nginx
- Git

## 1. Directory Structure
Target directory: `/var/www/operio`

```bash
mkdir -p /var/www/operio
chown -R $USER:$USER /var/www/operio
```

## 2. Backend Setup
1. Clone the repository or upload the files.
2. Navigate to `backend/`.
3. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. Create `.env` from `.env.production.example`:
   ```bash
   cp .env.production.example .env
   # Edit .env and set a secure SECRET_KEY
   ```
5. Initialize the database and seed demo data:
   ```bash
   python -m app.seed.seed_demo
   ```

## 3. Frontend Setup
1. Navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.production` from `.env.production.example`:
   ```bash
   cp .env.production.example .env.production
   ```
4. Build the frontend:
   ```bash
   npm run build
   ```

## 4. Systemd Service
1. Copy the service file:
   ```bash
   sudo cp deploy/operio-backend.service /etc/systemd/system/
   ```
2. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable operio-backend
   sudo systemctl start operio-backend
   ```
3. Check status:
   ```bash
   sudo systemctl status operio-backend
   ```

## 5. Nginx Configuration
1. Copy the Nginx config:
   ```bash
   sudo cp deploy/nginx-operio.conf /etc/nginx/sites-available/operio
   ```
2. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/operio /etc/nginx/sites-enabled/
   ```
3. Test and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## 6. SSL with Certbot (Optional but Recommended)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d operio.fikircreative.com
```

## 7. Demo Access
- URL: `https://operio.fikircreative.com`
- Admin User: `admin@operio.dev`
- Password: `Operio123!`
