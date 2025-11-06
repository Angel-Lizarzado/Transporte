'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { getDollarRate } from '@/lib/currency'
import { Plus, FileText, Download } from 'lucide-react'
import { generateReceiptPDF } from '@/lib/pdf-generator'

interface Representative {
  id: string
  alias: string
  code: string
}

interface Transaction {
  id: string
  representante_id: string
  fecha: string
  tipo: 'cargo' | 'pago'
  monto_usd: number
  concepto: string
  notas: string | null
  representative?: Representative
}

export default function PagosPage() {
  const searchParams = useSearchParams()
  const representativeId = searchParams.get('representante')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [representatives, setRepresentatives] = useState<Representative[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [dollarRate, setDollarRate] = useState(227.5567)
  const [formData, setFormData] = useState({
    representante_id: representativeId || '',
    monto_usd: '',
    concepto: 'Pago semanal',
    notas: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadData()
    loadDollarRate()
    if (representativeId) {
      setShowForm(true)
    }
  }, [representativeId])

  async function loadDollarRate() {
    const rate = await getDollarRate()
    setDollarRate(rate)
  }

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

      // Cargar representantes
      const { data: reps } = await supabase
        .from('representatives')
        .select('id, alias, code')
        .eq('organization_id', member.organization_id)
        .order('alias', { ascending: true })

      setRepresentatives(reps || [])

      // Cargar transacciones
      const { data: trans } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', member.organization_id)
        .order('fecha', { ascending: false })
        .limit(50)

      if (trans) {
        // Enriquecer con datos de representantes
        const enriched = await Promise.all(
          trans.map(async (t) => {
            const { data: rep } = await supabase
              .from('representatives')
              .select('id, alias, code')
              .eq('id', t.representante_id)
              .single()

            return { ...t, representative: rep || undefined }
          })
        )
        setTransactions(enriched)
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

      const { error } = await supabase.from('transactions').insert({
        organization_id: member.organization_id,
        representante_id: formData.representante_id,
        fecha: new Date().toISOString(),
        tipo: 'pago',
        monto_usd: parseFloat(formData.monto_usd),
        concepto: formData.concepto,
        notas: formData.notas || null,
        created_by: user.id,
      })

      if (error) throw error

      setFormData({
        representante_id: representativeId || '',
        monto_usd: '',
        concepto: 'Pago semanal',
        notas: '',
      })
      setShowForm(false)
      loadData()
    } catch (error: any) {
      console.error('Error creating transaction:', error)
      alert('Error al registrar pago: ' + error.message)
    }
  }

  async function handleGenerateReceipt(representativeId: string) {
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

      // Obtener datos del representante
      const { data: rep } = await supabase
        .from('representatives')
        .select('*')
        .eq('id', representativeId)
        .single()

      if (!rep) {
        alert('Representante no encontrado')
        return
      }

      // Obtener configuración
      const { data: config } = await supabase
        .from('app_config')
        .select('*')
        .eq('organization_id', member.organization_id)
        .single()

      // Obtener niños
      const { data: passengers } = await supabase
        .from('passengers')
        .select('*')
        .eq('representante_id', representativeId)
        .eq('tipo', 'niño')
        .eq('activo', true)

      // Obtener transacciones
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('representante_id', representativeId)
        .eq('organization_id', member.organization_id)
        .order('fecha', { ascending: false })

      // Calcular deudas
      const tarifaGeneral = config?.tarifa_general_usd || 0
      let currentDebt = 0
      let previousDebt = 0

      if (passengers) {
        passengers.forEach((passenger) => {
          const fee =
            passenger.tarifa_personalizada ||
            passenger.tarifa_semanal_usd ||
            tarifaGeneral
          currentDebt += fee
          previousDebt += fee
        })
      }

      if (transactions) {
        const lastChargeDate = config?.last_weekly_charge_applied
        transactions.forEach((tx) => {
          if (tx.tipo === 'cargo') {
            currentDebt += tx.monto_usd
            if (!lastChargeDate || new Date(tx.fecha) >= new Date(lastChargeDate)) {
              previousDebt += tx.monto_usd
            }
          } else {
            currentDebt -= tx.monto_usd
            if (!lastChargeDate || new Date(tx.fecha) >= new Date(lastChargeDate)) {
              previousDebt -= tx.monto_usd
            }
          }
        })
      }

      await generateReceiptPDF({
        transportName: config?.transport_name || 'Transporte Escolar',
        representative: rep,
        passengers: passengers || [],
        previousDebt,
        currentDebt,
        transactions: transactions || [],
        dollarRate,
      })
    } catch (error: any) {
      console.error('Error generating receipt:', error)
      alert('Error al generar recibo: ' + error.message)
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
            Pagos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Registra pagos y genera recibos
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Pago
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="monto_usd">Monto (USD) *</Label>
                <Input
                  id="monto_usd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto_usd}
                  onChange={(e) =>
                    setFormData({ ...formData, monto_usd: e.target.value })
                  }
                  required
                />
                {formData.monto_usd && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(
                      parseFloat(formData.monto_usd) * dollarRate,
                      'BSF'
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="concepto">Concepto *</Label>
                <Input
                  id="concepto"
                  value={formData.concepto}
                  onChange={(e) =>
                    setFormData({ ...formData, concepto: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notas">Notas (Opcional)</Label>
                <Input
                  id="notas"
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Registrar</Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No hay transacciones registradas
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium">{transaction.concepto}</p>
                    {transaction.representative && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.representative.alias} ({transaction.representative.code})
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.fecha).toLocaleDateString('es-VE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {transaction.notas && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.notas}
                      </p>
                    )}
                  </div>
                  <div className="text-right mr-4">
                    <p
                      className={`font-bold ${
                        transaction.tipo === 'cargo'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {transaction.tipo === 'cargo' ? '+' : '-'}
                      {formatCurrency(transaction.monto_usd, 'USD')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(
                        transaction.monto_usd * dollarRate,
                        'BSF'
                      )}
                    </p>
                  </div>
                  {transaction.representative && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleGenerateReceipt(transaction.representante_id)
                      }
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Recibo
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

