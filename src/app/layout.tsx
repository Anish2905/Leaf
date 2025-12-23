import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
    ],
};

export const metadata: Metadata = {
    title: "Polar Stellar",
    description: "A personal, cloud-synced Notion-like app for notes and ideas",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Polar Stellar",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
            { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
        apple: [
            { url: "/icons/icon-152x152.svg", sizes: "152x152", type: "image/svg+xml" },
        ],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />
            </head>
            <body className={inter.className}>
                <Providers>{children}</Providers>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', () => {
                                    navigator.serviceWorker.register('/sw.js')
                                        .then((registration) => {
                                            console.log('SW registered:', registration.scope);
                                        })
                                        .catch((error) => {
                                            console.log('SW registration failed:', error);
                                        });
                                });
                            }
                        `,
                    }}
                />
            </body>
        </html>
    );
}
