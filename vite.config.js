import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			// All requests starting with /api will be proxied
			'/api': {
				target: 'https://sessionserver.mojang.com/session/minecraft/profile/', // **Replace with the actual base URL of your 3rd party API**
				changeOrigin: true, // Needed for virtual hosted sites
				rewrite: (path) => path.replace(/^\/api/, '') // Remove the /api prefix when forwarding the request
			}
		}
  	}	
})