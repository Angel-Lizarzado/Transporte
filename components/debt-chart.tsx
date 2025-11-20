// components/debt-chart.tsx
'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface DebtData {
  name: string
  deuda: number
  deudaBSF: number
}

interface DebtChartProps {
  data: DebtData[]
  dollarRate: number
}

export function DebtChart({ data, dollarRate }: DebtChartProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  // proteger contra nombres nulos y payload vacio
  const chartData = (data || []).map((item) => {
    const name = (item?.name ?? '').toString()
    const shortName = name.length > 20 ? name.substring(0, 20) + '...' : name
    return {
      name: shortName || '—',
      deuda: Number(item?.deuda ?? 0),
      deudaBSF: Number(item?.deudaBSF ?? 0),
    }
  })

  const textColor = isDark ? '#ffffff' : '#000000'
  const accentUSD = isDark ? '#ffffff' : '#660000' // white in dark mode for visibility
  const accentBSF = isDark ? '#9ca3af' : '#666666'

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && Array.isArray(payload) && payload.length > 0) {
      const p0 = payload[0]
      const p1 = payload[1] // puede no existir
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">
            {p0?.payload?.name ?? '—'}
          </p>
          <p className="text-sm text-[var(--accent)] dark:text-white">
            USD: {formatCurrency(p0?.value ?? 0, 'USD')}
          </p>
          {p1 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bs.F: {formatCurrency(p1?.value ?? 0, 'BSF')}
            </p>
          ) : null}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: textColor, fontSize: 12 }}
        />
        <YAxis tick={{ fill: textColor, fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: textColor }} />
        <Bar
          dataKey="deuda"
          name="Deuda (USD)"
          fill={accentUSD}
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="deudaBSF"
          name="Deuda (Bs.F)"
          fill={accentBSF}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
