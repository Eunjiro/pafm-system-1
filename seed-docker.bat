@echo off
REM PAFM System - Database Seeding Script for Docker (Windows)

echo.
echo ============================================
echo   PAFM System - Database Seeding
echo ============================================
echo.

echo [INFO] Starting database seeding...
echo.

REM Seed Burial Cemetery Service
echo [INFO] Seeding Burial ^& Cemetery Service...
docker compose exec -T burial-cemetery npx prisma db seed 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Seed script not found. Creating admin user...
    docker compose exec -T burial-cemetery node create-admin.js 2>nul
    if %errorlevel% neq 0 (
        echo [WARN] No create-admin script found
    ) else (
        echo [OK] Admin user created
    )
) else (
    echo [OK] Burial ^& Cemetery seeded
)

echo.

REM Seed Asset Inventory Service
echo [INFO] Seeding Asset Inventory Service...
docker compose exec -T asset-inventory npx prisma db seed 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Asset Inventory seed script not found
) else (
    echo [OK] Asset Inventory seeded
)

echo.

REM Seed Facility Management Service
echo [INFO] Seeding Facility Management Service...
docker compose exec -T facility-management npx prisma db seed 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Facility Management seed script not found
) else (
    echo [OK] Facility Management seeded
)

echo.
echo ============================================
echo   Seeding Complete!
echo ============================================
echo.
echo Default credentials:
echo   Admin:
echo     Email: admin@pafm.gov.ph
echo     Password: admin123
echo.
echo   Citizen:
echo     Email: citizen@example.com  
echo     Password: admin123
echo.
echo Remember to change these passwords!
echo.
pause
