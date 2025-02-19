import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // 사용되지 않는 변수 경고
      '@typescript-eslint/no-explicit-any': 'warn', // any 타입 허용 / 경고만
    },
  },
];

export default eslintConfig;
