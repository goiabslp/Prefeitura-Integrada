import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega todas as variáveis de ambiente (mesmo sem prefixo VITE_) para podermos usar API_KEY
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    define: {
      // Injeta a API_KEY explicitamente no bundle do cliente
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Previne erros em bibliotecas que tentam acessar process.env.NODE_ENV
      'process.env': {}
    }
  }
})