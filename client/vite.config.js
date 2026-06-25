import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Serve /uploads/* directly from the server's uploads directory on disk.
// This means uploaded files are available immediately without going through
// the backend — so nodemon restarts never cause ECONNREFUSED for media files.
function serveUploads() {
  const uploadsRoot = path.resolve(__dirname, '../server/uploads')

  const MIME_MAP = {
    // Images
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png',  '.webp': 'image/webp',
    '.gif': 'image/gif',  '.svg': 'image/svg+xml',
    // Audio
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',  '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    // Video
    '.mp4': 'video/mp4',  '.webm': 'video/webm',
    '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
  }

  return {
    name: 'serve-uploads',
    configureServer(server) {
      server.middlewares.use('/uploads', (req, res, next) => {
        // Strip query string and normalize slashes for Windows
        const relPath = req.url.replace(/\?.*$/, '').replace(/\\/g, '/')
        const filePath = path.join(uploadsRoot, relPath)
        try {
          const stat = fs.statSync(filePath)
          if (stat.isFile()) {
            const ext = path.extname(filePath).toLowerCase()
            const contentType = MIME_MAP[ext] || 'application/octet-stream'
            res.setHeader('Content-Type', contentType)
            res.setHeader('Cache-Control', 'no-store')
            res.setHeader('Accept-Ranges', 'bytes')
            fs.createReadStream(filePath).pipe(res)
            return
          }
        } catch {
          // file not found — fall through to next middleware
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveUploads()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      // '/uploads' is intentionally NOT proxied — handled by serveUploads() plugin above
    },
  },
})
