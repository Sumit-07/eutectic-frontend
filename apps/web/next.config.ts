import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // frontend-spec §5.3 — the theme is resolved server-side, including the
  // OS-preference step. Advertising the client hint here is what makes that
  // possible without any client JS: `Accept-CH` asks the browser to send
  // `Sec-CH-Prefers-Color-Scheme` on subsequent requests, and `Critical-CH`
  // makes it retry the very first document request with the hint attached,
  // so the first painted HTML already carries the right `data-theme`.
  // Browsers that do not implement the hint simply fall through to light.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Accept-CH', value: 'Sec-CH-Prefers-Color-Scheme' },
          { key: 'Critical-CH', value: 'Sec-CH-Prefers-Color-Scheme' },
        ],
      },
    ];
  },
};

export default nextConfig;
