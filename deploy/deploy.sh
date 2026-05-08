#!/bin/bash
set -e

DOMAIN="taolun.renrenup.cn"
DEPLOY_DIR="/www/wwwroot/${DOMAIN}"

echo "[Deploy] Starting deployment for ${DOMAIN}..."

# Build frontend
echo "[Deploy] Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Create deploy directory
mkdir -p ${DEPLOY_DIR}

# Copy frontend
cp -r frontend/dist ${DEPLOY_DIR}/frontend

# Copy backend
cp -r backend ${DEPLOY_DIR}/backend
cp .env ${DEPLOY_DIR}/backend/

# Install backend dependencies
cd ${DEPLOY_DIR}/backend
npm install --production

# Setup PM2
cat > ${DEPLOY_DIR}/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'taolun-backend',
    script: './backend/src/index.js',
    cwd: '${DEPLOY_DIR}',
    instances: 1,
    env: { NODE_ENV: 'production', PORT: 9528 },
    log_file: '${DEPLOY_DIR}/logs/backend.log',
    max_memory_restart: '500M',
    autorestart: true
  }]
};
EOF

mkdir -p ${DEPLOY_DIR}/logs
pm2 start ${DEPLOY_DIR}/ecosystem.config.js
pm2 save

echo "[Deploy] Deployment completed!"
