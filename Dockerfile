FROM node:20-slim

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install --legacy-peer-deps

# 소스 코드 복사
COPY . .

# Next.js 애플리케이션 빌드
RUN npm run build

# 포트 설정
EXPOSE 3000

# Next.js 실행
CMD ["npm", "start", "--", "-p", "3000"] 