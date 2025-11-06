'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useTheme } from '@/components/theme-provider'
import { useRouter } from 'next/navigation'

export default function AjustesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [transportName, setTransportName] = useState('')
  const [tarifaGeneral, setTarifaGeneral] = useState('0')
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!member) return

      setOrganizationId(member.organization_id)

      const { data: config } = await supabase
        .from('app_config')
        .select('*')
        .eq('organization_id', member.organization_id)
        .single()

      if (config) {
        setTransportName(config.transport_name || '')
        setTarifaGeneral(config.tarifa_general_usd?.toString() || '0')
        setTheme(config.theme_preference || 'system')
      } else {
        // Crear configuración inicial
        const { data: newConfig, error } = await supabase
          .from('app_config')
          .insert({
            organization_id: member.organization_id,
            tarifa_general_usd: 0,
            transport_name: '',
            theme_preference: 'system',
            updated_by: user.id,
          })
          .select()
          .single()

        if (!error && newConfig) {
          setTransportName(newConfig.transport_name || '')
          setTarifaGeneral(newConfig.tarifa_general_usd?.toString() || '0')
        }
      }
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!organizationId) return

    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('app_config')
        .update({
          transport_name: transportName,
          tarifa_general_usd: parseFloat(tarifaGeneral) || 0,
          theme_preference: theme,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)

      if (error) throw error

      alert('Configuración guardada exitosamente')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving config:', error)
      alert('Error al guardar la configuración: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Ajustes
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configuración general del transporte
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Personaliza el nombre del transporte y la tarifa semanal por defecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transportName">Nombre del Transporte</Label>
            <Input
              id="transportName"
              value={transportName}
              onChange={(e) => setTransportName(e.target.value)}
              placeholder="Ej: Transporte Escolar Los Pinos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tarifaGeneral">Tarifa Semanal General (USD)</Label>
            <Input
              id="tarifaGeneral"
              type="number"
              step="0.01"
              min="0"
              value={tarifaGeneral}
              onChange={(e) => setTarifaGeneral(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta tarifa se aplicará por defecto a todos los niños registrados
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            >
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="system">Sistema</option>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

