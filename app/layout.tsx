import type { Metadata } from "next";
import "./globals.css";
import "handsontable/dist/handsontable.full.min.css";

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
      <body>{children}</body>
    </html>
  );
}
