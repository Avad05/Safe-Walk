import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts:[
      'subcoriaceous-isothermally-abdul.ngrok-free.dev'
    ],
    port: 3000
  }
})