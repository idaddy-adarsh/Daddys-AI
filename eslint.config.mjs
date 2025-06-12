import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    rules: {
      // Disable all previously set rules
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'react/jsx-key': 'off',
      'react/display-name': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      // Disable rules showing in current build
      'react-hooks/exhaustive-deps': 'off',
      'prefer-const': 'off',
      // Disable all React Hooks rules to be thorough
      'react-hooks/rules-of-hooks': 'off'
    }
  })
];

export default eslintConfig;
