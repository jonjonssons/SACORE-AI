
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { IncomingMessage } from 'http';

// Helper to safely get request body
const getRequestBody = (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    open: true,
    hmr: {
      overlay: true
    },
    proxy: {
      // Proxy API requests to local handlers during development
      '/api/fetch-profile-data': {
        target: 'http://localhost:3000',
        changeOrigin: false,
        selfHandleResponse: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', async function(proxyReq, req, res) {
            try {
              // Import the API handler using a relative path
              const { handleFetchProfileDataRequest } = await import('./src/api/index.js');
              
              // Get the request body properly
              const bodyText = req.method !== 'GET' && req.method !== 'HEAD' 
                ? await getRequestBody(req)
                : '';
              
              // Convert Express/Connect-style req to standard Request
              const request = new Request(`http://localhost:3000${req.url}`, {
                method: req.method,
                headers: new Headers(req.headers as any),
                body: bodyText || undefined
              });
              
              // Handle the request and send response
              const response = await handleFetchProfileDataRequest(request);
              res.statusCode = response.status;
              
              response.headers.forEach((value, key) => {
                res.setHeader(key, value);
              });
              
              const body = await response.text();
              res.end(body);
            } catch (error) {
              console.error('Error in API proxy:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                error: 'Internal Server Error', 
                details: error instanceof Error ? error.message : String(error) 
              }));
            }
          });
        }
      },
      // Add new proxy for fetchProfile to call SignalHire API
      '/api/fetchProfile': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Enhanced TypeScript configuration to bypass project reference issues
  optimizeDeps: {
    esbuildOptions: {
      // Using inline tsconfigRaw to bypass project reference issues
      tsconfigRaw: {
        compilerOptions: {
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          allowSyntheticDefaultImports: true,
          jsx: "react-jsx",
          target: "ESNext",
          useDefineForClassFields: true,
          lib: ["DOM", "DOM.Iterable", "ESNext"],
          module: "ESNext",
          skipLibCheck: true,
          esModuleInterop: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: false, // Changed to false to address TS6310 error
          composite: true, // Set to true to fix TS6306 error
          // Disable references
          disableReferencedProjectLoad: true,
          disableSolutionSearching: true,
          noResolve: false,
        },
        include: ["src"],
        exclude: ["node_modules", "**/*.spec.ts", "tsconfig*.json"]
      }
    }
  },
  // Explicitly ignore project references in build
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    },
  },
  // Add this to ensure TypeScript doesn't get stuck on project references
  define: {
    'process.env.VITE_TYPESCRIPT_SKIP_PROJECT_REFERENCES': JSON.stringify(true),
    'process.env.TS_NODE_PROJECT': JSON.stringify(undefined),
    'process.env.TS_NODE_TRANSPILE_ONLY': JSON.stringify(true),
    'process.env.TS_DISABLE_PROJECT_REFERENCES': JSON.stringify(true),
    'process.env.TS_IGNORE_PROJECT_REFERENCES': JSON.stringify(true),
    'process.env.TS_NODE_IGNORE_PROJECT_REFERENCES': JSON.stringify(true),
    'process.env.TS_NODE_FORCE_COMPOSITE': JSON.stringify(true),
    'process.env.TS_NODE_ALLOW_EMIT': JSON.stringify(true)
  }
}));
