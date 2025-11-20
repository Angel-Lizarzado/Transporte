'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  Settings,
  Receipt,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OfflineIndicator } from '@/components/offline-indicator'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Representantes', href: '/dashboard/representantes', icon: Users },
  { name: 'Niños', href: '/dashboard/ninos', icon: UserPlus },
  { name: 'Docentes', href: '/dashboard/docentes', icon: GraduationCap },
  { name: 'Pagos', href: '/dashboard/pagos', icon: Receipt },
  { name: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rate, setRate] = useState<number | null>(null)

  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  // Traer tasa del día 1 sola vez
  useEffect(() => {
    const loadRate = async () => {
      const { data } = await supabase
        .from('settings')
        .select('dollar_rate')
        .single()

      if (data?.dollar_rate) setRate(data.dollar_rate)
    }
    loadRate()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* --- MOBILE SIDEBAR --- */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-[#660000] dark:text-white">
              Transporte
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 dark:text-gray-400"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-[#660000] text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-[#660000] dark:text-white">
              Transporte
            </h1>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-[#660000] text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="lg:pl-64">

        {/* TOPBAR */}
        <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 items-center justify-end gap-2">
            {/* Tema ya viene aquí */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setTheme(
                  theme === 'light'
                    ? 'dark'
                    : theme === 'dark'
                      ? 'system'
                      : 'light'
                )
              }
            >
              {resolvedTheme === 'dark' ? '☀️' : '🌙'}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {/* --- FLOATING EXCHANGE RATE --- */}
      {rate && (
        <div
          className="
          fixed bottom-4 right-4 z-50
          bg-[#660000] text-white dark:bg-gray-900 dark:border dark:border-gray-700
          px-4 py-2 rounded-xl shadow-lg text-sm"
        >
          💱 Tasa del día: <span className="font-bold">{rate}</span>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="text-center py-4 text-sm text-gray-600 dark:text-gray-400 mt-8">
        Desarrollado con ❤️ por <span className="font-semibold text-vinotinto dark:text-white">Angel Lizarzado</span> · 2025
      </footer>
    </div>
  )
}
