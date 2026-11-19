import { defineConfig } from 'vite';
export default defineConfig({ base: process.env.GITHUB_ACTIONS ? '/livercity-63/' : '/', build: { target: 'es2022', sourcemap: true } });
