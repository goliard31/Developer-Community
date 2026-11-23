/** @type {import('next').NextConfig} */
const nextConfig = {
  // 上传的文件由 API 路由流式输出，不走静态资源目录
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: { bodySizeLimit: '2gb' },
  },
};

export default nextConfig;
