// app/dashboard/page.tsx
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dayjs from 'dayjs'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, GraduationCap, DollarSign, TrendingUp, Calendar, FileText } from 'lucide-react'
import { DebtChart } from '@/components/debt-chart'
import { TopDebtors } from '@/components/top-debtors'
import { getDollarRate, getDollarRateWithDate } from '@/lib/currency'
import { formatCurrency } from '@/lib/utils'

const ACCENT_LIGHT = '#660000' // vinotinto for light mode
const ACCENT_DARK = '#ffffff' // white for dark mode

async function getDashboardData(organizationId: string) {
  const supabase = await createClient()

  // Consultas en paralelo (evitamos llamadas por representante)
  const startOfMonthISO = (() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  })()

  const [
    configRes,
    repsRes,
    passengersRes,
    transactionsRes,
    repsCountRes,
    childrenCountRes,
    teachersCountRes,
    monthlyTxCountRes,
  ] = await Promise.all([
    supabase.from('app_config').select('*').eq('organization_id', organizationId).single(),
    supabase.from('representatives').select('id, alias').eq('organization_id', organizationId),
    supabase
      .from('passengers')
      .select('id, nombre, representante_id, tarifa_personalizada, tarifa_semanal_usd, tipo, activo')
      .eq('organization_id', organizationId)
      .eq('activo', true),
    supabase
      .from('transactions')
      .select('id, fecha, tipo, monto_usd, concepto, representante_id')
      .eq('organization_id', organizationId)
      .order('fecha', { ascending: false })
      .limit(250), // límite para rendimiento
    supabase.from('representatives').select('*', { head: true, count: 'exact' }).eq('organization_id', organizationId),
    supabase
      .from('passengers')
      .select('*', { head: true, count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('tipo', 'niño')
      .eq('activo', true),
    supabase
      .from('passengers')
      .select('*', { head: true, count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('tipo', 'docente')
      .eq('activo', true),
    supabase
      .from('transactions')
      .select('*', { head: true, count: 'exact' })
      .eq('organization_id', organizationId)
      .gte('fecha', startOfMonthISO),
  ])

  const config = configRes.data ?? null
  const representatives = repsRes.data ?? []
  const passengers = passengersRes.data ?? []
  const transactions = transactionsRes.data ?? []

  const representativesCount = (repsCountRes && (repsCountRes.count as number)) || 0
  const childrenCount = (childrenCountRes && (childrenCountRes.count as number)) || 0
  const teachersCount = (teachersCountRes && (teachersCountRes.count as number)) || 0
  const monthlyTransactions = (monthlyTxCountRes && (monthlyTxCountRes.count as number)) || 0

  // Mapa de representantes (id -> alias)
  const repById = new Map<string, { id: string; alias?: string }>()
  representatives.forEach((r: any) => repById.set(r.id, { id: r.id, alias: r.alias }))

  // debtMap acumula deuda por "cliente" (representante o docente tratado como cliente separado)
  const debtMap = new Map<string, { name: string; debt: number }>()
  let activePassengers = 0
  let totalDebt = 0
  let totalPayments = 0
  let totalCharges = 0

  const tarifaGeneral = Number(config?.tarifa_general_usd ?? 0)

  // 1) sumar tarifas semanales de pasajeros activos
  for (const p of passengers) {
    // Para docentes: si representante_id es null, usaremos passenger.id como "cliente"
    const customerId = p.representante_id ?? p.id
    const customerName = p.representante_id ? (repById.get(p.representante_id)?.alias ?? 'Representante') : p.nombre

    activePassengers++
    const fee = Number(p.tarifa_personalizada ?? p.tarifa_semanal_usd ?? tarifaGeneral ?? 0)
    if (!fee || fee === 0) continue

    totalDebt += fee
    const prev = debtMap.get(customerId) ?? { name: customerName, debt: 0 }
    prev.debt += fee
    debtMap.set(customerId, prev)
  }

  // 2) ajustar con transacciones (cargo = suma, pago = resta)
  for (const tx of transactions) {
    const m = Number(tx.monto_usd ?? 0)
    // Si tx.representante_id es null (raro) lo saltamos
    const customerId = tx.representante_id ?? null
    // Si no hay representante, lo dejamos en un bucket genérico (opcional)
    if (!customerId) {
      // si no hay representante, no sabemos a quién asignar; lo acumulamos en total pero no en rep map
      if (tx.tipo === 'cargo') {
        totalDebt += m
        totalCharges += m
      } else {
        totalDebt -= m
        totalPayments += m
      }
      continue
    }

    const prev = debtMap.get(customerId) ?? {
      name: repById.get(customerId)?.alias ?? 'Sin nombre',
      debt: 0,
    }

    if (tx.tipo === 'cargo') {
      prev.debt += m
      totalDebt += m
      totalCharges += m
    } else {
      prev.debt -= m
      totalDebt -= m
      totalPayments += m
    }

    debtMap.set(customerId, prev)
  }

  // Construir array de deudores, incluyendo docentes (los que usan passenger.id)
  const debtors: Array<{ id: string; name: string; debt: number }> = []
  for (const [id, { name, debt }] of Array.from(debtMap.entries())) {
    if (debt > 0) debtors.push({ id, name, debt })
  }
  debtors.sort((a, b) => b.debt - a.debt)
  const topDebtors = debtors.slice(0, 10)

  // Recent txs (ya limitadas)
  const recentTxs = transactions.slice(0, 20) // ya ordenadas desc

  // Cron logs (6 últimos)
  const { data: cronLogs } = await supabase
    .from('cron_logs')
    .select('id, executed_at, result, status')
    .eq('org_id', organizationId)
    .order('executed_at', { ascending: false })
    .limit(6)

  // monthlyPayments: sólo sumamos pagos del mes entre las transacciones ya descargadas
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthlyPayments = transactions
    .filter((t: any) => t.tipo === 'pago' && new Date(t.fecha) >= startOfMonth)
    .reduce((s: number, t: any) => s + Number(t.monto_usd ?? 0), 0)

  const currentMonth = new Date().toLocaleDateString('es-VE', { month: 'long' })
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)

  return {
    config,
    representativesCount,
    childrenCount,
    teachersCount,
    totalDebt,
    totalPayments,
    totalCharges,
    activePassengers,
    lastWeeklyCharge: config?.last_weekly_charge_applied
      ? new Date(config.last_weekly_charge_applied).toLocaleDateString('es-VE')
      : 'Nunca',
    monthlyTransactions,
    monthlyPayments,
    topDebtors,
    recentTxs,
    cronLogs: cronLogs ?? [],
    currentMonth: capitalizedMonth,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/auth/login')
  }

  // Obtener organización del usuario
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!member || !member.organization_id) {
    return (
      <div className="p-6">
        <Card>
          <CardContent>
            <p className="text-red-600 dark:text-red-300">No tienes una organización asignada. Contacta al administrador.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Datos optimizados
  const data = await getDashboardData(member.organization_id)
  const dollarRateData = await getDollarRateWithDate()
  const dollarRate = dollarRateData.rate
  const totalDebtBSF = data.totalDebt * dollarRate

  // Format date for display (DD/MM)
  const rateDate = new Date(dollarRateData.date)
  const rateDateStr = `${rateDate.getDate()}/${rateDate.getMonth() + 1}`

  return (
    <div className="min-h-screen px-4 py-6">
      <style>{`
        :root { --accent-light: ${ACCENT_LIGHT}; --accent-dark: ${ACCENT_DARK}; }
        .text-accent { color: var(--accent-light) }
        .dark .text-accent { color: var(--accent-dark) }
        .bg-accent { background: var(--accent-light) }
        .dark .bg-accent { background: var(--accent-dark) }
      `}</style>

      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{data.config?.transport_name ?? 'Gestor de Transporte'}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Resumen general — {data.currentMonth}</p>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="text-xs text-gray-600 dark:text-gray-300">Tasa BCV ({rateDateStr})</div>
          <div className="text-sm font-semibold text-accent dark:text-white">{dollarRate.toFixed(2)} Bs.F / USD</div>
        </div>
      </header>

      {/* Top cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Representantes</CardTitle>
            <Users className="h-5 w-5 text-accent dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.representativesCount}</div>
            <Link href="/dashboard/representantes" className="text-xs text-accent dark:text-white hover:underline mt-1 block">Ver todos →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Niños</CardTitle>
            <UserPlus className="h-5 w-5 text-accent dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.childrenCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">{data.activePassengers} activos</div>
            <Link href="/dashboard/ninos" className="text-xs text-accent dark:text-white hover:underline mt-1 block">Ver todos →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Docentes</CardTitle>
            <GraduationCap className="h-5 w-5 text-accent dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.teachersCount}</div>
            <Link href="/dashboard/docentes" className="text-xs text-accent dark:text-white hover:underline mt-1 block">Ver todos →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Deuda total</CardTitle>
            <DollarSign className="h-5 w-5 text-accent dark:text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.totalDebt, 'USD')}</div>
            <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">{formatCurrency(totalDebtBSF, 'BSF')}</div>
          </CardContent>
        </Card>
      </section>

      {/* Middle summary - Removed duplicate debt card */}
      <section className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Pagos del mes de {data.currentMonth}</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.monthlyPayments, 'USD')}</div>
            <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">{formatCurrency(data.monthlyPayments * dollarRate, 'BSF')}</div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">Histórico total de pagos</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{formatCurrency(data.totalPayments, 'USD')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Última carga semanal</CardTitle>
            <Calendar className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{data.lastWeeklyCharge}</div>
            <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">{data.monthlyTransactions} transacciones este mes</div>
            {data.config?.last_weekly_charge_applied && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Última actualización</div>
                <div className="text-xs font-medium text-gray-900 dark:text-white mt-1">
                  {new Date(data.config.last_weekly_charge_applied).toLocaleString('es-VE')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Charts + list */}
      <section className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Deudas por cliente (Top)</CardTitle>
          </CardHeader>
          <CardContent>
            <DebtChart
              data={data.topDebtors.map((d) => ({
                name: d.name ?? '—',
                deuda: d.debt ?? 0,
                deudaBSF: (d.debt ?? 0) * dollarRate,
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
      </section>

      {/* Últimas transacciones + Cron logs */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.recentTxs.map((tx: any) => (
                <li key={tx.id} className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{tx.concepto}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">{new Date(tx.fecha).toLocaleString('es-VE')}</div>
                  </div>
                  <div className={`text-sm font-semibold ${tx.tipo === 'pago' ? 'text-green-600 dark:text-green-400' : 'text-accent dark:text-white'}`}>
                    {formatCurrency(Number(tx.monto_usd), 'USD')}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos logs del CRON</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.cronLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {dayjs(log.executed_at).format('DD/MM/YYYY HH:mm')}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${log.status === 'success'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : log.status === 'skipped'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">{log.result}</pre>
                </div>
              ))}
              {data.cronLogs.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No hay logs del CRON disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* BCV Floating fijo abajo-derecha (responsive) */}
      <div className="fixed right-4 bottom-4 z-50">
        <div className="pointer-events-auto bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 backdrop-blur-sm border-2 border-accent dark:border-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow px-5 py-3 flex items-center gap-3">
          <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-accent dark:bg-white">
            <DollarSign className="h-4 w-4 text-white dark:text-gray-900" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-accent uppercase tracking-wide">Tasa BCV</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{dollarRateData.rate.toFixed(2)} <span className="text-xs font-normal">Bs.F/USD</span></div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{rateDateStr}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
