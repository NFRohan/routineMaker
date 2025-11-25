# RoutineMaker - Multi-Service Setup Guide

This guide explains how to start all the services for the RoutineMaker application for local development.

## Architecture Overview

RoutineMaker consists of three separate services:

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **Auth Service** | 8001 | FastAPI | User authentication (login/register) |
| **Backend Service** | 8000 | FastAPI | Routine and session management |
| **Frontend** | 5173 | React + Vite | User interface |

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ and npm installed
- All dependencies installed (see below)

## Installation

### 1. Backend Services (Auth + Backend)

```bash
# Install auth_service dependencies
cd auth_service
pip install -r requirements.txt

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### 2. Frontend

```bash
cd frontend
npm install
```

## Starting the Services

You need to start all three services in **separate terminal windows**.

### Terminal 1: Auth Service (Port 8001)

```bash
cd auth_service
python -m uvicorn main:app --reload --port 8001
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

### Terminal 2: Backend Service (Port 8000)

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

### Terminal 3: Frontend (Port 5173)

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Accessing the Application

Once all three services are running, open your browser and navigate to:

**http://localhost:5173**

## Service Endpoints

### Auth Service (Port 8001)
- `POST /register` - Create new user account
- `POST /login` - Authenticate and get JWT token

### Backend Service (Port 8000)
- `GET /routines/mine` - Get authenticated user's routines
- `POST /routines/` - Create a new routine
- `GET /routines/{routine_id}` - Get specific routine
- `PUT /routines/{routine_id}` - Update routine
- `POST /routines/{routine_id}/sessions/` - Add session to routine
- `PUT /sessions/{session_id}/cancel` - Cancel/uncancel session
- `DELETE /sessions/{session_id}` - Delete session
- `GET /routines/{routine_id}/export` - Export routine as PDF

### Frontend (Port 5173)
- `/` - Home page / Dashboard
- `/login` - Login page
- `/signup` - Registration page
- `/routine/:id` - View/edit specific routine

## Troubleshooting

### Port Already in Use

If you get an error like "Address already in use", another application is using that port.

**Windows:**
```powershell
# Find what's using port 8001
netstat -ano | findstr :8001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Import Errors

If you see `ImportError: attempted relative import with no known parent package`:
- Make sure you're using `python -m uvicorn main:app` instead of `uvicorn main:app`
- Ensure you're in the correct directory (auth_service or backend)

### CORS Errors

If the frontend can't connect to the backend:
- Verify all three services are running
- Check that ports match the configuration (8001 for auth, 8000 for backend, 5173 for frontend)
- Clear browser cache and reload

### Database Not Found

The SQLite databases (`auth.db` and `routines.db`) are created automatically on first run. If you need to reset:
```bash
# From the project root
rm auth.db routines.db
```

Then restart the services to recreate fresh databases.

## Development Notes

- All services support hot reload - changes are automatically detected
- The auth service and backend share the same JWT secret for token validation
- Frontend uses separate axios instances for auth (8001) and backend (8000) services
- Legacy creator_token support is maintained for backward compatibility

## Production Deployment

For production, you would typically:
1. Use environment variables for configuration (ports, secrets, database URLs)
2. Run services behind a reverse proxy (nginx)
3. Use production WSGI server (gunicorn) instead of uvicorn --reload
4. Build frontend for production (`npm run build`)
5. Use PostgreSQL instead of SQLite
6. Enable HTTPS/TLS

---

**Happy Coding! 🚀**
