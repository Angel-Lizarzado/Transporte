'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { getDollarRate } from '@/lib/currency'
import { Eye } from 'lucide-react'
import Link from 'next/link'

interface Representative {
  id: string
  alias: string
  email: string | null
  phone: string | null
  code: string
  created_at: string
}

export function RepresentativeCard({ representative }: { representative: Representative }) {
  const [debt, setDebt] = useState(0)
  const [dollarRate, setDollarRate] = useState(227.5567)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDebt()
    loadDollarRate()
  }, [representative.id])

  async function loadDollarRate() {
    const rate = await getDollarRate()
    setDollarRate(rate)
  }

  async function loadDebt() {
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

      // Obtener tarifa general
      const { data: config } = await supabase
        .from('app_config')
        .select('tarifa_general_usd')
        .eq('organization_id', member.organization_id)
        .single()

      const tarifaGeneral = config?.tarifa_general_usd || 0

      // Obtener niños del representante
      const { data: passengers } = await supabase
        .from('passengers')
        .select('tarifa_personalizada, tarifa_semanal_usd')
        .eq('representante_id', representative.id)
        .eq('activo', true)

      let totalDebt = 0
      if (passengers) {
        passengers.forEach((passenger) => {
          const fee =
            passenger.tarifa_personalizada ||
            passenger.tarifa_semanal_usd ||
            tarifaGeneral
          totalDebt += fee
        })
      }

      // Calcular deuda de transacciones
      const { data: transactions } = await supabase
        .from('transactions')
        .select('monto_usd, tipo')
        .eq('representante_id', representative.id)
        .eq('organization_id', member.organization_id)

      if (transactions) {
        transactions.forEach((tx) => {
          if (tx.tipo === 'cargo') {
            totalDebt += tx.monto_usd
          } else {
            totalDebt -= tx.monto_usd
          }
        })
      }

      setDebt(totalDebt)
    } catch (error) {
      console.error('Error calculating debt:', error)
    } finally {
      setLoading(false)
    }
  }

  const debtBSF = debt * dollarRate

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{representative.alias}</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Código: {representative.code}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {representative.email && (
          <p className="text-sm">
            <span className="font-medium">Email:</span> {representative.email}
          </p>
        )}
        {representative.phone && (
          <p className="text-sm">
            <span className="font-medium">Teléfono:</span> {representative.phone}
          </p>
        )}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium mb-1">Deuda Actual:</p>
          {loading ? (
            <p className="text-sm text-gray-500">Calculando...</p>
          ) : (
            <>
              <p className="text-lg font-bold text-vinotinto dark:text-white">
                {formatCurrency(debt, 'USD')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatCurrency(debtBSF, 'BSF')}
              </p>
            </>
          )}
        </div>
        <div className="pt-2">
          <Link href={`/dashboard/representantes/${representative.id}`}>
            <Button variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalles
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

