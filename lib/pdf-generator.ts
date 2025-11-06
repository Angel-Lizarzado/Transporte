import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatCurrency } from './utils'

// Extender el tipo de jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface ReceiptData {
  transportName: string
  representative: {
    id: string
    alias: string
    code: string
    email: string | null
    phone: string | null
    address: string | null
  }
  passengers: Array<{
    id: string
    nombre: string
    tarifa_personalizada: number | null
    tarifa_semanal_usd: number | null
  }>
  previousDebt: number
  currentDebt: number
  transactions: Array<{
    id: string
    fecha: string
    tipo: 'cargo' | 'pago'
    monto_usd: number
    concepto: string
    notas: string | null
  }>
  dollarRate: number
}

export async function generateReceiptPDF(data: ReceiptData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  // Color vinotinto
  const vinotintoColor: [number, number, number] = [51, 0, 0]

  // Encabezado
  doc.setFillColor(vinotintoColor[0], vinotintoColor[1], vinotintoColor[2])
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(data.transportName, pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Recibo de Pago', pageWidth / 2, 30, { align: 'center' })

  yPos = 50

  // Información del representante
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Información del Representante', margin, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nombre: ${data.representative.alias}`, margin, yPos)
  yPos += 6
  doc.text(`Código: ${data.representative.code}`, margin, yPos)
  yPos += 6
  if (data.representative.email) {
    doc.text(`Email: ${data.representative.email}`, margin, yPos)
    yPos += 6
  }
  if (data.representative.phone) {
    doc.text(`Teléfono: ${data.representative.phone}`, margin, yPos)
    yPos += 6
  }
  if (data.representative.address) {
    doc.text(`Dirección: ${data.representative.address}`, margin, yPos)
    yPos += 6
  }

  yPos += 5

  // Niños registrados
  if (data.passengers.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Niños Registrados', margin, yPos)
    yPos += 10

    const passengersData = data.passengers.map((passenger) => {
      const fee =
        passenger.tarifa_personalizada || passenger.tarifa_semanal_usd || 0
      return [
        passenger.nombre,
        formatCurrency(fee, 'USD'),
        formatCurrency(fee * data.dollarRate, 'BSF'),
      ]
    })

    doc.autoTable({
      startY: yPos,
      head: [['Nombre', 'Tarifa (USD)', 'Tarifa (Bs.F)']],
      body: passengersData,
      theme: 'striped',
      headStyles: {
        fillColor: vinotintoColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      margin: { left: margin, right: margin },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // Deuda
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen de Deuda', margin, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Deuda Anterior: ${formatCurrency(data.previousDebt, 'USD')} (${formatCurrency(data.previousDebt * data.dollarRate, 'BSF')})`,
    margin,
    yPos
  )
  yPos += 6
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(vinotintoColor[0], vinotintoColor[1], vinotintoColor[2])
  doc.text(
    `Deuda Actual: ${formatCurrency(data.currentDebt, 'USD')} (${formatCurrency(data.currentDebt * data.dollarRate, 'BSF')})`,
    margin,
    yPos
  )
  yPos += 10

  // Historial de transacciones
  if (data.transactions.length > 0) {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Historial de Transacciones', margin, yPos)
    yPos += 10

    const transactionsData = data.transactions.map((transaction) => {
      const date = new Date(transaction.fecha)
      return [
        date.toLocaleDateString('es-VE'),
        transaction.concepto,
        transaction.tipo === 'cargo' ? 'Cargo' : 'Pago',
        formatCurrency(transaction.monto_usd, 'USD'),
        formatCurrency(transaction.monto_usd * data.dollarRate, 'BSF'),
      ]
    })

    doc.autoTable({
      startY: yPos,
      head: [
        ['Fecha', 'Concepto', 'Tipo', 'Monto (USD)', 'Monto (Bs.F)'],
      ],
      body: transactionsData,
      theme: 'striped',
      headStyles: {
        fillColor: vinotintoColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      margin: { left: margin, right: margin },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // Pie de página
  const footerY = pageHeight - 20
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Tasa de cambio: ${data.dollarRate.toFixed(2)} Bs.F/USD`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )
  doc.text(
    `Generado el: ${new Date().toLocaleDateString('es-VE')}`,
    pageWidth / 2,
    footerY + 6,
    { align: 'center' }
  )

  // Guardar PDF
  doc.save(`recibo-${data.representative.code}-${Date.now()}.pdf`)
}

