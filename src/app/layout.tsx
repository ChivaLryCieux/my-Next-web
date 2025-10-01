// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // 导入全局样式

export const metadata: Metadata = {
    title: "兹暂客丨Tempsyche",
    description: "兹暂客Tempsyche于此恭候，欢迎您的到来。This is a portfolio website built with Next.js and Three.js",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN">
        <body>{children}</body>
        </html>
    );
}
