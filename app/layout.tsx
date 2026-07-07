import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Chronicle display face: Cinzel variable TTF for titles, buttons and
// numerals of consequence; self-hosted (see fonts/OFL-Cinzel.txt).
const displayFont = localFont({
  src: [
    {
      path: "./fonts/Cinzel-Variable.ttf",
      weight: "400 900",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

// Manuscript prose face: IM Fell English for all narrative text;
// self-hosted (see fonts/OFL-IMFellEnglish.txt).
const proseFont = localFont({
  src: [
    {
      path: "./fonts/IMFellEnglish-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/IMFellEnglish-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-prose",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Seven Nights",
    template: "%s · Seven Nights",
  },
  description:
    "A storytelling party game: one big screen, 2–6 phones, seven nights in a village with too many secrets.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // phones: no pinch-zoom jank on button mashing
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${proseFont.variable}`}>
      <body className="min-h-screen bg-night text-parch-100 antialiased">
        {children}
      </body>
    </html>
  );
}
