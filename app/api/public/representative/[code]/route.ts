import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getDollarRate } from '@/lib/currency'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code

    if (!code) {
      return NextResponse.json(
        { error: 'Código requerido' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Buscar representante por código
    const { data: representative, error: repError } = await supabase
      .from('representatives')
      .select('*')
      .eq('code', code)
      .single()

    if (repError || !representative) {
      return NextResponse.json(
        { error: 'Representante no encontrado' },
        { status: 404 }
      )
    }

    // Obtener organización
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', representative.organization_id)
      .single()

    // Obtener configuración
    const { data: config } = await supabase
      .from('app_config')
      .select('*')
      .eq('organization_id', representative.organization_id)
      .single()

    // Obtener niños asignados
    const { data: passengers } = await supabase
      .from('passengers')
      .select('*')
      .eq('representante_id', representative.id)
      .eq('tipo', 'niño')
      .eq('activo', true)

    // Obtener transacciones
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('representante_id', representative.id)
      .eq('organization_id', representative.organization_id)
      .order('fecha', { ascending: false })

    // Calcular deuda
    const tarifaGeneral = config?.tarifa_general_usd || 0
    let currentDebt = 0
    let previousDebt = 0

    if (passengers) {
      passengers.forEach((passenger) => {
        const fee =
          passenger.tarifa_personalizada ||
          passenger.tarifa_semanal_usd ||
          tarifaGeneral
        currentDebt += fee
        previousDebt += fee
      })
    }

    if (transactions) {
      const lastChargeDate = config?.last_weekly_charge_applied
      transactions.forEach((tx) => {
        if (tx.tipo === 'cargo') {
          currentDebt += tx.monto_usd
          if (!lastChargeDate || new Date(tx.fecha) >= new Date(lastChargeDate)) {
            previousDebt += tx.monto_usd
          }
        } else {
          currentDebt -= tx.monto_usd
          if (!lastChargeDate || new Date(tx.fecha) >= new Date(lastChargeDate)) {
            previousDebt -= tx.monto_usd
          }
        }
      })
    }

    // Obtener tasa de cambio
    const dollarRate = await getDollarRate()

    return NextResponse.json({
      representative: {
        id: representative.id,
        alias: representative.alias,
        code: representative.code,
        email: representative.email,
        phone: representative.phone,
        address: representative.address,
      },
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
          }
        : null,
      transportName: config?.transport_name || null,
      passengers: passengers || [],
      debt: {
        previous: previousDebt,
        current: currentDebt,
        previousBSF: previousDebt * dollarRate,
        currentBSF: currentDebt * dollarRate,
        dollarRate,
      },
      transactions: transactions || [],
    })
  } catch (error: any) {
    console.error('Error fetching representative:', error)
    return NextResponse.json(
      { error: 'Error al obtener información del representante' },
      { status: 500 }
    )
  }
}

