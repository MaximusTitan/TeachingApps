// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GPT_API_KEY: process.env.NEXT_PUBLIC_GPT_API_KEY,
    NEXT_PUBLIC_GPT_API_URL: process.env.NEXT_PUBLIC_GPT_API_URL,
  },
}

module.exports = nextConfig