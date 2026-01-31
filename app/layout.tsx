import type { Metadata } from "next";
import "./globals.css";
import "handsontable/dist/handsontable.full.min.css";
import IdleTimer from "@/components/IdleTimer";

export const metadata: Metadata = {
  title: "SkillLens PoC - 事務職スキルアセスメント",
  description: "スプレッドシート操作から実務能力を測定する採用アセスメントツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <IdleTimer timeout={7200000} /> {/* 2時間 = 7200000ms */}
        {children}
      </body>
    </html>
  );
}
