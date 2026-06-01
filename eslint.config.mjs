import { createRequire } from 'node:module';
import prettierConfig from 'eslint-config-prettier/flat';

const require = createRequire(import.meta.url);

const eslintConfig = [
  ...require('eslint-config-next/core-web-vitals'),
  ...require('eslint-config-next/typescript'),
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // 사용되지 않는 변수 경고
      '@typescript-eslint/no-explicit-any': 'warn', // any 타입 허용 / 경고만
    },
  },
];

export default eslintConfig;
