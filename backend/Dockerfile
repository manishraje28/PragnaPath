# Use official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies (build tools for some python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Downgrade bcrypt explicitly to avoid passlib issues (as we found in dev)
RUN pip install --no-cache-dir "bcrypt==4.0.1"

# Copy project
COPY . .

# Expose port (Render/Railway/etc usually set PORT env var, but 8000 is default)
EXPOSE 8000

# Command to run (using shell form to allow variable expansion if needed, but array is safer)
# using host 0.0.0.0 is critical for docker
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
