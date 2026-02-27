'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import type { Partida, Certificacion } from '../../lib/types'

const IVA_RATE = 0.10

interface CertificacionDetalle extends Certificacion {
  porcentaje: number
  importe: number
}

export default function PartidaDetallePage() {
  const params = useParams()
  const partidaId = params.id as string

  const [partida, setPartida] = useState<Partida | null>(null)
  const [certificaciones, setCertificaciones] = useState<CertificacionDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setError('Supabase no está configurado')
      setLoading(false)
      return
    }
    loadData()
  }, [partidaId])

  async function loadData() {
    if (!supabase) return
    try {
      const { data: partidaData, error: partidaError } = await supabase
        .from('partidas')
        .select('*')
        .eq('id', partidaId)
        .single()

      if (partidaError) throw partidaError
      setPartida(partidaData)

      const { data: certPartidas, error: certError } = await supabase
        .from('certificacion_partidas')
        .select('*')
        .eq('partida_id', partidaId)

      if (certError) throw certError

      const certDetails: CertificacionDetalle[] = []
      for (const cp of (certPartidas || [])) {
        const { data: certData, error: certError } = await supabase
          .from('certificaciones')
          .select('*')
          .eq('id', cp.certificacion_id)
          .single()

        if (certError) continue

        certDetails.push({
          ...certData,
          porcentaje: cp.porcentaje,
          importe: cp.importe,
        })
      }

      certDetails.sort((a, b) => a.numero - b.numero)
      setCertificaciones(certDetails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading')
    } finally {
      setLoading(false)
    }
  }

  const totalCertificado = certificaciones.reduce((sum, c) => sum + c.importe, 0)
  const totalIva = totalCertificado * IVA_RATE
  const totalConIva = totalCertificado + totalIva
  const porcentajeTotal = partida ? (totalCertificado / partida.precio_total) * 100 : 0

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    )
  }

  if (error || !partida) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Partida no encontrada'}</p>
        <Link href="/presupuesto" className="text-blue-600 hover:underline mt-4 inline-block">
          Volver a Presupuesto de Obra
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/presupuesto" className="text-blue-600 hover:underline text-sm">
        ← Volver a Presupuesto de Obra
      </Link>

      <h2 className="text-2xl font-bold mt-4 mb-2">{partida.concepto}</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Presupuesto</p>
          <p className="text-2xl font-bold">
            {partida.precio_total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Total Certificado</p>
          <p className="text-2xl font-bold">
            {totalCertificado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">% Completado</p>
          <p className={`text-2xl font-bold ${porcentajeTotal > 100 ? 'text-red-600' : ''}`}>
            {porcentajeTotal.toFixed(2)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Total + IVA (10%)</p>
          <p className="text-2xl font-bold">
            {totalConIva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4">Detalle por Certificación</h3>

      {certificaciones.length === 0 ? (
        <p className="text-zinc-500">No hay certificaciones para esta partida.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left p-4 font-medium text-zinc-600">Certificación</th>
                <th className="text-left p-4 font-medium text-zinc-600">Fecha</th>
                <th className="text-right p-4 font-medium text-zinc-600">%</th>
                <th className="text-right p-4 font-medium text-zinc-600">Importe</th>
                <th className="text-right p-4 font-medium text-zinc-600">Importe + IVA</th>
              </tr>
            </thead>
            <tbody>
              {certificaciones.map((cert, index) => (
                <tr key={cert.id} className={`border-b border-zinc-100 ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}`}>
                  <td className="p-4 font-medium">#{cert.numero}</td>
                  <td className="p-4">
                    {new Date(cert.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </td>
                  <td className={`p-4 text-right ${cert.porcentaje < 0 ? 'text-red-600' : ''}`}>
                    {cert.porcentaje.toFixed(2)}%
                  </td>
                  <td className={`p-4 text-right ${cert.porcentaje < 0 ? 'text-red-600' : ''}`}>
                    {cert.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className={`p-4 text-right ${cert.porcentaje < 0 ? 'text-red-600' : ''}`}>
                    {(cert.importe * (1 + IVA_RATE)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50 font-medium">
              <tr>
                <td className="p-4">TOTAL</td>
                <td className="p-4"></td>
                <td className="p-4 text-right">{porcentajeTotal.toFixed(2)}%</td>
                <td className="p-4 text-right">
                  {totalCertificado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </td>
                <td className="p-4 text-right">
                  {totalConIva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
