'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Map, BarChart2, FileText, SlidersHorizontal, LogOut, Mountain, PlusCircle, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Tableau de bord' },
  { href: '/carte', icon: Map, label: 'Carte' },
  { href: '/comparaison', icon: BarChart2, label: 'Comparaison' },
  { href: '/notes', icon: FileText, label: 'Notes' },
  { href: '/parametres/agences', icon: Building2, label: 'Agences' },
  { href: '/parametres/criteres', icon: SlidersHorizontal, label: 'Critères' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-stone-100 flex flex-col z-40">
      <div className="p-6 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Mountain className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="font-serif font-semibold text-stone-800 text-lg leading-tight">Maison</h1>
            <p className="text-xs text-stone-400 font-sans">de vacances</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/biens/nouveau"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors mb-3"
        >
          <PlusCircle className="w-5 h-5 flex-shrink-0" />
          <span>Ajouter un bien</span>
        </Link>

        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                isActive ? 'nav-link-active' : 'nav-link'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-stone-100">
        <button
          onClick={handleLogout}
          className="nav-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
