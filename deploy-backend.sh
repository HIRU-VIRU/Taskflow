#!/bin/bash
# Backend deployment script for AWS EC2

set -e

echo "🚀 Deploying backend to AWS..."

# Configuration
SERVER_IP="52.2.121.88"
SERVER_USER="ec2-user"  # Change if using Ubuntu (would be 'ubuntu')
KEY_PATH="$HOME/.ssh/taskflow-key.pem"
DEPLOY_PATH="/home/$SERVER_USER/Taskflow"
PM2_APP_NAME="taskflow-api"

echo "📡 Connecting to server: $SERVER_IP"
echo "🔑 Using SSH key: $KEY_PATH"

# Ensure key has correct permissions
chmod 600 "$KEY_PATH"

# Deploy via SSH
ssh -i "$KEY_PATH" -t "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    set -e

    echo "📂 Navigating to project directory..."
    cd /home/ec2-user/Taskflow || cd /home/ubuntu/Taskflow || { echo "❌ Project directory not found"; exit 1; }

    echo "⬇️  Pulling latest changes..."
    git pull origin main

    echo "📦 Installing dependencies..."
    cd backend
    npm install

    echo "🔨 Building TypeScript..."
    npm run build

    echo "🌧️  Setting up environment variables..."
    cat > .env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (update these for your AWS RDS instance)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskflow
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=taskflow-super-secret-jwt-key-change-in-production-2026
JWT_EXPIRES_IN=30d

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hiruviru18@gmail.com
SMTP_PASSWORD=abfg rnae sccg nbok
SMTP_FROM_NAME=TaskFlow
SMTP_FROM_EMAIL=hiruviru18@gmail.com

# App URL (used for invite links in emails)
APP_URL=https://frontend-taskflow-18-three.vercel.app
EOF

    echo "🌱 Updating database with latest seed data..."
    npx knex seed:run

    echo "♻️  Restarting application..."
    pm2 restart taskflow-api || pm2 start dist/index.js --name taskflow-api

    echo "✅ Deployment complete!"
    echo "📊 Application status:"
    pm2 status taskflow-api
ENDSSH

echo ""
echo "✨ Backend deployed successfully!"
echo "🌐 API URL: https://52.2.121.88.nip.io/api/health"
echo ""
