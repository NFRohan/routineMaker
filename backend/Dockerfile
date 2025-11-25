# Use official Python runtime as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for ReportLab (PDF generation)
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libfreetype6-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run with gunicorn (production)
CMD ["gunicorn", "main:app", "--workers", "2", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
