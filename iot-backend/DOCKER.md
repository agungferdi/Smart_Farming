# 🐳 Docker Setup for Smart Farming IoT Backend

This document provides a complete guide for using Docker with the Smart Farming IoT Backend project.

## 📋 Prerequisites

- Docker installed on your system
- Docker Compose installed
- Node.js (for local development)

## 🏗️ Docker Architecture

### Multi-Stage Dockerfile

The Dockerfile uses a multi-stage build for optimization:

1. **Builder Stage**: Installs all dependencies, generates Prisma client, builds TypeScript
2. **Production Stage**: Creates optimized production image with only runtime dependencies

### Key Features

- ✅ Multi-stage build for smaller production images
- ✅ Non-root user for security
- ✅ Health checks included
- ✅ Optimized layer caching
- ✅ Prisma client generation
- ✅ TypeScript compilation

## 🚀 Available Commands

### Development Commands

```bash
# Start development environment
npm run docker:dev

# Stop development environment
npm run docker:dev:down

# View logs
npm run docker:dev:logs

# Rebuild and restart
npm run docker:dev:rebuild
```

### Production Commands

```bash
# Build production image
npm run docker:prod:build

# Build and run production container
npm run docker:build
npm run docker:run
```

### Utility Commands

```bash
# Clean up Docker system
npm run docker:clean
```

## 🔧 Development Setup

### 1. Environment Configuration

Copy the environment template:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="your_supabase_connection_string"
DIRECT_URL="your_supabase_direct_connection_string"
```

### 2. Start Development Environment

```bash
npm run docker:dev
```

This will:

- Build the Docker image
- Start the backend service
- Enable hot reload with volume mounts
- Expose the API on http://localhost:3000

### 3. Access the Application

- **API Root**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **API Documentation**: http://localhost:3000/api/info

## 📁 Volume Mounts (Development)

- **Source Code**: `.:/app` - Enables hot reload
- **Node Modules**: `node_modules:/app/node_modules` - Avoids conflicts
- **Prisma**: `./prisma:/app/prisma` - Prisma schema changes

## 🏭 Production Deployment

### Build Production Image

```bash
npm run docker:prod:build
```

### Run Production Container

```bash
docker run -p 3000:3000 --env-file .env smart-farming-backend:prod
```

### Environment Variables (Production)

Required environment variables for production:

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL`
- `DIRECT_URL`

## 🔍 Health Checks

The Docker container includes health checks:

- **Endpoint**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**

   ```bash
   # Stop existing containers
   npm run docker:dev:down

   # Or use different port
   docker-compose up -p 3001:3000
   ```

2. **Database Connection Issues**

   - Check your `.env` file
   - Verify Supabase connection strings
   - Ensure network connectivity

3. **Build Failures**

   ```bash
   # Clean Docker cache
   npm run docker:clean

   # Rebuild from scratch
   npm run docker:dev:rebuild
   ```

4. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $(whoami) .
   ```

### Useful Docker Commands

```bash
# View running containers
docker ps

# View container logs
docker logs smart-farming-backend-dev

# Execute commands in container
docker exec -it smart-farming-backend-dev sh

# Remove all containers and images
docker system prune -a
```

## 📊 Monitoring

### Container Health

```bash
# Check container health status
docker inspect smart-farming-backend-dev | grep Health -A 10
```

### Application Logs

```bash
# Follow application logs
npm run docker:dev:logs

# View specific container logs
docker logs -f smart-farming-backend-dev
```

## 🔒 Security Features

- Non-root user (`hono:nodejs`)
- Minimal attack surface (Alpine Linux)
- Health checks for monitoring
- No sensitive data in image layers
- Environment variable configuration

## 🚀 Performance Optimizations

- Multi-stage builds
- Layer caching optimization
- Named volumes for node_modules
- Production dependency pruning
- Health check monitoring

## 📈 Scaling

For production scaling, consider:

1. **Load Balancing**: Use nginx or cloud load balancers
2. **Container Orchestration**: Kubernetes or Docker Swarm
3. **Database Scaling**: Supabase handles this automatically
4. **Monitoring**: Add application performance monitoring

## 🔄 CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: npm run docker:prod:build
      - name: Deploy to production
        run: # Your deployment commands
```

## 📝 Notes

- The development setup uses hot reload for efficient development
- Production images are optimized for size and security
- All sensitive configuration is handled via environment variables
- Health checks ensure container reliability
