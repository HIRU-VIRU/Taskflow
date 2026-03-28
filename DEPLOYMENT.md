# Taskflow Deployment Guide

## Summary
- **Backend**: Node.js/Express API → AWS (EC2 or Elastic Beanstalk + RDS PostgreSQL)
- **Frontend**: React/Vite SPA → Vercel

---

## Part 1: Backend Deployment on AWS

### Option A: AWS Elastic Beanstalk (Recommended for simplicity)

#### Step 1: Prepare the Backend
```bash
cd backend
npm run build
```

#### Step 2: Create RDS PostgreSQL Database
1. Go to **AWS Console → RDS → Create Database**
2. Select **PostgreSQL** (version 14+)
3. Choose **Free tier** or **Production** based on needs
4. Configuration:
   - DB Instance: `taskflow-db`
   - Master username: `postgres`
   - Create a strong password
   - Enable public access (for initial setup) or use VPC peering
5. Note the **Endpoint URL** after creation

#### Step 3: Create Elastic Beanstalk Application
1. Go to **AWS Console → Elastic Beanstalk → Create Application**
2. Application name: `taskflow-backend`
3. Platform: **Node.js 20**
4. Upload your code (zip the `backend/` folder with `dist/`, `package.json`, `package-lock.json`)

#### Step 4: Configure Environment Variables
In Elastic Beanstalk Console → Configuration → Software → Environment Properties:

```
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://your-app.vercel.app
APP_URL=https://your-app.vercel.app
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=taskflow
DB_USER=postgres
DB_PASSWORD=your-rds-password
JWT_SECRET=generate-a-strong-64-char-secret
JWT_EXPIRES_IN=24h
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=TaskFlow
SMTP_FROM_EMAIL=noreply@taskflow.com
```

#### Step 5: Run Migrations
SSH into the EB instance or use EB CLI:
```bash
eb ssh
cd /var/app/current
npm run migrate
npm run seed  # Optional: seed demo data
```

#### Step 6: Enable HTTPS
1. Go to **AWS Certificate Manager** → Request a certificate for your domain
2. In EB → Configuration → Load Balancer → Add HTTPS listener (port 443)
3. Attach the SSL certificate

---

### Option B: AWS EC2 (More control)

#### Step 1: Launch EC2 Instance
1. **AMI**: Amazon Linux 2023 or Ubuntu 22.04
2. **Instance type**: t3.micro (free tier) or t3.small for production
3. **Security Group**: Allow ports 22 (SSH), 80, 443, 3000

#### Step 2: Install Dependencies
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Install PM2 for process management
sudo npm install -g pm2
```

#### Step 3: Deploy Code
```bash
git clone https://github.com/HIRU-VIRU/Taskflow.git
cd Taskflow/backend
npm install
npm run build
```

#### Step 4: Configure Environment
```bash
cp .env.example .env
nano .env  # Edit with production values
```

#### Step 5: Run with PM2
```bash
# Run migrations
npm run migrate

# Start with PM2
pm2 start dist/index.js --name taskflow-api
pm2 save
pm2 startup  # Enable auto-start on reboot
```

#### Step 6: Setup Nginx Reverse Proxy
```bash
sudo yum install nginx -y
sudo nano /etc/nginx/conf.d/taskflow.conf
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl restart nginx
```

#### Step 7: SSL with Let's Encrypt
```bash
sudo yum install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

---

### Option C: AWS ECS Fargate (Production-grade, containerized)

#### Step 1: Create Dockerfile
Create `backend/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

#### Step 2: Push to ECR
```bash
# Create ECR repository
aws ecr create-repository --repository-name taskflow-backend

# Build and push
docker build -t taskflow-backend ./backend
docker tag taskflow-backend:latest YOUR_ACCOUNT.dkr.ecr.YOUR_REGION.amazonaws.com/taskflow-backend:latest
aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.YOUR_REGION.amazonaws.com
docker push YOUR_ACCOUNT.dkr.ecr.YOUR_REGION.amazonaws.com/taskflow-backend:latest
```

#### Step 3: Create ECS Service
1. Create ECS Cluster (Fargate)
2. Create Task Definition with the ECR image
3. Configure environment variables in task definition
4. Create Service with Application Load Balancer
5. Attach SSL certificate from ACM

---

## Part 2: Frontend Deployment on Vercel

### Step 1: Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import the `Taskflow` repository

### Step 2: Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Configure Environment Variables
In Vercel Project Settings → Environment Variables:

```
VITE_API_URL=https://api.yourdomain.com
```

Or if using Elastic Beanstalk URL:
```
VITE_API_URL=https://taskflow-backend.us-east-1.elasticbeanstalk.com
```

### Step 4: Deploy
Click **Deploy** - Vercel will automatically:
- Install dependencies
- Run `npm run build`
- Deploy to their CDN

### Step 5: Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `app.yourdomain.com`)
3. Configure DNS:
   - CNAME: `app` → `cname.vercel-dns.com`
   - Or use Vercel nameservers for automatic SSL

---

## Part 3: Post-Deployment Checklist

### Backend Verification
- [ ] API responds at `https://api.yourdomain.com/api/health` (add health endpoint if missing)
- [ ] Database connection works
- [ ] Migrations applied successfully
- [ ] CORS allows frontend domain
- [ ] JWT authentication working
- [ ] Email sending configured and working

### Frontend Verification
- [ ] App loads at `https://app.yourdomain.com`
- [ ] Login/Register works
- [ ] API calls succeed (no CORS errors)
- [ ] All routes work (check React Router)

### Security Checklist
- [ ] Environment variables are set (not hardcoded)
- [ ] JWT_SECRET is unique and strong (64+ chars)
- [ ] Database credentials are secure
- [ ] HTTPS enabled on both frontend and backend
- [ ] RDS security group only allows backend access
- [ ] No `.env` files in git

---

## Part 4: CI/CD Setup (Optional)

### GitHub Actions for Backend (AWS)
Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to AWS

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install and Build
        working-directory: ./backend
        run: |
          npm ci
          npm run build

      - name: Deploy to Elastic Beanstalk
        uses: einaregilsson/beanstalk-deploy@v22
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: taskflow-backend
          environment_name: taskflow-backend-prod
          region: us-east-1
          version_label: ${{ github.sha }}
          deployment_package: backend/deploy.zip
```

### Vercel Auto-Deploy
Vercel automatically deploys on every push to `main`. No additional configuration needed.

---

## Quick Reference: AWS Services Used

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| RDS PostgreSQL | Database | ~$15-30/month (db.t3.micro) |
| Elastic Beanstalk | Backend hosting | ~$15-50/month |
| EC2 (alternative) | Backend hosting | ~$10-20/month (t3.micro) |
| ACM | SSL Certificates | Free |
| Route 53 | DNS (optional) | ~$0.50/month per zone |

## Quick Reference: Vercel

| Feature | Details |
|---------|---------|
| Hosting | Free tier: 100GB bandwidth |
| Build | Automatic on git push |
| SSL | Free, automatic |
| Custom Domain | Free |

---

## Support Commands

```bash
# Backend logs (EC2 with PM2)
pm2 logs taskflow-api

# Backend logs (Elastic Beanstalk)
eb logs

# Run migrations remotely
npm run migrate

# Check database connection
npm run maintenance:check-usage
```
