import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Crear respuesta base
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Inicializar supabase SSR con cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  // Rutas públicas
  const publicRoutes = [
    '/representante',
    '/manifest.json',
    '/sw.js',
  ]

  // Permitir rutas públicas
  if (publicRoutes.some((p) => path.startsWith(p))) {
    return response
  }

  // Proteger rutas de app (excluye /auth)
  if (!user && !path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Si está logueado y entra a /auth, redirigir a dashboard
  if (user && path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

// 🧩 Matcher sin grupos de captura ✔
// 🧩 Excluye api/cron y api/auth ✔
// 🧩 100% válido en Next.js 14 ✔
export const config = {
  matcher: [
    '/((?!api/cron|api/auth|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-).*)',
  ],
}
