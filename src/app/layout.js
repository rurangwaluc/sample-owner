import "./globals.css";

import ThemeScript from "../components/ThemeScript";

export const metadata = {
  title: "Business Control System",
  description: "Owner dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
