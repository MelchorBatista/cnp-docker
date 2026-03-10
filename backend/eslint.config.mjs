
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Archivos y carpetas a ignorar
  {
    ignores: ['build/**', 'node_modules/**'],
  },

  // Configuraciones recomendadas
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Configuración de Prettier (debe ir al final para sobreescribir reglas de estilo)
  prettierConfig,

  // Configuración personalizada
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-constant-condition': 'off'
    },
  }
);
