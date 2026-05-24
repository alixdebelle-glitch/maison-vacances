import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Maison de Vacances",
  description: "Suivi projet achat maison de vacances en famille",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
