import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic' // Desactiva el cacheo

export async function POST(request: Request) {
  try {
    // Verificar secreto del cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const supabase = createServiceClient()

    // Obtener todas las organizaciones
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id')

    if (orgError) {
      throw orgError
    }

    if (!organizations) {
      return NextResponse.json({ message: 'No hay organizaciones' })
    }

    const now = new Date()
    const results = []

    for (const org of organizations) {
      try {
        // Obtener configuración
        const { data: config } = await supabase
          .from('app_config')
          .select('*')
          .eq('organization_id', org.id)
          .single()

        if (!config) continue

        const tarifaGeneral = config.tarifa_general_usd || 0

        // Obtener todos los representantes
        const { data: representatives } = await supabase
          .from('representatives')
          .select('id')
          .eq('organization_id', org.id)

        if (!representatives) continue

        for (const rep of representatives) {
          // Obtener niños activos del representante
          const { data: passengers } = await supabase
            .from('passengers')
            .select('tarifa_personalizada, tarifa_semanal_usd')
            .eq('representante_id', rep.id)
            .eq('tipo', 'niño')
            .eq('activo', true)

          if (!passengers || passengers.length === 0) continue

          // Calcular monto semanal
          let montoSemanal = 0
          passengers.forEach((passenger) => {
            const fee =
              passenger.tarifa_personalizada ||
              passenger.tarifa_semanal_usd ||
              tarifaGeneral
            montoSemanal += fee
          })

          if (montoSemanal > 0) {
            // Crear transacción de cargo semanal
            const { error: txError } = await supabase
              .from('transactions')
              .insert({
                organization_id: org.id,
                representante_id: rep.id,
                fecha: now.toISOString(),
                tipo: 'cargo',
                monto_usd: montoSemanal,
                concepto: 'Cargo semanal',
                notas: `Cargo semanal aplicado el ${now.toLocaleDateString('es-VE')}`,
                created_by: config.updated_by, // Usar el último usuario que actualizó la configuración
              })

            if (txError) {
              console.error(
                `Error creando transacción para representante ${rep.id}:`,
                txError
              )
            } else {
              results.push({
                organization_id: org.id,
                representative_id: rep.id,
                amount: montoSemanal,
                status: 'success',
              })
            }
          }
        }

        // Actualizar fecha de última carga semanal
        await supabase
          .from('app_config')
          .update({
            last_weekly_charge_applied: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('organization_id', org.id)
      } catch (error) {
        console.error(`Error procesando organización ${org.id}:`, error)
        results.push({
          organization_id: org.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Error desconocido',
        })
      }
    }

    return NextResponse.json({
      message: 'Carga semanal completada',
      timestamp: now.toISOString(),
      results,
    })
  } catch (error: any) {
    console.error('Error en carga semanal:', error)
    return NextResponse.json(
      { error: 'Error al procesar carga semanal', details: error.message },
      { status: 500 }
    )
  }
}

