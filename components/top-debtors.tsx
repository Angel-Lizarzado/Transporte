'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface Debtor {
  id: string
  name: string
  debt: number
  debtBSF: number
}

interface TopDebtorsProps {
  debtors: Debtor[]
}

export function TopDebtors({ debtors }: TopDebtorsProps) {
  if (debtors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Representantes con Mayor Deuda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">
            No hay representantes con deuda registrada
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Representantes con Mayor Deuda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {debtors.map((debtor, index) => (
            <Link
              key={debtor.id}
              href={`/dashboard/representantes/${debtor.id}`}
              className="block p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-vinotinto dark:bg-vinotinto-600 text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {debtor.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ver detalles →
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-vinotinto dark:text-white">
                    {formatCurrency(debtor.debt, 'USD')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(debtor.debtBSF, 'BSF')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

