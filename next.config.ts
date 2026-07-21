import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // postgres.js, bcryptjs and jsonwebtoken are CJS/native-ish and must not be
  // bundled — they run in Route Handlers on the Node runtime.
  serverExternalPackages: ['postgres', 'bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;
