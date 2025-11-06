'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Representative {
  id: string
  alias: string
  code: string
}

interface Passenger {
  id: string
  nombre: string
  representante_id: string | null
  tarifa_personalizada: number | null
  tarifa_semanal_usd: number | null
  activo: boolean
  observaciones: string | null
  representative?: Representative
}

function NinosPageContent() {
  const searchParams = useSearchParams()
  const representativeId = searchParams.get('representante')
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [representatives, setRepresentatives] = useState<Representative[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tarifaGeneral, setTarifaGeneral] = useState(0)
  const [formData, setFormData] = useState({
    nombre: '',
    representante_id: representativeId || '',
    tarifa_personalizada: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadData()
    if (representativeId) {
      setShowForm(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [representativeId])

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!member) return

      // Cargar tarifa general
      const { data: config } = await supabase
        .from('app_config')
        .select('tarifa_general_usd')
        .eq('organization_id', member.organization_id)
        .single()

      if (config) {
        setTarifaGeneral(config.tarifa_general_usd || 0)
      }

      // Cargar representantes
      const { data: reps } = await supabase
        .from('representatives')
        .select('id, alias, code')
        .eq('organization_id', member.organization_id)
        .order('alias', { ascending: true })

      setRepresentatives(reps || [])

      // Cargar niños
      const { data: pass } = await supabase
        .from('passengers')
        .select('*')
        .eq('organization_id', member.organization_id)
        .eq('tipo', 'niño')
        .order('created_at', { ascending: false })

      if (pass) {
        // Enriquecer con datos de representantes
        const enriched = await Promise.all(
          pass.map(async (p) => {
            if (p.representante_id) {
              const { data: rep } = await supabase
                .from('representatives')
                .select('id, alias, code')
                .eq('id', p.representante_id)
                .single()

              return { ...p, representative: rep || undefined }
            }
            return p
          })
        )
        setPassengers(enriched)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!member) return

      if (!formData.representante_id) {
        alert('Debe seleccionar un representante')
        return
      }

      const { error } = await supabase.from('passengers').insert({
        organization_id: member.organization_id,
        nombre: formData.nombre,
        tipo: 'niño',
        representante_id: formData.representante_id,
        tarifa_semanal_usd: tarifaGeneral,
        tarifa_personalizada: formData.tarifa_personalizada
          ? parseFloat(formData.tarifa_personalizada)
          : null,
        activo: true,
      })

      if (error) throw error

      setFormData({
        nombre: '',
        representante_id: representativeId || '',
        tarifa_personalizada: '',
      })
      setShowForm(false)
      loadData()
    } catch (error: any) {
      console.error('Error creating passenger:', error)
      alert('Error al crear niño: ' + error.message)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Niños
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona los niños registrados
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Niño
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Niño</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Niño *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="representante_id">Representante *</Label>
                <Select
                  id="representante_id"
                  value={formData.representante_id}
                  onChange={(e) =>
                    setFormData({ ...formData, representante_id: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccione un representante</option>
                  {representatives.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.alias} ({rep.code})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifa_personalizada">
                  Tarifa Personalizada (USD) - Opcional
                </Label>
                <Input
                  id="tarifa_personalizada"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tarifa_personalizada}
                  onChange={(e) =>
                    setFormData({ ...formData, tarifa_personalizada: e.target.value })
                  }
                  placeholder={`Por defecto: ${formatCurrency(tarifaGeneral, 'USD')}`}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Si no se especifica, se usará la tarifa general: {formatCurrency(tarifaGeneral, 'USD')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Guardar</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {passengers.map((passenger) => (
          <Card key={passenger.id}>
            <CardHeader>
              <CardTitle className="text-lg">{passenger.nombre}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {passenger.representative && (
                <p className="text-sm">
                  <span className="font-medium">Representante:</span>{' '}
                  {passenger.representative.alias} ({passenger.representative.code})
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium">Tarifa Semanal:</span>{' '}
                {formatCurrency(
                  passenger.tarifa_personalizada ||
                    passenger.tarifa_semanal_usd ||
                    tarifaGeneral,
                  'USD'
                )}
              </p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs ${
                  passenger.activo
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {passenger.activo ? 'Activo' : 'Inactivo'}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function NinosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Cargando...</p>
      </div>
    }>
      <NinosPageContent />
    </Suspense>
  )
}

