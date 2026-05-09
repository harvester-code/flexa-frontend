import type { KnipConfig } from "knip";

const config: KnipConfig = {
  $schema: "https://unpkg.com/knip@latest/schema.json",
  entry: [
    // Next.js App Router entry points
    "src/app/**/page.tsx",
    "src/app/**/layout.tsx",
    "src/app/**/loading.tsx",
    "src/app/**/error.tsx",
    "src/app/**/not-found.tsx",
    "src/app/**/template.tsx",
    "src/app/**/route.ts",
    "src/app/**/route.tsx",
    // Middleware
    "src/middleware.ts",
    // Server Actions
    "src/actions/**/*.ts",
    // Next.js config
    "next.config.ts",
    "postcss.config.mjs",
    "tailwind.config.ts",
  ],
  project: ["src/**/*.{ts,tsx}"],
  ignore: [
    // Auto-generated
    "src/types/supabase.ts",
    ".next/**",
  ],
  ignoreDependencies: [
    // Used via PostCSS config, not imported directly
    "tailwindcss",
    "tailwindcss-animate",
    "postcss",
    // Used via Next.js plugin, not directly imported
    "@next/eslint-plugin-next",
    "eslint-config-next",
    "eslint-config-prettier",
    // Peer deps / tooling
    "prettier",
    "typescript",
  ],
  // Treat all re-exports as used (avoids barrel file noise)
  ignoreExportsUsedInFile: true,
};

export default config;
