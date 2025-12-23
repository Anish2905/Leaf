/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    // ESLint is managed by CI/CD
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
};

export default nextConfig;
