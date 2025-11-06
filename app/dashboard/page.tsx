import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, GraduationCap, DollarSign, TrendingUp, Calendar, FileText } from 'lucide-react'
import { getDollarRate, convertUSDToBSF } from '@/lib/currency'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { DebtChart } from '@/components/debt-chart'
import { TopDebtors } from '@/components/top-debtors'

async function getDashboardData(organizationId: string) {
  const supabase = await createClient()

  // Obtener configuración
  const { data: config } = await supabase
    .from('app_config')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  // Contar representantes
  const { count: representativesCount } = await supabase
    .from('representatives')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  // Contar niños
  const { count: childrenCount } = await supabase
    .from('passengers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('tipo', 'niño')
    .eq('activo', true)

  // Contar docentes
  const { count: teachersCount } = await supabase
    .from('passengers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('tipo', 'docente')
    .eq('activo', true)

  // Calcular deuda total y por representante
  const { data: representatives } = await supabase
    .from('representatives')
    .select('id, alias')
    .eq('organization_id', organizationId)

  let totalDebt = 0
  let totalPayments = 0
  let totalCharges = 0
  let activePassengers = 0
  const debtors: Array<{ id: string; name: string; debt: number }> = []

  if (representatives) {
    for (const rep of representatives) {
      const { data: passengers } = await supabase
        .from('passengers')
        .select('tarifa_personalizada, tarifa_semanal_usd')
        .eq('representante_id', rep.id)
        .eq('activo', true)

      let repDebt = 0

      if (passengers) {
        activePassengers += passengers.length
        passengers.forEach((passenger) => {
          const fee =
            passenger.tarifa_personalizada || passenger.tarifa_semanal_usd || config?.tarifa_general_usd || 0
          totalDebt += fee
          repDebt += fee
        })
      }

      // Calcular deuda de transacciones
      const { data: transactions } = await supabase
        .from('transactions')
        .select('monto_usd, tipo')
        .eq('representante_id', rep.id)
        .eq('organization_id', organizationId)

      if (transactions) {
        transactions.forEach((tx) => {
          if (tx.tipo === 'cargo') {
            totalDebt += tx.monto_usd
            totalCharges += tx.monto_usd
            repDebt += tx.monto_usd
          } else {
            totalDebt -= tx.monto_usd
            totalPayments += tx.monto_usd
            repDebt -= tx.monto_usd
          }
        })
      }

      if (repDebt > 0) {
        debtors.push({
          id: rep.id,
          name: rep.alias,
          debt: repDebt,
        })
      }
    }
  }

  // Ordenar por deuda descendente y tomar los top 10
  debtors.sort((a, b) => b.debt - a.debt)
  const topDebtors = debtors.slice(0, 10)

  // Obtener última actualización semanal
  const lastWeeklyCharge = config?.last_weekly_charge_applied
    ? new Date(config.last_weekly_charge_applied).toLocaleDateString('es-VE')
    : 'Nunca'

  // Contar transacciones del mes y calcular pagos del mes
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: monthlyTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('fecha', startOfMonth.toISOString())

  // Calcular pagos del mes actual
  const { data: monthlyPaymentTransactions } = await supabase
    .from('transactions')
    .select('monto_usd')
    .eq('organization_id', organizationId)
    .eq('tipo', 'pago')
    .gte('fecha', startOfMonth.toISOString())

  let monthlyPayments = 0
  if (monthlyPaymentTransactions) {
    monthlyPayments = monthlyPaymentTransactions.reduce(
      (sum, tx) => sum + tx.monto_usd,
      0
    )
  }

  // Obtener nombre del mes actual
  const currentMonth = new Date().toLocaleDateString('es-VE', { month: 'long' })
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)

  return {
    config,
    representativesCount: representativesCount || 0,
    childrenCount: childrenCount || 0,
    teachersCount: teachersCount || 0,
    totalDebt,
    totalPayments,
    totalCharges,
    activePassengers,
    lastWeeklyCharge,
    monthlyTransactions: monthlyTransactions || 0,
    monthlyPayments,
    topDebtors,
    currentMonth: capitalizedMonth,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Obtener organización del usuario
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <p>No tienes una organización asignada. Contacta al administrador.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = await getDashboardData(member.organization_id)
  const dollarRate = await getDollarRate()
  const totalDebtBSF = data.totalDebt * dollarRate

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {data.config?.transport_name || 'Dashboard'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Resumen general del transporte
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Representantes
            </CardTitle>
            <Users className="h-4 w-4 text-vinotinto dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.representativesCount}</div>
            <Link href="/dashboard/representantes" className="text-xs text-vinotinto dark:text-white hover:underline mt-1 block">
              Ver todos →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Niños</CardTitle>
            <UserPlus className="h-4 w-4 text-vinotinto dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.childrenCount}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data.activePassengers} activos
            </p>
            <Link href="/dashboard/ninos" className="text-xs text-vinotinto dark:text-white hover:underline mt-1 block">
              Ver todos →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Docentes</CardTitle>
            <GraduationCap className="h-4 w-4 text-vinotinto dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.teachersCount}</div>
            <Link href="/dashboard/docentes" className="text-xs text-vinotinto dark:text-white hover:underline mt-1 block">
              Ver todos →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
            <DollarSign className="h-4 w-4 text-vinotinto dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalDebt, 'USD')}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(totalDebtBSF, 'BSF')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tasa: {dollarRate.toFixed(2)} Bs.F/USD
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pagos del Mes de {data.currentMonth}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-vinotinto dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.monthlyPayments, 'USD')}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(data.monthlyPayments * dollarRate, 'BSF')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Total histórico: {formatCurrency(data.totalPayments, 'USD')}
            </p>
            <Link href="/dashboard/pagos" className="text-xs text-vinotinto dark:text-white hover:underline mt-1 block">
              Ver transacciones →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Deuda Actual de Representantes
            </CardTitle>
            <FileText className="h-4 w-4 text-vinotinto dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vinotinto dark:text-white">
              {formatCurrency(data.totalDebt, 'USD')}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(data.totalDebt * dollarRate, 'BSF')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cargos del mes: {formatCurrency(data.totalCharges, 'USD')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Carga Semanal</CardTitle>
            <Calendar className="h-4 w-4 text-vinotinto dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data.lastWeeklyCharge}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data.monthlyTransactions} transacciones en {data.currentMonth}
            </p>
            {data.config?.last_weekly_charge_applied && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Última actualización: {new Date(data.config.last_weekly_charge_applied).toLocaleString('es-VE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deudas por Representante</CardTitle>
          </CardHeader>
          <CardContent>
            <DebtChart
              data={data.topDebtors.map((d) => ({
                name: d.name,
                deuda: d.debt,
                deudaBSF: d.debt * dollarRate,
              }))}
              dollarRate={dollarRate}
            />
          </CardContent>
        </Card>

        <TopDebtors
          debtors={data.topDebtors.map((d) => ({
            id: d.id,
            name: d.name,
            debt: d.debt,
            debtBSF: d.debt * dollarRate,
          }))}
        />
      </div>
    </div>
  )
}

