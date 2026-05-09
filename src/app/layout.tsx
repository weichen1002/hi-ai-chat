import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "Hi AI Chat - 智能对话平台",
  description: "支持多种 GPT 模型的 AI 对话平台，具备写作专家模式、Markdown 渲染与代码高亮",
  keywords: ["AI", "ChatGPT", "AI对话", "写作助手"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                document.documentElement.setAttribute(
                  'data-theme',
                  savedTheme === 'dark' ? 'dark' : 'light'
                );
                document.documentElement.setAttribute('data-app-mode', 'chat');
              } catch {
                document.documentElement.setAttribute('data-theme', 'light');
                document.documentElement.setAttribute('data-app-mode', 'chat');
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
