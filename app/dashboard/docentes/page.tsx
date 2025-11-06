'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

interface Passenger {
  id: string
  nombre: string
  code: string | null
  activo: boolean
  observaciones: string | null
  created_at: string
}

export default function DocentesPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    observaciones: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadPassengers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadPassengers() {
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

      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('organization_id', member.organization_id)
        .eq('tipo', 'docente')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPassengers(data || [])
    } catch (error) {
      console.error('Error loading passengers:', error)
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

      // Generar código único
      let code = `DOC-${Math.floor(10000 + Math.random() * 90000)}`
      let codeExists = true

      while (codeExists) {
        const { data: existing } = await supabase
          .from('passengers')
          .select('id')
          .eq('code', code)
          .single()

        if (!existing) {
          codeExists = false
        } else {
          code = `DOC-${Math.floor(10000 + Math.random() * 90000)}`
        }
      }

      const { error } = await supabase.from('passengers').insert({
        organization_id: member.organization_id,
        nombre: formData.nombre,
        tipo: 'docente',
        representante_id: null,
        code,
        observaciones: formData.observaciones || null,
        activo: true,
      })

      if (error) throw error

      setFormData({ nombre: '', observaciones: '' })
      setShowForm(false)
      loadPassengers()
    } catch (error: any) {
      console.error('Error creating teacher:', error)
      alert('Error al crear docente: ' + error.message)
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
            Docentes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona los docentes registrados
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Docente
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Docente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Docente *</Label>
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
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                />
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
              {passenger.code && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Código: {passenger.code}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {passenger.observaciones && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {passenger.observaciones}
                </p>
              )}
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

