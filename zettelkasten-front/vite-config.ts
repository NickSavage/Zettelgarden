import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_URL': JSON.stringify(env.VITE_URL),
  },
})
