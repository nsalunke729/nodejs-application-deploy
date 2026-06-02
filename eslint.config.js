import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        files: ['**/*.js', '**/*.ts'],
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
        }
    }
];