import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

function createGatewayProxyMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    // Enable CORS for frontend
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Method Not Allowed. Expected POST with proxy payload.' }))
      return
    }

    const chunks: Buffer[] = []
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    req.on('end', async () => {
      try {
        const rawBody = Buffer.concat(chunks).toString('utf-8')
        const payload = rawBody ? JSON.parse(rawBody) : {}
        const {
          baseUrl,
          endpoint,
          targetUrl,
          method = 'GET',
          apiKey,
          headers: customHeaders,
          body,
          stream,
        } = payload

        // URL Slash Sanitization: strip trailing slashes and prevent duplicate endpoints
        let fullDestinationUrl = ''
        if (targetUrl && typeof targetUrl === 'string') {
          fullDestinationUrl = targetUrl.trim()
        } else if (baseUrl && typeof baseUrl === 'string') {
          const cleanBase = baseUrl.trim().replace(/\/+$/, '')
          const cleanEndpoint = (endpoint || '').trim()

          if (cleanEndpoint === '/chat/completions' || cleanEndpoint.endsWith('/chat/completions')) {
            if (cleanBase.endsWith('/chat/completions')) {
              fullDestinationUrl = cleanBase
            } else if (cleanBase.endsWith('/models')) {
              fullDestinationUrl = `${cleanBase.replace(/\/models$/, '')}/chat/completions`
            } else {
              fullDestinationUrl = `${cleanBase}/chat/completions`
            }
          } else if (cleanEndpoint === '/models' || cleanEndpoint.endsWith('/models')) {
            if (cleanBase.endsWith('/models')) {
              fullDestinationUrl = cleanBase
            } else if (cleanBase.endsWith('/chat/completions')) {
              fullDestinationUrl = `${cleanBase.replace(/\/chat\/completions$/, '')}/models`
            } else {
              fullDestinationUrl = `${cleanBase}/models`
            }
          } else if (cleanEndpoint) {
            fullDestinationUrl = `${cleanBase}/${cleanEndpoint.replace(/^\/+/, '')}`
          } else {
            fullDestinationUrl = cleanBase
          }
        } else {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Missing baseUrl or targetUrl in proxy payload' }))
          return
        }

        // Handle relative URLs if routed to proxy
        if (fullDestinationUrl.startsWith('/')) {
          const host = req.headers.host || 'localhost:5173'
          fullDestinationUrl = `http://${host}${fullDestinationUrl}`
        }

        // Build upstream headers dynamically without hardcoding any provider
        const upstreamHeaders: Record<string, string> = {
          Accept: stream ? 'text/event-stream, application/json, */*' : 'application/json, */*',
          'User-Agent': 'ModelGateway/1.0 (Mozilla/5.0; Enterprise AI Gateway)',
        }

        if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
          upstreamHeaders['Authorization'] = apiKey.trim().startsWith('Bearer ')
            ? apiKey.trim()
            : `Bearer ${apiKey.trim()}`
        }

        if (customHeaders) {
          if (Array.isArray(customHeaders)) {
            for (const h of customHeaders) {
              if (h && h.key && typeof h.key === 'string' && h.key.trim() !== '') {
                upstreamHeaders[h.key.trim()] = String(h.value ?? '')
              }
            }
          } else if (typeof customHeaders === 'object') {
            for (const [k, v] of Object.entries(customHeaders)) {
              if (k && k.trim() !== '') {
                upstreamHeaders[k.trim()] = String(v ?? '')
              }
            }
          }
        }

        let upstreamBodyStr: string | undefined = undefined
        if (body !== undefined && body !== null && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          upstreamHeaders['Content-Type'] = 'application/json'
          upstreamBodyStr = typeof body === 'string' ? body : JSON.stringify(body)
        }

        const abortController = new AbortController()
        res.on('close', () => {
          if (!res.writableEnded) {
            abortController.abort()
          }
        })

        const upstreamRes = await fetch(fullDestinationUrl, {
          method,
          headers: upstreamHeaders,
          body: upstreamBodyStr,
          signal: abortController.signal,
        })

        const contentType = upstreamRes.headers.get('content-type') || ''

        // Detailed error messages: capture status and actual message from upstream JSON/text
        if (!upstreamRes.ok) {
          const errText = await upstreamRes.text().catch(() => '')
          let parsedErr: any = null
          try {
            parsedErr = JSON.parse(errText)
          } catch (_) {}

          let message = ''
          if (parsedErr) {
            message =
              parsedErr.error?.message ||
              parsedErr.message ||
              parsedErr.detail ||
              (typeof parsedErr.error === 'string' ? parsedErr.error : JSON.stringify(parsedErr))
          } else {
            message = errText || upstreamRes.statusText || 'Upstream request failed'
          }

          res.statusCode = upstreamRes.status
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              status: upstreamRes.status,
              statusText: upstreamRes.statusText,
              error: message,
              details: parsedErr || errText,
            })
          )
          return
        }

        // SSE Streaming Passthrough for chat completions
        const isStreaming = stream || contentType.includes('text/event-stream')
        if (isStreaming && upstreamRes.body) {
          res.writeHead(upstreamRes.status, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          })

          const reader = upstreamRes.body.getReader()
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              if (!res.writableEnded) {
                res.write(value)
                if (typeof (res as any).flush === 'function') {
                  ;(res as any).flush()
                }
              }
            }
          } catch (readErr: any) {
            // Client disconnect or stream abort
          } finally {
            if (!res.writableEnded) {
              res.end()
            }
          }
          return
        }

        // Standard JSON or buffer response
        const arrayBuf = await upstreamRes.arrayBuffer()
        res.statusCode = upstreamRes.status
        res.setHeader('Content-Type', contentType || 'application/json')
        res.end(Buffer.from(arrayBuf))
      } catch (err: any) {
        if (err.name === 'AbortError' || res.writableEnded) {
          if (!res.writableEnded) res.end()
          return
        }
        if (!res.headersSent) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              status: 500,
              error: `Proxy Error: ${err.message || 'Unable to connect to upstream server'}`,
            })
          )
        } else {
          res.end()
        }
      }
    })
  }
}

import { createLocalGgufMiddleware, createGatewayConfigMiddleware } from './src/gateway/server/local-gguf-middleware.ts'

export function gatewayProxyPlugin(): Plugin {
  return {
    name: 'gateway-dynamic-cors-proxy',
    configureServer(server) {
      server.middlewares.use('/api/gateway/proxy', createGatewayProxyMiddleware())
      server.middlewares.use('/api/gateway/config', createGatewayConfigMiddleware())
      server.middlewares.use('/api/gateway/local-gguf', createLocalGgufMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/gateway/proxy', createGatewayProxyMiddleware())
      server.middlewares.use('/api/gateway/config', createGatewayConfigMiddleware())
      server.middlewares.use('/api/gateway/local-gguf', createLocalGgufMiddleware())
    },
  }
}

import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), gatewayProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
})

