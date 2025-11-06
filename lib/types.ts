export interface Organization {
  id: string
  name: string
  created_at: string
  created_by: string
}

export interface AppConfig {
  organization_id: string
  tarifa_general_usd: number
  last_weekly_charge_applied: string | null
  updated_at: string
  updated_by: string
  transport_name: string | null
  theme_preference: 'light' | 'dark' | 'system'
}

export interface Representative {
  id: string
  organization_id: string
  alias: string
  email: string | null
  phone: string | null
  address: string | null
  code: string
  created_at: string
  updated_at: string
}

export interface Passenger {
  id: string
  organization_id: string
  nombre: string
  tipo: 'niño' | 'docente'
  representante_id: string | null
  tarifa_semanal_usd: number | null
  tarifa_personalizada: number | null
  activo: boolean
  observaciones: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  organization_id: string
  representante_id: string
  fecha: string
  tipo: 'cargo' | 'pago'
  monto_usd: number
  concepto: string
  notas: string | null
  created_at: string
  created_by: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  created_at: string
  is_active: boolean
}

export interface RepresentativeWithDebt extends Representative {
  deuda_actual_usd: number
  deuda_anterior_usd: number
  passengers: Passenger[]
  transactions: Transaction[]
}

