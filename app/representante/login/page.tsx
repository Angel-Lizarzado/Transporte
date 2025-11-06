'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RepresentanteLoginPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validar formato del código
      if (!code.match(/^REP-\d{5}$/)) {
        throw new Error('Código inválido. Debe tener el formato REP-XXXXX')
      }

      // Obtener información del representante
      const response = await fetch(`/api/public/representative/${code}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Representante no encontrado')
      }

      const data = await response.json()

      // Guardar información en localStorage
      localStorage.setItem('representative_code', code)
      localStorage.setItem('representative_data', JSON.stringify(data))

      // Redirigir al dashboard del representante
      router.push('/representante/dashboard')
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-vinotinto dark:text-white">
            Acceso Representante
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa tu código para ver tu información
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Código de Representante</Label>
              <Input
                id="code"
                type="text"
                placeholder="REP-12345"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                pattern="REP-\d{5}"
                maxLength={9}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Formato: REP-XXXXX
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Acceder'}
            </Button>
            <div className="text-center">
              <a
                href="/auth/login"
                className="text-sm text-vinotinto dark:text-white hover:underline"
              >
                ¿Eres administrador? Inicia sesión aquí
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

