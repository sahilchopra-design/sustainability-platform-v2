# Multi-stage build: Node builds the React frontend, Python serves both the
# API and the built frontend from a single process (backend/server.py already
# mounts frontend/build/ as static files when the directory exists — see the
# "Serve frontend build (production mode)" section near the bottom of
# backend/server.py). One Railway service, one URL, no CORS between frontend
# and backend since they're same-origin in production.

# ── Stage 1: build the React app ────────────────────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python backend, serving the built frontend ─────────────────────
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/build ./frontend/build

WORKDIR /app/backend

# Railway assigns $PORT at runtime; default to 8001 for local `docker run`.
ENV PORT=8001
EXPOSE 8001
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT}"]
