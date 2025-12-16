import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill para permitir o uso de process.env.API_KEY no código do cliente
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Garante que process.env não quebre se acessado de outra forma
      'process.env': {}
    }
  }
})