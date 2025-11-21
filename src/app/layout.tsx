import "./globals.css";
import { AuthProvider } from "@/lib/authContext";

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
        </AuthProvider>
      </body>
    </html>
  )
}
