import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),  
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Pastikan semua file di folder public yang dibutuhkan didaftarkan di sini
      includeAssets: [
        'favicon.ico', 
        'apple-touch-icon.png', 
        'favicon-16x16.png', 
        'favicon-32x32.png'
      ],
      manifest: {
        name: 'Kira School Attendance',
        short_name: 'KiraScan',
        description: 'Aplikasi Presensi QR Code & Barcode Siswa/Guru',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Penting agar icon tidak terpotong di Android
          }
        ]
      },
      devOptions: {
        enabled: true 
      }
    })
  ],
})