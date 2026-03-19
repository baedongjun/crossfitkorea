import type { Metadata } from "next";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import QueryProvider from "@/components/providers/QueryProvider";
import FadeInObserver from "@/components/common/FadeInObserver";
import ServiceWorkerRegistrar from "@/components/common/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: {
    default: "CrossFit Korea | 한국 크로스핏 박스 검색 플랫폼",
    template: "%s | CrossFit Korea",
  },
  description: "전국 크로스핏 박스를 지도로 검색하고, 시간표와 후기, 코치 정보를 한눈에 확인하세요.",
  keywords: ["크로스핏", "CrossFit", "크로스핏 박스", "WOD", "대회", "한국 크로스핏"],
  metadataBase: new URL("https://crossfitkorea.com"),
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    title: "CrossFit Korea | 한국 크로스핏 박스 검색 플랫폼",
    description: "전국 크로스핏 박스를 지도로 검색하고, 시간표와 후기, 코치 정보를 한눈에 확인하세요.",
    siteName: "CrossFit Korea",
    url: "https://crossfitkorea.com",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CrossFit Korea - 한국 크로스핏 박스 검색 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CrossFit Korea | 한국 크로스핏 박스 검색 플랫폼",
    description: "전국 크로스핏 박스를 지도로 검색하고, 시간표와 후기, 코치 정보를 한눈에 확인하세요.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Black+Han+Sans&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#e8220a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <QueryProvider>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Header />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
          <FadeInObserver />
          <ServiceWorkerRegistrar />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            theme="dark"
            toastStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 0 }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
