# Dyslexia Support Platform - Comprehensive Setup Script
# This script sets up the complete full-stack development environment
# Run with: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\setup.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dyslexia Support Platform" -ForegroundColor Cyan
Write-Host "Full-Stack Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Verify project structure
Write-Host "Verifying project structure..." -ForegroundColor Yellow

$requiredDirs = @("backend", "frontend", "backend/src", "backend/sql", "backend/src/middleware", "backend/src/routes")
$missingDirs = @()

foreach ($dir in $requiredDirs) {
    if (!(Test-Path $dir)) {
        $missingDirs += $dir
    }
}

if ($missingDirs.Count -gt 0) {
    Write-Host "[WARNING] Some directories are missing:" -ForegroundColor Yellow
    foreach ($dir in $missingDirs) {
        Write-Host "  - $dir" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Creating missing directories..." -ForegroundColor Yellow
    foreach ($dir in $missingDirs) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Write-Host "[OK] Missing directories created" -ForegroundColor Green
} else {
    Write-Host "[OK] All required directories exist" -ForegroundColor Green
}

Write-Host ""

# Check for Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check for npm
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm is not installed!" -ForegroundColor Red
    exit 1
}

# Check for Docker
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker found: $dockerVersion" -ForegroundColor Green
    $hasDocker = $true
} catch {
    Write-Host "[WARNING] Docker not installed (required for docker-compose)" -ForegroundColor Yellow
    $hasDocker = $false
}

Write-Host ""

# Setup Backend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Backend..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "backend"

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install --production=false
Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green

Write-Host ""
Set-Location ".."

# Setup Frontend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "frontend"

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install --production=false
Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green

Write-Host ""
Set-Location ".."

# Build Docker images if Docker is available
if ($hasDocker) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Building Docker Images..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Building backend Docker image..." -ForegroundColor Yellow
    docker-compose build
    Write-Host "[OK] Docker images built successfully" -ForegroundColor Green
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Dyslexia Support Platform is ready for development!" -ForegroundColor Green
Write-Host ""

Write-Host "PROJECT STRUCTURE:" -ForegroundColor Cyan
Write-Host "  backend/" -ForegroundColor White
Write-Host "    src/                    - Express server and routes" -ForegroundColor White
Write-Host "    middleware/             - Authentication middleware" -ForegroundColor White
Write-Host "    routes/                 - API endpoint handlers" -ForegroundColor White
Write-Host "    sql/                    - Database SQL files" -ForegroundColor White
Write-Host "    Dockerfile              - Container configuration" -ForegroundColor White
Write-Host "  frontend/                 - React (Vite) application" -ForegroundColor White
Write-Host "  docker-compose.yml        - Multi-container orchestration" -ForegroundColor White
Write-Host ""

Write-Host "QUICK START:" -ForegroundColor Cyan
Write-Host ""

if ($hasDocker) {
    Write-Host "1. Start Docker services (MySQL + Backend):" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Wait for MySQL to be ready (green 'healthy' status):" -ForegroundColor Yellow
    Write-Host "   docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Host "3. In a new terminal, start frontend:" -ForegroundColor Yellow
    Write-Host "   cd frontend" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Open browser:" -ForegroundColor Yellow
    Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor Green
    Write-Host "   Backend:   http://localhost:5000" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[DOCKER REQUIRED]" -ForegroundColor Red
    Write-Host "Install Docker from: https://docs.docker.com/get-docker/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then run: docker-compose up -d" -ForegroundColor White
    Write-Host ""
}

Write-Host "API ENDPOINTS:" -ForegroundColor Cyan
Write-Host "  GET  /api/health                      - Server health check" -ForegroundColor White
Write-Host "  GET  /api/db-status                   - Database connection status" -ForegroundColor White
Write-Host "  POST /api/parents/register            - Register new parent" -ForegroundColor White
Write-Host "  POST /api/parents/login               - Parent login (JWT)" -ForegroundColor White
Write-Host "  GET  /api/children                    - Get parent's children" -ForegroundColor White
Write-Host "  POST /api/children                    - Add new child" -ForegroundColor White
Write-Host "  GET  /api/assessments/child/:id       - Get child assessments" -ForegroundColor White
Write-Host "  POST /api/assessments                 - Record assessment" -ForegroundColor White
Write-Host "  GET  /api/activities                  - Get all activities" -ForegroundColor White
Write-Host "  POST /api/activities/track            - Track child activity progress" -ForegroundColor White
Write-Host ""

Write-Host "DATABASE INFO:" -ForegroundColor Cyan
Write-Host "  Host:     localhost (or 'mysql' in Docker)" -ForegroundColor White
Write-Host "  Port:     3306" -ForegroundColor White
Write-Host "  User:     root" -ForegroundColor White
Write-Host "  Password: dyslexia_password" -ForegroundColor White
Write-Host "  Database: dyslexia_db" -ForegroundColor White
Write-Host ""

Write-Host "AUTHENTICATION:" -ForegroundColor Cyan
Write-Host "  JWT Secret stored in backend/.env" -ForegroundColor White
Write-Host "  Change JWT_SECRET before production!" -ForegroundColor Red
Write-Host ""

Write-Host "DOCUMENTATION:" -ForegroundColor Cyan
Write-Host "  See README.md for detailed information" -ForegroundColor White
Write-Host ""

Write-Host "TROUBLESHOOTING:" -ForegroundColor Cyan
Write-Host "  - Docker: docker-compose logs backend" -ForegroundColor White
Write-Host "  - MySQL:  docker-compose logs mysql" -ForegroundColor White
Write-Host "  - Frontend: npm run dev (in frontend directory)" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Ready to start development!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

