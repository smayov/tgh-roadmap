export async function generateMetadata({ params }) {
  const { negocioId } = await params;

  return {
    manifest: `/fichar/${negocioId}/manifest.webmanifest`,
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
}

export default function FicharLayout({ children }) {
  return children;
}
