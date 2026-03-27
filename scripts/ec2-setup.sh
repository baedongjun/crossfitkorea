#!/bin/bash
# EC2 Ubuntu 초기 설정 스크립트 (최초 1회만 실행)
set -e

echo "===== HyroWOD EC2 초기 설정 시작 ====="

# ── 1. 패키지 업데이트 ──────────────────────────
echo "[1/6] 패키지 업데이트..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ── 2. Docker 설치 ───────────────────────────────
echo "[2/6] Docker 설치..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ubuntu 사용자를 docker 그룹에 추가 (재로그인 필요)
sudo usermod -aG docker ubuntu

# ── 3. AWS CLI 설치 ──────────────────────────────
echo "[3/6] AWS CLI 설치..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt-get install -y unzip
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/

# ── 4. Certbot 설치 (Let's Encrypt SSL) ──────────
echo "[4/6] Certbot 설치..."
sudo apt-get install -y certbot

# ── 5. 디렉토리 구조 생성 ────────────────────────
echo "[5/6] 디렉토리 생성..."
mkdir -p /home/ubuntu/hyrowod/{nginx,scripts}
sudo mkdir -p /var/www/certbot

# ── 6. docker-compose alias ─────────────────────
echo "[6/6] docker-compose alias 설정..."
echo 'alias docker-compose="docker compose"' >> /home/ubuntu/.bashrc

echo ""
echo "===== 초기 설치 완료 ====="
echo ""
echo "다음 단계를 수동으로 진행하세요:"
echo ""
echo "1) 환경변수 파일 작성:"
echo "   vim /home/ubuntu/hyrowod/.env.prod"
echo "   chmod 600 /home/ubuntu/hyrowod/.env.prod"
echo ""
echo "2) 설정 파일 업로드 (로컬에서 실행):"
echo "   scp -i your-key.pem nginx/nginx.conf ubuntu@EC2_IP:/home/ubuntu/hyrowod/nginx/"
echo "   scp -i your-key.pem docker-compose.prod.yml ubuntu@EC2_IP:/home/ubuntu/hyrowod/"
echo "   scp -i your-key.pem scripts/deploy.sh ubuntu@EC2_IP:/home/ubuntu/hyrowod/scripts/"
echo "   chmod +x /home/ubuntu/hyrowod/scripts/deploy.sh"
echo ""
echo "3) SSL 인증서 발급 (nginx 없이 standalone 모드):"
echo "   sudo certbot certonly --standalone -d hyrowod.com -d www.hyrowod.com"
echo ""
echo "4) docker 그룹 적용을 위해 재로그인 후 첫 배포:"
echo "   main 브랜치에 push → GitHub Actions 자동 실행"
