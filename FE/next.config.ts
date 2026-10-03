import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 브라우저가 백엔드(다른 도메인)로 직접 요청하면 refresh_token 쿠키가 백엔드 도메인에만
  // 저장돼서 프론트 자신에 대한 요청(middleware 등)에서는 쿠키를 볼 수 없다.
  // /api/* 를 프론트 자기 도메인 경유로 바꿔서(same-origin) 쿠키가 프론트 도메인에도 저장되게 한다.
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBase) return [];
    return [{ source: "/api/:path*", destination: `${apiBase}/api/:path*` }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "tong.visitkorea.or.kr" },
      { protocol: "https", hostname: "tong.visitkorea.or.kr" },
      { protocol: "https", hostname: "bujirun-storage.s3.ap-northeast-2.amazonaws.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.svg": [
        {
          condition: { query: /[?&]url(?=&|$)/ },
          type: "asset",
        },
        {
          condition: {
            any: [{ query: /[?&]svgr(?=&|$)/ }, { not: { query: /[?&]url(?=&|$)/ } }],
          },
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      ],
    },
  },
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule: { test?: RegExp }) =>
      rule.test?.test?.(".svg"),
    );
    if (fileLoaderRule) fileLoaderRule.exclude = /\.svg$/i;

    config.module.rules.push({
      test: /\.svg$/i,
      resourceQuery: /url/,
      type: "asset/resource",
    });

    config.module.rules.push({
      test: /\.svg$/i,
      resourceQuery: { not: [/url/] },
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default nextConfig;
