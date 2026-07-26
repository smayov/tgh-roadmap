export const metadata = {
  manifest: "/manifest.webmanifest",
  themeColor: "#2F4538",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fichar",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192-fichar.png",
  },
};

export default function FicharLayout({ children }) {
  return children;
}
