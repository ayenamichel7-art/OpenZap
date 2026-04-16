@echo off
echo [OpenZap] Démarrage de l'infrastructure Docker (Ports Décalés)...
docker-compose up -d

echo [OpenZap] Verification de Laravel...
docker-compose exec app php artisan key:generate --quiet
docker-compose exec app php artisan migrate --force

echo [OpenZap] Demarrage du Frontend React (Indépendant)...
start cmd /k "cd frontend && npm run dev"

echo [OpenZap] Tout est prêt !
echo 🌍 Dashboard Laravel (API): http://localhost:9000
echo 💎 Frontend Web Premium: http://localhost:3000
echo 📦 MinIO Console (S3): http://localhost:9001 (User: openzap_admin)
echo 🤖 Evolution API: http://localhost:8081
pause
