interface DolarApiResponse {
  fuente: string
  nombre: string
  compra: number | null
  venta: number | null
  promedio: number
  fechaActualizacion: string
}

let cachedRate: { rate: number; timestamp: number } | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hora

export async function getDollarRate(): Promise<number> {
  // Verificar cache
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate.rate
  }

  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      next: { revalidate: 3600 }, // Revalidar cada hora
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener tasa de cambio')
    }

    const data: DolarApiResponse = await response.json()
    const rate = data.promedio

    // Actualizar cache
    cachedRate = {
      rate,
      timestamp: Date.now(),
    }

    return rate
  } catch (error) {
    console.error('Error fetching dollar rate:', error)
    // Si hay error y tenemos cache, usar cache
    if (cachedRate) {
      return cachedRate.rate
    }
    // Valor por defecto si no hay cache
    return 227.5567
  }
}

export async function convertUSDToBSF(usdAmount: number): Promise<number> {
  const rate = await getDollarRate()
  return usdAmount * rate
}

