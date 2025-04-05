# Flexa WaitFree Next.js

## 주요 기술 스택:

- Next.js 15
- React 19
- Tailwind CSS 3
- shadcn/ui
- plotly.js
- Supabase

## 실행 명령어:

```shell
$ npm install --force
$ npm run dev
```

package.json의 scripts 참조

## 도커 빌드 및 푸시 (ECR 기준)

필요에 따라 아래 명령어에서 태그(예: v0.1.0-rc.1)를 변경해서 사용합니다.

```shell
# AWS ECR Login
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 531915313382.dkr.ecr.ap-northeast-2.amazonaws.com

# Docker build
docker build --platform linux/amd64 --provenance false -t coop/flexa-waitfree-next:release-0.1.0 -f docker/production/Dockerfile .

# Docker tag
docker tag coop/flexa-waitfree-next:release-0.1.0 531915313382.dkr.ecr.ap-northeast-2.amazonaws.com/coop/flexa-waitfree-next:release-0.1.0

# Docker push
docker push 531915313382.dkr.ecr.ap-northeast-2.amazonaws.com/coop/flexa-waitfree-next:release-0.1.0
```

## 폴더 구조:

### 1차 배포시까지 활용 구조

#### 예시:

```bash
src/
├── actions/
├── app/
│   ├── home/
│   │   ├── _components/ # 해당 페이지에서만 사용하는 컴포넌트
│   │   │   ├── HomeAccordion.tsx
│   │   │   └── HomeSlider.tsx
│   │   └── page.tsx
│   └── profile/
│       ├── _components/ # 해당 페이지에서만 사용하는 컴포넌트
│       │   ├── TabProfile.tsx
│       │   └── TabPassword.tsx
│       └── page.tsx
├── components/ # 전역에서 사용하는 컴포넌트
│   ├── charts/
│   ├── icons/
│   ├── popups/
│   └── uis/
├── constants/
├── hooks/
├── lib/
├── queries/
├── services/
├── stores/
├── types/
└── utils/
```

### 이후에는 `기능 분할 설계(Feature-Sliced Design, FSD)` 구조를 사용할 예정

- 해당 구조는 프론트엔드 개발에 대한 전반적인 지식이 필요. (진입장벽이 있음.)
- 때문에 1차 완성 후 리팩토링 진행할 예정.
- 아래와 같은 자료를 통해 충분히 학습할 것을 권장.
  - [(번역) 기능 분할 설계 - 최고의 프런트엔드 아키텍처 | emewjin.log](https://emewjin.github.io/feature-sliced-design/)
  - [아직도 React 폴더 구조로 고민하고 계신가요? FSD 한 번 써보세요[제로초뉴스] - YouTube](https://www.youtube.com/watch?v=64Fx5Y1gEOA&ab_channel=ZeroChoTV)

## 참고 사항:

- 프로젝트에 Supabase를 연결할 때 아래 레포지토리 구조를 참고해서 작업해주세요.

  - [next.js/examples/with-supabase at canary · vercel/next.js](https://github.com/vercel/next.js/tree/canary/examples/with-supabase)

- Docker, Makefile 등 프로젝트에 필요한 파일 생성시 참고해주세요.
  - https://github.com/vercel/next.js/tree/canary/examples/with-docker-multi-env
