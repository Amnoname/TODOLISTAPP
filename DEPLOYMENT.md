# Deployment Guide

This guide covers deploying the To-Do List Application to production environments.

## Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database backups set up
- [ ] SSL/HTTPS certificates ready
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Error logging configured
- [ ] Monitoring and alerting set up

## Development vs Production

### Environment Variables

**Backend (.env file)**
```
NODE_ENV=production
PORT=5000
JWT_SECRET=<strong_random_secret_key_here>
DB_PATH=/var/data/todolist.db
```

### Security Settings

1. **CORS Configuration**
```javascript
// In server.js, update CORS
const corsOptions = {
  origin: 'https://yourdomain.com',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

2. **HTTPS/SSL**
- Obtain SSL certificate (Let's Encrypt recommended)
- Use reverse proxy (nginx) to handle HTTPS
- Redirect HTTP to HTTPS

3. **Password Hashing**
- Ensure bcryptjs rounds set to 10+ in production
- Already configured in server.js

## Database Migration

### From SQLite to PostgreSQL

1. **Install PostgreSQL**
```bash
npm install pg sequelize
```

2. **Update Database Connection**
```javascript
// Replace sqlite3 with pg in server.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres'
  }
);
```

3. **Environment Variables**
```
DB_NAME=todolist_prod
DB_USER=postgres
DB_PASSWORD=<secure_password>
DB_HOST=localhost
DB_PORT=5432
```

## Deployment Options

### Option 1: Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
heroku login
```

2. **Create Heroku App**
```bash
heroku create your-app-name
```

3. **Set Environment Variables**
```bash
heroku config:set JWT_SECRET=<your_secret>
heroku config:set NODE_ENV=production
```

4. **Deploy**
```bash
git push heroku main
```

5. **Database Setup**
```bash
# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev
```

### Option 2: AWS EC2

1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Configure security groups (allow ports 80, 443, 22)

2. **SSH into Instance**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **Install Dependencies**
```bash
# Update system
sudo apt update
sudo apt upgrade

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs

# Install nginx
sudo apt install nginx

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
```

4. **Clone Repository**
```bash
git clone <your-repo-url>
cd TODOLISTAPP
```

5. **Setup Backend**
```bash
cd backend
npm install
npm start
```

6. **Setup Frontend**
```bash
cd ../frontend
npm install
npm run build
```

7. **Configure nginx**
```bash
sudo nano /etc/nginx/sites-available/default
```

Add configuration:
```nginx
server {
    listen 80 default_server;
    server_name your-domain.com;

    # Frontend
    location / {
        root /home/ubuntu/TODOLISTAPP/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Enable SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: DigitalOcean App Platform

1. **Connect GitHub Repository**
   - Link your GitHub account to DigitalOcean
   - Select the repository

2. **Configure Services**
   - Backend service: `npm start` in `/backend`
   - Frontend service: `npm run build` in `/frontend`

3. **Environment Variables**
   - Add `JWT_SECRET`
   - Add `NODE_ENV=production`

4. **Database**
   - Use DigitalOcean Managed PostgreSQL

### Option 4: Docker Deployment

1. **Create Dockerfile for Backend**
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

2. **Create Dockerfile for Frontend**
```dockerfile
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

3. **Docker Compose**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    volumes:
      - ./data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=todolist
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

4. **Deploy**
```bash
docker-compose up -d
```

## Performance Optimization

### Frontend
1. **Build Optimization**
```bash
npm run build
# Check bundle size
npm install -g source-map-explorer
source-map-explorer 'dist/**/*.js'
```

2. **Image Optimization**
   - Compress images
   - Use appropriate formats (WebP)

3. **Code Splitting**
   - Implement lazy loading for routes
   - Split large components

### Backend
1. **Database Indexing**
```sql
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

2. **Caching**
   - Implement Redis for session management
   - Cache frequently accessed data

3. **Compression**
```javascript
const compression = require('compression');
app.use(compression());
```

## Monitoring & Logging

### Backend Logging
```bash
npm install winston
```

### Error Tracking
- Sentry integration
- Error notifications
- Performance monitoring

### Analytics
- Track user activity
- Monitor performance
- Identify bottlenecks

## Backup Strategy

### Database Backups
```bash
# PostgreSQL backup
pg_dump -U postgres todolist > backup.sql

# Automated daily backup
0 2 * * * pg_dump -U postgres todolist > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Restore
```bash
psql -U postgres todolist < backup.sql
```

## Scaling Considerations

### Horizontal Scaling
1. Load balancer (nginx, HAProxy)
2. Multiple backend instances
3. Shared database (PostgreSQL)
4. Session storage (Redis)

### Vertical Scaling
1. Increase server resources (CPU, RAM)
2. Database optimization
3. Caching strategies

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Database Connection Error**
- Check database credentials
- Verify database is running
- Check firewall rules

**CORS Issues**
- Update CORS configuration
- Verify API URL
- Check headers

**Out of Memory**
- Increase server memory
- Implement caching
- Optimize queries

## Maintenance

### Regular Tasks
- [ ] Database maintenance
- [ ] Security patches
- [ ] Dependency updates
- [ ] Log rotation
- [ ] Backup verification

### Update Process
1. Test in staging
2. Create database backup
3. Deploy to production
4. Monitor for errors
5. Rollback if needed

## Rollback Plan

1. **Prepare**
   - Keep previous version tagged
   - Document current state

2. **Execute Rollback**
```bash
git revert <commit-hash>
git push
```

3. **Database Rollback**
   - Restore from backup if needed
   - Verify data integrity

## Security Best Practices

1. **Dependencies**
   - Regularly update packages
   - Audit for vulnerabilities
   ```bash
   npm audit
   npm audit fix
   ```

2. **Secrets Management**
   - Use environment variables
   - Never commit secrets
   - Rotate regularly

3. **Access Control**
   - Restrict SSH access
   - Use key-based authentication
   - Implement firewall rules

4. **HTTPS**
   - Always use SSL/TLS
   - Keep certificates updated
   - Use security headers

## Support & Troubleshooting

For deployment issues, check:
- Application logs
- Server logs
- Database logs
- Network configuration

---

**Ready to deploy? Follow the steps for your chosen platform above!** 🚀
