export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-orange-50 to-stone-100 flex items-center justify-center p-4">
      {children}
    </div>
  )
}
