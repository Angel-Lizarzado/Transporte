'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { getDollarRate } from '@/lib/currency'
import { ArrowLeft, UserPlus, Receipt } from 'lucide-react'
import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'

interface Representative {
  id: string
  alias: string
  email: string | null
  phone: string | null
  address: string | null
  code: string
  created_at: string
}

interface Passenger {
  id: string
  nombre: string
  tarifa_personalizada: number | null
  tarifa_semanal_usd: number | null
  activo: boolean
}

interface Transaction {
  id: string
  fecha: string
  tipo: 'cargo' | 'pago'
  monto_usd: number
  concepto: string
  notas: string | null
}

export default function RepresentativeDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [representative, setRepresentative] = useState<Representative | null>(null)
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [debt, setDebt] = useState(0)
  const [dollarRate, setDollarRate] = useState(227.5567)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (id) {
      loadData()
      loadDollarRate()
    }
  }, [id])

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

      // Cargar representante
      const { data: rep } = await supabase
        .from('representatives')
        .select('*')
        .eq('id', id)
        .eq('organization_id', member.organization_id)
        .single()

      if (!rep) return

      setRepresentative(rep)

      // Cargar niños
      const { data: pass } = await supabase
        .from('passengers')
        .select('*')
        .eq('representante_id', id)
        .eq('tipo', 'niño')
        .order('created_at', { ascending: false })

      setPassengers(pass || [])

      // Cargar transacciones
      const { data: trans } = await supabase
        .from('transactions')
        .select('*')
        .eq('representante_id', id)
        .eq('organization_id', member.organization_id)
        .order('fecha', { ascending: false })

      setTransactions(trans || [])

      // Calcular deuda
      const { data: config } = await supabase
        .from('app_config')
        .select('tarifa_general_usd')
        .eq('organization_id', member.organization_id)
        .single()

      const tarifaGeneral = config?.tarifa_general_usd || 0

      let totalDebt = 0
      if (pass) {
        pass.forEach((passenger) => {
          if (passenger.activo) {
            const fee =
              passenger.tarifa_personalizada ||
              passenger.tarifa_semanal_usd ||
              tarifaGeneral
            totalDebt += fee
          }
        })
      }

      if (trans) {
        trans.forEach((tx) => {
          if (tx.tipo === 'cargo') {
            totalDebt += tx.monto_usd
          } else {
            totalDebt -= tx.monto_usd
          }
        })
      }

      setDebt(totalDebt)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!representative) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <p>Representante no encontrado</p>
            <Link href="/dashboard/representantes">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const debtBSF = debt * dollarRate

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/representantes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {representative.alias}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-600 dark:text-gray-400">
              Código:
            </p>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
              {representative.code}
            </code>
            <CopyButton text={representative.code} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {representative.phone && (
              <p>
                <span className="font-medium">Teléfono:</span> {representative.phone}
              </p>
            )}
            {representative.address && (
              <p>
                <span className="font-medium">Dirección:</span> {representative.address}
              </p>
            )}
            {!representative.phone && !representative.address && (
              <p className="text-gray-500 dark:text-gray-400">
                No hay información de contacto registrada
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deuda Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold text-vinotinto dark:text-white">
              {formatCurrency(debt, 'USD')}
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {formatCurrency(debtBSF, 'BSF')}
            </p>
            {debt === 0 && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                ✓ Sin deuda pendiente
              </p>
            )}
            {debt > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                ⚠ Tiene deuda pendiente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Niños Asignados</CardTitle>
            <Link href={`/dashboard/ninos?representante=${id}`}>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar Niño
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {passengers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No hay niños asignados
            </p>
          ) : (
            <div className="space-y-2">
              {passengers.map((passenger) => (
                <div
                  key={passenger.id}
                  className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                >
                  <div>
                    <p className="font-medium">{passenger.nombre}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tarifa: {formatCurrency(
                        passenger.tarifa_personalizada ||
                          passenger.tarifa_semanal_usd ||
                          0,
                        'USD'
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      passenger.activo
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {passenger.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Historial de Transacciones</CardTitle>
            <Link href={`/dashboard/pagos?representante=${id}`}>
              <Button size="sm">
                <Receipt className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            </Link>
          </div>
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
                  <div>
                    <p className="font-medium">{transaction.concepto}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.fecha).toLocaleDateString('es-VE')}
                    </p>
                    {transaction.notas && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.notas}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

