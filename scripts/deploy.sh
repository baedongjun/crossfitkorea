#!/bin/bash
# EC2 서버에서 실행되는 배포 스크립트
set -e

echo "===== CrossFit Korea 배포 시작 ====="

# 환경변수 로드
if [ -f /home/ubuntu/crossfitkorea/.env.prod ]; then
  export $(grep -v '^#' /home/ubuntu/crossfitkorea/.env.prod | xargs)
fi

APP_DIR="/home/ubuntu/crossfitkorea"
ECR_REGISTRY="${ECR_REGISTRY}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# ECR 로그인
echo "[1/4] ECR 로그인..."
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"

# 최신 이미지 pull
echo "[2/4] 이미지 pull..."
docker pull "$ECR_REGISTRY/crossfitkorea-backend:$IMAGE_TAG"
docker pull "$ECR_REGISTRY/crossfitkorea-frontend:$IMAGE_TAG"

# docker-compose 업데이트
echo "[3/4] 서비스 재시작..."
cd "$APP_DIR"
# docker compose v2 (plugin) 또는 v1 모두 지원
COMPOSE_CMD="docker compose"
command -v docker-compose &>/dev/null && COMPOSE_CMD="docker-compose"

IMAGE_TAG=$IMAGE_TAG $COMPOSE_CMD -f docker-compose.prod.yml up -d --no-build

# 헬스체크
echo "[4/4] 헬스체크..."
sleep 15
if curl -sf http://localhost:8080/actuator/health > /dev/null; then
  echo "✓ 백엔드 정상"
else
  echo "✗ 백엔드 헬스체크 실패 - 롤백"
  $COMPOSE_CMD -f docker-compose.prod.yml down 2>/dev/null || true
  exit 1
fi

# 시드 데이터 실행 (ON CONFLICT DO NOTHING 이므로 중복 실행 안전)
SEED_FILE="$APP_DIR/seed.sql"
if [ -f "$SEED_FILE" ]; then
  echo "[5/5] 시드 데이터 실행..."
  cat "$SEED_FILE" | $COMPOSE_CMD -f docker-compose.prod.yml exec -T postgres psql -U "$DB_USERNAME" -d "$DB_NAME"
  echo "✓ 시드 데이터 완료"
fi

# 사용하지 않는 이미지 정리
docker image prune -f

echo "===== 배포 완료 ====="
