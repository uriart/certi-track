'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/presupuesto', label: 'Presupuesto de Obra' },
    { href: '/certificaciones', label: 'Certificaciones' },
    { href: '/partidas', label: 'Partidas' },
    { href: '/presupuesto-extras', label: 'Presupuesto de Extras' },
    { href: '/certificaciones-extras', label: 'Cert. Extras' },
  ]

  return (
    <nav className="bg-zinc-900 text-white p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">Certi-Track</h1>
        <div className="flex gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-zinc-300 transition-colors ${
                pathname === link.href ? 'text-zinc-300 font-medium' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
