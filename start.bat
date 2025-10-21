@echo off
REM PAFM System - Quick Start Script for Windows
REM This script helps you quickly set up and run the entire system with Docker

echo.
echo ============================================
echo   PAFM System - Docker Setup (Windows)
echo ============================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo         Visit: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed.
    pause
    exit /b 1
)

echo [OK] Docker and Docker Compose are installed
echo.

REM Check if .env.production exists
if not exist .env.production (
    echo Creating .env.production file...
    copy .env.production.example .env.production
    echo.
    echo [IMPORTANT] Please edit .env.production and update:
    echo   - POSTGRES_PASSWORD
    echo   - JWT_SECRET
    echo   - NEXTAUTH_SECRET
    echo   - NEXTAUTH_URL
    echo.
    echo Press any key to open .env.production in notepad...
    pause
    notepad .env.production
) else (
    echo [OK] .env.production already exists
)

echo.
echo Building Docker images...
echo This may take 5-10 minutes on first run...
docker compose build

echo.
echo Starting all services...
docker compose up -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Service Status:
docker compose ps

echo.
echo ============================================
echo   PAFM System is now running!
echo ============================================
echo.
echo Access your application at:
echo   Frontend:              http://localhost:3000
echo   Burial ^& Cemetery:     http://localhost:3001/health
echo   Asset Inventory:       http://localhost:3003/health
echo   Facility Management:   http://localhost:3005/health
echo   Parks ^& Recreation:    http://localhost:3004/health
echo   Water ^& Drainage:      http://localhost:3006/health
echo.
echo Useful commands:
echo   View logs:        docker compose logs -f
echo   Stop services:    docker compose down
echo   Restart:          docker compose restart
echo   Check status:     docker compose ps
echo.
echo Setup complete! Your system is ready for demo.
echo.
pause
