import { offlineStorage } from './offline/storage'

interface DolarApiResponse {
  fuente: string
  nombre: string
  compra: number | null
  venta: number | null
  promedio: number
  fechaActualizacion: string
}

export interface DollarRateData {
  rate: number
  date: string // ISO date string
  timestamp: number
}

let cachedRate: DollarRateData | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hora

export async function getDollarRateWithDate(): Promise<DollarRateData> {
  // Verificar cache en memoria
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate
  }

  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      next: { revalidate: 3600 }, // Revalidar cada hora
    })

    if (!response.ok) {
      throw new Error('Error al obtener tasa de cambio')
    }

    const data: DolarApiResponse = await response.json()
    const rateData: DollarRateData = {
      rate: data.promedio,
      date: data.fechaActualizacion,
      timestamp: Date.now(),
    }

    // Actualizar cache en memoria
    cachedRate = rateData

    // Guardar en IndexedDB para offline
    try {
      await offlineStorage.setDollarRate(rateData.rate, rateData.date)
    } catch (error) {
      console.error('Error saving dollar rate to IndexedDB:', error)
    }

    return rateData
  } catch (error) {
    console.error('Error fetching dollar rate:', error)

    // Si hay error, intentar obtener de cache en memoria
    if (cachedRate) {
      return cachedRate
    }

    // Intentar obtener de IndexedDB (offline)
    try {
      const offlineRate = await offlineStorage.getDollarRate()
      if (offlineRate) {
        const rateData: DollarRateData = {
          rate: offlineRate.rate,
          date: offlineRate.date,
          timestamp: offlineRate.timestamp,
        }
        cachedRate = rateData
        return rateData
      }
    } catch (dbError) {
      console.error('Error reading from IndexedDB:', dbError)
    }

    // Valor por defecto si no hay cache
    return {
      rate: 227.5567,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    }
  }
}

// Mantener compatibilidad con código existente
export async function getDollarRate(): Promise<number> {
  const data = await getDollarRateWithDate()
  return data.rate
}

export async function convertUSDToBSF(usdAmount: number): Promise<number> {
  const rate = await getDollarRate()
  return usdAmount * rate
}
