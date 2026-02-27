'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Partida, CertificacionWithTotal } from '../lib/types'

const IVA_RATE = 0.10

export default function CertificacionesPage() {
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [certificaciones, setCertificaciones] = useState<CertificacionWithTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [numeroCert, setNumeroCert] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [partidasForm, setPartidasForm] = useState<Record<string, string>>({})
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  function calculateImporte(partidaId: string, porcentaje: number): number {
    const partida = partidas.find(p => p.id === partidaId)
    if (!partida) return 0
    return partida.precio_total * (porcentaje / 100)
  }

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
      const [partidasRes, certRes] = await Promise.all([
        supabase.from('partidas').select('*').order('concepto'),
        supabase.from('certificaciones').select('*').order('numero', { ascending: false }),
      ])

      if (partidasRes.error) throw partidasRes.error
      if (certRes.error) throw certRes.error

      setPartidas(partidasRes.data || [])

      const certWithTotals: CertificacionWithTotal[] = []
      for (const cert of (certRes.data || [])) {
        const { data: items } = await supabase
          .from('certificacion_partidas')
          .select('importe')
          .eq('certificacion_id', cert.id)

        const total = (items || []).reduce((sum, i) => sum + i.importe, 0)
        certWithTotals.push({
          ...cert,
          total,
          iva: total * IVA_RATE,
          total_con_iva: total * (1 + IVA_RATE),
        })
      }
      setCertificaciones(certWithTotals)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading')
    } finally {
      setLoading(false)
    }
  }

  async function initForm() {
    if (!supabase) return
    const initial: Record<string, string> = {}
    partidas.forEach((p) => {
      initial[p.id] = ''
    })
    setPartidasForm(initial)

    const { data: lastCert } = await supabase
      .from('certificaciones')
      .select('numero')
      .order('numero', { ascending: false })
      .limit(1)

    const nextNum = (lastCert?.[0]?.numero || 0) + 1
    setNumeroCert(String(nextNum))
    setObservaciones('')
    setPdfFile(null)
  }

  async function handleOpenForm() {
    if (partidas.length === 0) {
      setError('No hay partidas configuradas. Añade partidas primero.')
      return
    }
    await initForm()
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  function updatePartidaValue(partidaId: string, value: string) {
    setPartidasForm((prev) => ({
      ...prev,
      [partidaId]: value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError(null)

    try {
      let pdfPath: string | null = null

      if (pdfFile) {
        const fileName = `certificacion_${numeroCert}_${Date.now()}.pdf`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('certificaciones')
          .upload(fileName, pdfFile, {
            contentType: 'application/pdf',
            upsert: false,
          })

        if (uploadError) throw uploadError
        pdfPath = uploadData.path
      }

      const { data: certData, error: certError } = await supabase
        .from('certificaciones')
        .insert({
          numero: parseInt(numeroCert),
          observaciones: observaciones || null,
          pdf_path: pdfPath,
        })
        .select()
        .single()

      if (certError) throw certError

      const itemsToInsert = Object.entries(partidasForm)
        .filter(([, val]) => val)
        .map(([partidaId, porcentaje]) => {
          const importe = calculateImporte(partidaId, parseFloat(porcentaje))
          return {
            certificacion_id: certData.id,
            partida_id: partidaId,
            porcentaje: parseFloat(porcentaje),
            importe,
          }
        })

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('certificacion_partidas')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      setShowForm(false)
      setSuccess(`Certificación #${numeroCert} creada correctamente`)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  const calculateTotals = () => {
    const total = Object.entries(partidasForm).reduce((sum, [partidaId, porcentaje]) => {
      return sum + calculateImporte(partidaId, parseFloat(porcentaje) || 0)
    }, 0)
    const iva = total * IVA_RATE
    return { total, iva, totalConIva: total + iva }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Certificaciones</h2>
        <button
          onClick={handleOpenForm}
          className="bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Nueva Certificación
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-4">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Nueva Certificación #{numeroCert}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                rows={2}
                placeholder="Opcional..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                PDF de la certificación
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="w-full p-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
              />
              {pdfFile && (
                <p className="text-sm text-zinc-500 mt-1">Archivo seleccionado: {pdfFile.name}</p>
              )}
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-zinc-700 mb-3">% de cada partida</h4>
              <div className="space-y-1">
                {partidas.map((partida, index) => (
                  <div 
                    key={partida.id} 
                    className={`flex items-center gap-4 p-3 ${index % 2 === 0 ? 'bg-zinc-50' : 'bg-white'}`}
                  >
                    <div className="flex-1">
                      <span className="text-sm text-zinc-600">{partida.concepto}</span>
                      <span className="text-xs text-zinc-400 ml-2">
                        (Presupuesto: {partida.precio_total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })})
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={partidasForm[partida.id] || ''}
                      onChange={(e) => updatePartidaValue(partida.id, e.target.value)}
                      className="w-24 p-2 border border-zinc-300 rounded-lg text-right"
                      placeholder="%"
                    />
                    <span className="w-32 text-right text-zinc-600 font-medium">
                      {calculateImporte(partida.id, parseFloat(partidasForm[partida.id]) || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span>Base Imponible:</span>
                <span className="font-medium">
                  {calculateTotals().total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span>IVA (10%):</span>
                <span className="font-medium">
                  {calculateTotals().iva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-zinc-200">
                <span>Total:</span>
                <span>
                  {calculateTotals().totalConIva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-zinc-900 text-white px-6 py-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Crear Certificación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && certificaciones.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p>No hay certificaciones.</p>
          <p className="text-sm mt-2">Crea tu primera certificación.</p>
        </div>
      ) : !showForm && (
        <div className="space-y-4">
          {certificaciones.map((cert) => {
            const pdfUrl = cert.pdf_path && supabase 
              ? supabase.storage.from('certificaciones').getPublicUrl(cert.pdf_path).data.publicUrl
              : null
            
            return (
              <div key={cert.id} className="bg-white rounded-lg shadow-sm border border-zinc-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      Certificación #{cert.numero}
                      {pdfUrl && (
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          (Descargar PDF)
                        </a>
                      )}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {new Date(cert.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {cert.observaciones && (
                      <p className="text-sm text-zinc-600 mt-2">{cert.observaciones}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">Base Imponible</p>
                    <p className="font-medium">
                      {cert.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-sm text-zinc-500 mt-2">IVA (10%)</p>
                    <p className="font-medium">
                      {cert.iva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-sm text-zinc-500 mt-2">Total</p>
                    <p className="font-bold text-lg">
                      {cert.total_con_iva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
