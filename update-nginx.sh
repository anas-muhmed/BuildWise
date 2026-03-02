#!/bin/bash
cat > /etc/nginx/sites-available/buildwise << 'EOF'
server {
    listen 80;
    server_name buildwise-dev.me www.buildwise-dev.me 143.110.190.227;

    access_log /var/log/nginx/buildwise_access.log;
    error_log /var/log/nginx/buildwise_error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

nginx -t && systemctl reload nginx
echo "✅ Nginx updated with domain: buildwise-dev.me"
cat /etc/nginx/sites-available/buildwise
