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
      const root = document.documentElement
      setIsDark(root.classList.contains('dark'))
    }
    
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    
    return () => observer.disconnect()
  }, [])

  const chartData = data.map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    'Deuda (USD)': item.deuda,
    'Deuda (Bs.F)': item.deudaBSF,
  }))

  const textColor = isDark ? '#ffffff' : '#000000'

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">
            {payload[0].payload.name}
          </p>
          <p className="text-sm text-vinotinto dark:text-white">
            USD: {formatCurrency(payload[0].value, 'USD')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bs.F: {formatCurrency(payload[1].value, 'BSF')}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#d1d5db'} />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: textColor, fontSize: 12 }}
          style={{ fill: textColor }}
        />
        <YAxis
          tick={{ fill: textColor, fontSize: 12 }}
          style={{ fill: textColor }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ color: textColor }}
          iconType="rect"
        />
        <Bar
          dataKey="Deuda (USD)"
          fill="#330000"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="Deuda (Bs.F)"
          fill={isDark ? '#9ca3af' : '#666666'}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

