const nextConfig = {
    output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
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
