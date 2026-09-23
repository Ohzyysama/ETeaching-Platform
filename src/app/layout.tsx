import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "作业提交平台",
  description: "线上作业提交与批改平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col bg-gradient-to-b from-[#fffde7] to-[#fff8e1]">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="bg-white text-gray-600 py-8 px-4 md:px-8 border-t-2 border-[#00897b]/20">
          <div className="max-w-6xl mx-auto font-sans text-sm text-center">
            作业提交平台 · 教师发布作业，学生在线提交
          </div>
        </footer>
      </body>
    </html>
  );
}
