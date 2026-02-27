export interface Partida {
  id: string
  concepto: string
  precio_total: number
  created_at: string
  updated_at: string
}

export interface Extra {
  id: string
  concepto: string
  precio_total: number
  created_at: string
  updated_at: string
}

export interface Certificacion {
  id: string
  numero: number
  fecha: string
  observaciones: string | null
  pdf_path: string | null
  created_at: string
}

export interface CertificacionExtra {
  id: string
  numero: number
  fecha: string
  observaciones: string | null
  pdf_path: string | null
  created_at: string
}

export interface CertificacionPartida {
  id: string
  certificacion_id: string
  partida_id: string
  porcentaje: number
  importe: number
  created_at: string
}

export interface CertificacionExtraItem {
  id: string
  certificacion_extra_id: string
  extra_id: string
  importe: number
  created_at: string
}

export interface PartidaWithProgress extends Partida {
  porcentaje_completado: number
  importe_certificado: number
  is_over_100: boolean
}

export interface ExtraWithProgress extends Extra {
  importe_certificado: number
}

export interface CertificacionWithTotal extends Certificacion {
  total: number
  iva: number
  total_con_iva: number
}

export interface CertificacionExtraWithTotal extends CertificacionExtra {
  total: number
  iva: number
  total_con_iva: number
}
