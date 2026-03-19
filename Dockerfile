# ─── Stage 1: Build ───
FROM node:22-alpine AS builder

WORKDIR /app

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

# 의존성 설치 (레이어 캐싱 최적화)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 소스 복사 및 빌드
COPY . .
RUN pnpm build

# ─── Stage 2: Backend API (변환 서비스) ───
FROM node:22-alpine AS backend

WORKDIR /app

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

# 서버 의존성만 설치
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# 서버 코드 복사
COPY server/ ./server/

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]

# ─── Stage 3: Nginx (프론트엔드 정적 서빙) ───
FROM nginx:1.27-alpine AS production

# 보안: 불필요한 기본 설정 제거
RUN rm -rf /usr/share/nginx/html/*
RUN rm /etc/nginx/conf.d/default.conf

# nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 비-루트 사용자로 실행 (보안 강화)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 80

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
