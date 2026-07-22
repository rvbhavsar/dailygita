import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // postgres.js, bcryptjs and jsonwebtoken are CJS/native-ish and must not be
  // bundled — they run in Route Handlers on the Node runtime.
  serverExternalPackages: ['postgres', 'bcryptjs', 'jsonwebtoken'],

  // OAuth discovery lives at root .well-known paths. App Router's dot-folder
  // routing is unreliable, so serve them from API routes via rewrites. RFC 9728
  // clients also probe the path-suffixed PRM URL (…/oauth-protected-resource/api/mcp),
  // so both forms map to the same handler.
  async rewrites() {
    return [
      {
        source: '/.well-known/oauth-authorization-server',
        destination: '/api/oauth/metadata/authorization-server',
      },
      {
        source: '/.well-known/oauth-protected-resource',
        destination: '/api/oauth/metadata/protected-resource',
      },
      {
        source: '/.well-known/oauth-protected-resource/:path*',
        destination: '/api/oauth/metadata/protected-resource',
      },
    ];
  },
};

export default nextConfig;
