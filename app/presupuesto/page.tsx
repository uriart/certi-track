'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import type { Partida, PartidaWithProgress } from '../lib/types'

export default function Dashboard() {
  const [partidas, setPartidas] = useState<PartidaWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setError('Supabase no está configurado. Configura las variables de entorno.')
      setLoading(false)
      return
    }
    loadData()
  }, [])

  async function loadData() {
    if (!supabase) return
    try {
      const { data: partidasData, error: partidasError } = await supabase
        .from('partidas')
        .select('*')
        .order('concepto')

      if (partidasError) throw partidasError

      const { data: certPartidas, error: certError } = await supabase
        .from('certificacion_partidas')
        .select('*')

      if (certError) throw certError

      const groupedByPartida = (certPartidas || []).reduce((acc, cp) => {
        if (!acc[cp.partida_id]) {
          acc[cp.partida_id] = { porcentaje: 0, importe: 0 }
        }
        acc[cp.partida_id].porcentaje += cp.porcentaje
        acc[cp.partida_id].importe += cp.importe
        return acc
      }, {} as Record<string, { porcentaje: number; importe: number }>)

      const partidasWithProgress: PartidaWithProgress[] = (partidasData || []).map((p: Partida) => {
        const certData = groupedByPartida[p.id] || { porcentaje: 0, importe: 0 }
        return {
          ...p,
          porcentaje_completado: certData.porcentaje,
          importe_certificado: certData.importe,
          is_over_100: certData.porcentaje > 100,
        }
      })

      setPartidas(partidasWithProgress)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const totalPresupuesto = partidas.reduce((sum, p) => sum + p.precio_total, 0)
  const totalCertificado = partidas.reduce((sum, p) => sum + p.importe_certificado, 0)
  const promedioCompletado = totalPresupuesto > 0 ? (totalCertificado / totalPresupuesto) * 100 : 0

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
        <p className="text-sm mt-2">Asegúrate de haber configurado las variables de entorno de Supabase y ejecutado el schema de la base de datos.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Presupuesto de Obra</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Presupuesto Total</p>
          <p className="text-2xl font-bold">
            {totalPresupuesto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Total Certificado</p>
          <p className="text-2xl font-bold">{totalCertificado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">% Completado</p>
          <p className="text-2xl font-bold">{promedioCompletado.toFixed(1)}%</p>
        </div>
      </div>

      {partidas.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p>No hay partidas configuradas.</p>
          <p className="text-sm mt-2">Ve a la sección Partidas para añadir las partidas del presupuesto.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left p-4 font-medium text-zinc-600">Partida</th>
                <th className="text-right p-4 font-medium text-zinc-600">Presupuesto</th>
                <th className="text-right p-4 font-medium text-zinc-600">% Completado</th>
                <th className="text-center p-4 font-medium text-zinc-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {partidas.map((partida) => (
                <tr key={partida.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="p-4">
                    <Link href={`/presupuesto/${partida.id}`} className="text-blue-600 hover:underline">
                      {partida.concepto}
                    </Link>
                  </td>
                  <td className="p-4 text-right">
                    {partida.precio_total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="p-4 text-right">
                    <span className={partida.is_over_100 ? 'text-red-600 font-medium' : ''}>
                      {partida.porcentaje_completado.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {partida.is_over_100 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Excede 100%
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50 font-medium">
              <tr>
                <td className="p-4">TOTAL</td>
                <td className="p-4 text-right">
                  {totalPresupuesto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </td>
                <td className="p-4 text-right">{promedioCompletado.toFixed(1)}%</td>
                <td className="p-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
