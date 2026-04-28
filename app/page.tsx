'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from './lib/supabase'
import type { Partida, Extra } from './lib/types'

const IVA_RATE = 0.10
const DISPONIBLE_HIPOTECA = 28649.64

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [partidas, setPartidas] = useState<Partida[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [certPartidas, setCertPartidas] = useState<{ partida_id: string; importe: number }[]>([])
  const [certExtras, setCertExtras] = useState<{ extra_id: string; importe: number }[]>([])

  useEffect(() => {
    if (!supabase) {
      setError('Supabase no está configurado')
      setLoading(false)
      return
    }
    loadData()
  }, [])

  async function loadData() {
    if (!supabase) return
    try {
      const [partidasRes, extrasRes, certPartidasRes, certExtrasRes] = await Promise.all([
        supabase.from('partidas').select('*'),
        supabase.from('extras').select('*'),
        supabase.from('certificacion_partidas').select('partida_id, importe'),
        supabase.from('certificacion_extras').select('extra_id, importe'),
      ])

      if (partidasRes.error) throw partidasRes.error
      if (extrasRes.error) throw extrasRes.error
      if (certPartidasRes.error) throw certPartidasRes.error
      if (certExtrasRes.error) throw certExtrasRes.error

      setPartidas(partidasRes.data || [])
      setExtras(extrasRes.data || [])
      setCertPartidas(certPartidasRes.data || [])
      setCertExtras(certExtrasRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading')
    } finally {
      setLoading(false)
    }
  }

  const presupuestoObra = partidas.reduce((sum, p) => sum + p.precio_total, 0)
  const presupuestoObraConIva = presupuestoObra * (1 + IVA_RATE)

  const totalCertificadoObra = certPartidas.reduce((sum, cp) => sum + cp.importe, 0)
  const totalCertificadoObraConIva = totalCertificadoObra * (1 + IVA_RATE)

  const presupuestoExtras = extras.reduce((sum, e) => sum + e.precio_total, 0)
  const presupuestoExtrasConIva = presupuestoExtras * (1 + IVA_RATE)

  const totalCertificadoExtras = certExtras.reduce((sum, ce) => sum + ce.importe, 0)
  const totalCertificadoExtrasConIva = totalCertificadoExtras * (1 + IVA_RATE)

  const pendienteObra = presupuestoObra - totalCertificadoObra
  const pendienteObraConIva = pendienteObra * (1 + IVA_RATE)

  const pendienteExtras = presupuestoExtras - totalCertificadoExtras
  const pendienteExtrasConIva = pendienteExtras * (1 + IVA_RATE)

  const totalPendiente = pendienteObra + pendienteExtras
  const totalPendienteConIva = pendienteObraConIva + pendienteExtrasConIva

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex gap-4">
          <a
            href="https://docs.google.com/spreadsheets/d/1XoyI3D_afC8s8HAWRUv2vKMTMYi3QzNdgu6pOFiL8yY/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Excel Propio
          </a>
          <a
            href="https://docs.google.com/spreadsheets/d/1CnWCBmZMT1FJY_hlVtRjBr5ENBcCMRYv8lLEVA7G294/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Excel Gestora
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Presupuesto de Obra</p>
          <p className="text-2xl font-bold">{presupuestoObra.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Presupuesto de Obra + IVA</p>
          <p className="text-2xl font-bold">{presupuestoObraConIva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Total Certificado Obra</p>
          <p className="text-2xl font-bold">{totalCertificadoObra.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Total Certificado Obra + IVA</p>
          <p className="text-2xl font-bold">{totalCertificadoObraConIva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Presupuesto de Extras</p>
          <p className="text-2xl font-bold">{presupuestoExtras.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Presupuesto de Extras + IVA</p>
          <p className="text-2xl font-bold">{presupuestoExtrasConIva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Total Certificado Extras</p>
          <p className="text-2xl font-bold">{totalCertificadoExtras.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Total Certificado Extras + IVA</p>
          <p className="text-2xl font-bold">{totalCertificadoExtrasConIva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
        <h3 className="text-lg font-semibold mb-4">Total Pendiente de Pago</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Pendiente Obra</p>
            <p className="text-xl font-bold">{pendienteObra.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Pendiente Extras</p>
            <p className="text-xl font-bold">{pendienteExtras.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Total Pendiente</p>
            <p className="text-2xl font-bold text-red-600">{totalPendiente.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
            <p className="text-sm text-zinc-500">(sin IVA)</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-zinc-500 mb-1">Total Pendiente con IVA (10%)</p>
              <p className="text-3xl font-bold text-red-600">{totalPendienteConIva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500 mb-1">Disponible Hipoteca</p>
              <p className="text-3xl font-bold text-green-600">{DISPONIBLE_HIPOTECA.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
