import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Typography System (shadcn/ui 방식)
 * 총 4가지 텍스트 스타일로 통일
 */

// Typography variants using CVA
export const typographyVariants = cva('', {
  variants: {
    variant: {
      // 큰 제목 - 페이지 제목, 다이얼로그 제목, 섹션 헤더
      heading: 'text-lg font-semibold',

      // 버튼, 라벨, 메뉴 항목, 중요한 정보
      label: 'text-sm font-medium',

      // 일반 본문, 설명글, 기본 텍스트
      body: 'text-sm font-normal',

      // 작은 정보, 캡션, 배지, 보조 설명
      caption: 'text-xs font-normal',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

// 개별 클래스명들 (기존 코드에서 className으로 직접 사용)
export const typography = {
  heading: 'text-lg font-semibold', // 큰 제목
  label: 'text-sm font-medium', // 버튼, 라벨
  body: 'text-sm font-normal', // 일반 본문
  caption: 'text-xs font-normal', // 작은 정보
} as const;

// 타입 정의
export type TypographyVariant = keyof typeof typography;

// 유틸리티 함수
export function getTypographyClass(variant: TypographyVariant, className?: string) {
  return cn(typography[variant], className);
}
