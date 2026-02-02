# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web/ .
RUN npm run build

# Stage 2: Final Image
FROM python:3.11-slim
WORKDIR /app

# Install Node.js runtime and curl for healthchecks
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Copy frontend standalone build from builder
# Next.js standalone includes the folder structure if build in a subdirectory
COPY --from=frontend-builder /app/web/.next/standalone ./
# Static assets must be at .next/static relative to server.js location
COPY --from=frontend-builder /app/web/.next/static ./.next/static
# Public assets also need to be at root level
COPY --from=frontend-builder /app/web/public ./public

# Setup start script
COPY start.sh .
RUN chmod +x start.sh

# Expose the port (Render uses $PORT, defaults to 10000 here for local testing)
EXPOSE 10000

CMD ["./start.sh"]
