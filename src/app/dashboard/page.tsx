'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getProdottiUtente } from '@/lib/prodotti'
import { formatEuro } from '@/lib/formatEuro'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  PreventiviTable,
  salutoOrario,
  dataItalianaMaiuscola,
  type PreventivoRow,
} from '@/components/PreventiviTable'
import {
  FileText,
  CreditCard,
  ShoppingBag,
  Package,
  ArrowRight,
  Download,
} from 'lucide-react'

const PREVENTIVI_SELECT = `
  id, nome_cliente, importo_totale, stato, created_at, pdf_url, numero_preventivo, titolo, pagato,
  preventivo_invii ( link_token, revocato_at, scade_at, inviato_at )
`

async function fetchIncassatoTotale(accessToken: string): Promise<number> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/home-stats`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return 0
    const data = await res.json()
    return data.incassatoTotale ?? 0
  } catch {
    return 0
  }
}

export default function Dashboard() {
  const [nomeAzienda, setNomeAzienda] = useState('')
  const [totalePreventivi, setTotalePreventivi] = useState(0)
  const [incassatoTotale, setIncassatoTotale] = useState(0)
  const [totaleVendite, setTotaleVendite] = useState(0)
  const [ultimiPreventivi, setUltimiPreventivi] = useState<PreventivoRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void carica()
  }, [])

  async function carica() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: prof } = await supabase
      .from('profiles')
      .select('nome_azienda')
      .eq('id', user.id)
      .single()
    if (prof?.nome_azienda) setNomeAzienda(prof.nome_azienda)

    const { count: countPreventivi } = await supabase
      .from('preventivi')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    setTotalePreventivi(countPreventivi ?? 0)

    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      const incassato = await fetchIncassatoTotale(session.access_token)
      setIncassatoTotale(incassato)
    }

    const { data: prevs } = await supabase
      .from('preventivi')
      .select(PREVENTIVI_SELECT)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (prevs) setUltimiPreventivi(prevs as PreventivoRow[])

    const prodotti = await getProdottiUtente(user.id)
    const productIds = prodotti.map((p) => p.id)
    if (productIds.length > 0) {
      const { count: countVendite } = await supabase
        .from('acquisti_prodotti')
        .select('*', { count: 'exact', head: true })
        .in('prodotto_id', productIds)
        .eq('pagato', true)
      setTotaleVendite(countVendite ?? 0)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const nomeDisplay = nomeAzienda || 'Artigiano'
  const incassatoLabel = formatEuro(incassatoTotale) ?? '€0,00'

  return (
    <DashboardLayout nomeAzienda={nomeDisplay} activeRoute="/dashboard">
      <div className="mb-8">
        <p className="text-xs font-medium text-brand-muted-2 tracking-wide">
          {dataItalianaMaiuscola()}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight mt-1">
          Buon {salutoOrario()}, {nomeDisplay}
        </h1>
        <p className="text-sm text-brand-muted mt-2">
          Panoramica della tua attività su PreviCloud
        </p>
      </div>

      {/* Incassato totale — metrica primaria, isolata e con peso visivo maggiore */}
      <div className="bg-brand-navy rounded-card-lg p-6 sm:p-7 mb-4 shadow-card flex items-center justify-between gap-6">
        <div>
          <p className="text-xs text-gray-400">Incassato totale</p>
          <p className="text-4xl font-bold text-white mt-1.5 tracking-tight">{incassatoLabel}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <CreditCard size={22} className="text-brand-teal-light" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-brand-border rounded-card p-5 shadow-card shadow-card-hover transition-shadow flex items-start justify-between">
          <div>
            <p className="text-xs text-brand-muted">Preventivi creati</p>
            <p className="text-2xl font-bold text-brand-navy mt-1">
              {totalePreventivi}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center">
            <FileText size={19} className="text-brand-muted-2" />
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded-card p-5 shadow-card shadow-card-hover transition-shadow flex items-start justify-between">
          <div>
            <p className="text-xs text-brand-muted">Vendite prodotti digitali</p>
            <p className="text-2xl font-bold text-brand-teal mt-1">
              {totaleVendite}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
            <ShoppingBag size={19} className="text-brand-teal" />
          </div>
        </div>
      </div>

      <Link
        href="/scarica"
        className="flex items-center justify-between gap-4 bg-white border border-brand-border text-brand-navy rounded-card p-5 sm:p-6 mb-6 shadow-card hover:shadow-card-hover transition-all group"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 bg-brand-bg rounded-xl flex items-center justify-center shrink-0">
            <Download size={22} className="text-brand-teal" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base">Scarica l&apos;app</p>
            <p className="text-sm text-brand-muted mt-0.5">
              Android, iOS, Windows e macOS — scegli la piattaforma
            </p>
          </div>
        </div>
        <ArrowRight
          size={20}
          className="shrink-0 text-brand-muted group-hover:translate-x-0.5 transition-transform"
        />
      </Link>

      <Link
        href="/dashboard/prodotti"
        className="flex items-center justify-between gap-4 bg-brand-teal text-white rounded-card p-5 sm:p-6 mb-8 shadow-card hover:shadow-card-hover hover:bg-brand-teal-dark transition-all group"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Package size={22} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base">I tuoi prodotti digitali</p>
            <p className="text-sm text-white/80 mt-0.5">
              Vendi guide, template e file ai tuoi clienti
            </p>
          </div>
        </div>
        <ArrowRight
          size={20}
          className="shrink-0 group-hover:translate-x-0.5 transition-transform"
        />
      </Link>

      <PreventiviTable
        preventivi={ultimiPreventivi}
        showHeaderLink
        title="Storico preventivi"
        subtitle="Ultimi 5 preventivi"
      />
    </DashboardLayout>
  )
}
