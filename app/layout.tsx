import type { Metadata } from "next";
import { DifyChatbot } from "./components/dify-chatbot";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ocean｜PCB / EDA 产品经理",
    template: "%s｜Ocean",
  },
  description:
    "Ocean 的个人网站：嘉立创 EDA 专业版 PCB 功能产品设计，以及差分对雷达与 FPC 工坊。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <DifyChatbot />
      </body>
    </html>
  );
}
