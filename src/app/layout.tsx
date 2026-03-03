import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import GlobalAuthModal from "@/components/GlobalAuthModal";

export const metadata = {
  title: 'BuildWise - Architecture Design Platform',
  description: 'Design and visualize system architectures with AI assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <GlobalAuthModal />
        </AuthProvider>
      </body>
    </html>
  )
}
