'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { getDollarRate } from '@/lib/currency'
import { LogOut, Users, Receipt, Download } from 'lucide-react'
import { generateReceiptPDF } from '@/lib/pdf-generator'

interface RepresentativeData {
  representative: {
    id: string
    alias: string
    code: string
    email: string | null
    phone: string | null
    address: string | null
  }
  organization: {
    id: string
    name: string
  } | null
  transportName: string | null
  passengers: Array<{
    id: string
    nombre: string
    tarifa_personalizada: number | null
    tarifa_semanal_usd: number | null
  }>
  debt: {
    previous: number
    current: number
    previousBSF: number
    currentBSF: number
    dollarRate: number
  }
  transactions: Array<{
    id: string
    fecha: string
    tipo: 'cargo' | 'pago'
    monto_usd: number
    concepto: string
    notas: string | null
  }>
}

export default function RepresentanteDashboardPage() {
  const [data, setData] = useState<RepresentativeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dollarRate, setDollarRate] = useState(227.5567)
  const router = useRouter()

  useEffect(() => {
    loadData()
    loadDollarRate()
  }, [])

  async function loadDollarRate() {
    const rate = await getDollarRate()
    setDollarRate(rate)
  }

  async function loadData() {
    try {
      const code = localStorage.getItem('representative_code')
      if (!code) {
        router.push('/representante/login')
        return
      }

      const response = await fetch(`/api/public/representative/${code}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar información')
      }

      const representativeData = await response.json()
      setData(representativeData)
      localStorage.setItem('representative_data', JSON.stringify(representativeData))
    } catch (error) {
      console.error('Error loading data:', error)
      router.push('/representante/login')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('representative_code')
    localStorage.removeItem('representative_data')
    router.push('/representante/login')
  }

  async function handleGenerateReceipt() {
    if (!data) return

    try {
      await generateReceiptPDF({
        transportName: data.transportName || 'Transporte Escolar',
        representative: data.representative,
        passengers: data.passengers,
        previousDebt: data.debt.previous,
        currentDebt: data.debt.current,
        transactions: data.transactions,
        dollarRate: data.debt.dollarRate,
      })
    } catch (error: any) {
      console.error('Error generating receipt:', error)
      alert('Error al generar recibo: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-gray-600 dark:text-gray-400">
              No se pudo cargar la información
            </p>
            <Button onClick={() => router.push('/representante/login')} className="w-full mt-4">
              Volver al login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.transportName || 'Transporte Escolar'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bienvenido, {data.representative.alias}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Información del Representante */}
          <Card>
            <CardHeader>
              <CardTitle>Mi Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <span className="font-medium">Código:</span>{' '}
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                  {data.representative.code}
                </code>
              </p>
              {data.representative.phone && (
                <p>
                  <span className="font-medium">Teléfono:</span> {data.representative.phone}
                </p>
              )}
              {data.representative.address && (
                <p>
                  <span className="font-medium">Dirección:</span> {data.representative.address}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Deuda Actual */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Deuda Actual</CardTitle>
                <Button onClick={handleGenerateReceipt} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Recibo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-vinotinto dark:text-white mb-2">
                {formatCurrency(data.debt.current, 'USD')}
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                {formatCurrency(data.debt.currentBSF, 'BSF')}
              </p>
              {data.debt.current === 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Sin deuda pendiente
                </p>
              )}
              {data.debt.current > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  ⚠ Tiene deuda pendiente
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Tasa de cambio: {data.debt.dollarRate.toFixed(2)} Bs.F/USD
              </p>
            </CardContent>
          </Card>

          {/* Niños Registrados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Niños Registrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.passengers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No hay niños registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {data.passengers.map((passenger) => {
                    const fee =
                      passenger.tarifa_personalizada ||
                      passenger.tarifa_semanal_usd ||
                      0
                    return (
                      <div
                        key={passenger.id}
                        className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {passenger.nombre}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Tarifa semanal: {formatCurrency(fee, 'USD')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(fee * data.debt.dollarRate, 'BSF')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial de Transacciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Historial de Transacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.transactions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No hay transacciones registradas
                </p>
              ) : (
                <div className="space-y-2">
                  {data.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-start p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.concepto}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.fecha).toLocaleDateString('es-VE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {transaction.notas && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {transaction.notas}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold text-lg ${
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
                            transaction.monto_usd * data.debt.dollarRate,
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
      </div>
    </div>
  )
}

