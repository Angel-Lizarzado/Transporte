'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { RepresentativeCard } from '@/components/representative-card'

interface Representative {
  id: string
  alias: string
  email: string | null
  phone: string | null
  code: string
  created_at: string
}

export default function RepresentantesPage() {
  const [representatives, setRepresentatives] = useState<Representative[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    alias: '',
    phone: '',
    address: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadRepresentatives()
  }, [])

  async function loadRepresentatives() {
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
        .from('representatives')
        .select('*')
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRepresentatives(data || [])
    } catch (error) {
      console.error('Error loading representatives:', error)
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
      let code = `REP-${Math.floor(10000 + Math.random() * 90000)}`
      let codeExists = true

      while (codeExists) {
        const { data: existing } = await supabase
          .from('representatives')
          .select('id')
          .eq('code', code)
          .single()

        if (!existing) {
          codeExists = false
        } else {
          code = `REP-${Math.floor(10000 + Math.random() * 90000)}`
        }
      }

      const { error } = await supabase.from('representatives').insert({
        organization_id: member.organization_id,
        alias: formData.alias,
        phone: formData.phone || null,
        address: formData.address || null,
        code,
      })

      if (error) throw error

      setFormData({ alias: '', phone: '', address: '' })
      setShowForm(false)
      loadRepresentatives()
    } catch (error: any) {
      console.error('Error creating representative:', error)
      alert('Error al crear representante: ' + error.message)
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
            Representantes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona los representantes registrados
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Representante
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Representante</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alias">Nombre/Alias *</Label>
                <Input
                  id="alias"
                  value={formData.alias}
                  onChange={(e) =>
                    setFormData({ ...formData, alias: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (Opcional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección (Opcional)</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
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
        {representatives.map((rep) => (
          <RepresentativeCard key={rep.id} representative={rep} />
        ))}
      </div>
    </div>
  )
}

