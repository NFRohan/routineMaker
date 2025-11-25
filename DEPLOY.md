# RoutineMaker - Docker Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+

### First Time Setup

1. **Clone the repository** (if not already done)

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Generate secure secret keys:**
   ```bash
   python -c "import secrets; print('AUTH_SECRET_KEY=' + secrets.token_urlsafe(32))"
   python -c "import secrets; print('BACKEND_SECRET_KEY=' + secrets.token_urlsafe(32))"
   ```
   
   Copy these into your `.env` file

4. **Update database password in `.env`:**
   ```env
   POSTGRES_PASSWORD=your_strong_password
   DATABASE_URL=postgresql://routinemaker:your_strong_password@db:5432/routinemaker
   ```

5. **Build and start all services:**
   ```bash
   docker-compose up --build -d
   ```

6. **Wait for services to be ready** (about 30-60 seconds)

7. **Access the application:**
   - Frontend: http://localhost:3000
   - Auth API: http://localhost:3000/api/auth/docs
   - Backend API: http://localhost:3000/api/docs

---

## 📦 Services Architecture

| Service | Internal Port | External Port | Purpose |
|---------|--------------|---------------|---------|
| **PostgreSQL** | 5432 | 5432 | Database |
| **Auth Service** | 8001 | - | Authentication |
| **Backend** | 8000 | - | Business logic |
| **Frontend** | 80 | - | React UI |
| **Nginx** | 80 | 3000 | Reverse proxy |

All services communicate internally. Only Nginx is exposed externally on port 3000.

---

## 🛠️ Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f auth_service
docker-compose logs -f frontend
```

### Rebuild after code changes
```bash
docker-compose up --build -d
```

### Reset database (CAUTION: Deletes all data!)
```bash
docker-compose down -v
docker-compose up -d
```

### Access database
```bash
docker-compose exec db psql -U routinemaker -d routinemaker
```

---

## 🔧 Development Workflow

### Local Development (without Docker)
Continue using the existing setup:
```bash
# Terminal 1 - Auth Service
cd auth_service
python -m uvicorn main:app --reload --port 8001

# Terminal 2 - Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 3 - Frontend
cd frontend
npm run dev
```

### Production/Staging (with Docker)
Use Docker Compose for consistency with production environment.

---

## 🐛 Troubleshooting

### Services won't start
1. Check if ports are available:
   ```bash
   netstat -ano | findstr :3000
   netstat -ano | findstr :5432
   ```

2. Check logs:
   ```bash
   docker-compose logs
   ```

### Database connection errors
1. Ensure PostgreSQL is healthy:
   ```bash
   docker-compose ps
   ```

2. Check DATABASE_URL in `.env` matches POSTGRES_PASSWORD

### Frontend can't reach backend
1. Verify Nginx is running:
   ```bash
   docker-compose ps nginx
   ```

2. Check Nginx logs:
   ```bash
   docker-compose logs nginx
   ```

### Clean start
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build -d
```

---

## 🌐 Production Deployment

For production deployment:

1. **Update environment variables:**
   - Use strong passwords
   - Generate new secret keys
   - Set proper domain names

2. **Add SSL/HTTPS** (recommended):
   - Use Let's Encrypt with Certbot
   - Or cloud provider SSL (AWS ACM, CloudFlare, etc.)

3. **Database backups:**
   ```bash
   docker-compose exec db pg_dump -U routinemaker routinemaker > backup.sql
   ```

4. **Monitoring:**
   - Set up log aggregation
   - Monitor container health
   - Set up alerts

---

## 📊 Database Migration from SQLite

If you have existing data in SQLite:

1. Export from SQLite
2. Transform to PostgreSQL format
3. Import using `psql`

Contact support for migration scripts if needed.

---

## 🔒 Security Best Practices

✅ Never commit `.env` files  
✅ Use strong, unique passwords  
✅ Regularly update dependencies  
✅ Monitor logs for suspicious activity  
✅ Backup database regularly  
✅ Keep Docker images updated

---

## 📞 Support

For issues or questions:
- Check logs first: `docker-compose logs`
- Review this documentation
- Check GitHub issues

Happy deploying! 🎉
