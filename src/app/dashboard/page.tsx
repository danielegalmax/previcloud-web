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

const APK_URL =
  'https://github.com/Nexlap/previcloud-mobile/releases/download/v1.0.0-beta/previcloud-android-1.0.0-beta.apk'
const WINDOWS_INSTALLER_URL =
  'https://github.com/Nexlap/previcloud-desktop/releases/download/v1.0.0/PreviCloud_1.0.0_x64-setup.exe'
const MACOS_DMG_URL =
  'https://github.com/Nexlap/previcloud-desktop/releases/download/v1.0.0/PreviCloud_1.0.0_aarch64.dmg'
const TESTFLIGHT_URL = 'https://testflight.apple.com/join/RMpKNnCn'
const VERSIONE_ANDROID = '1.0.0'
const VERSIONE_WINDOWS = '1.0.0'
const VERSIONE_MACOS = '1.0.0'

function AndroidIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17.6 9.48l1.84-3.18c.16-.27.07-.62-.2-.78a.6.6 0 00-.78.2l-1.88 3.24a11.4 11.4 0 00-8.56 0L6.14 5.72a.6.6 0 00-.78-.2.6.6 0 00-.2.78L7 9.48A8.1 8.1 0 004 15.5h16a8.1 8.1 0 00-3.6-6.02zM8.5 14.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm7 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"
        fill="#3DDC84"
      />
    </svg>
  )
}

function WindowsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path fill="#0078D4" d="M3 12.5l8.5-1.1V21L3 19.9V12.5z" />
      <path fill="#0078D4" d="M12.5 11.2L21 10v9.9l-8.5-1.1v-7.6z" />
      <path fill="#0078D4" d="M3 4.1l8.5 1.2v7.1L3 11.3V4.1z" />
      <path fill="#0078D4" d="M12.5 12.4L21 13.6V4.1l-8.5 1.1v7.2z" />
    </svg>
  )
}

function MacIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
        fill="#555555"
      />
    </svg>
  )
}

function IosIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
        fill="#555555"
      />
    </svg>
  )
}

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

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <AndroidIcon />
            <div>
              <h2 className="text-lg font-semibold text-[#0D1B2A]">App Android</h2>
              <span className="text-xs text-gray-400 font-normal">v{VERSIONE_ANDROID}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 flex-1 mb-5">
            Scarica l&apos;APK e installa PreviCloud sul tuo smartphone Android.
          </p>
          <a
            href={APK_URL}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0D1B2A] text-white rounded-xl text-sm font-semibold hover:bg-[#162540] transition-all"
          >
            <Download size={16} />
            Scarica APK
          </a>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <WindowsIcon />
            <div>
              <h2 className="text-lg font-semibold text-[#0D1B2A]">App Windows</h2>
              <span className="text-xs text-gray-400 font-normal">v{VERSIONE_WINDOWS}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 flex-1 mb-5">
            Scarica l&apos;installer per usare PreviCloud sul tuo PC Windows.
          </p>
          <a
            href={WINDOWS_INSTALLER_URL}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0D1B2A] text-white rounded-xl text-sm font-semibold hover:bg-[#162540] transition-all"
          >
            <Download size={16} />
            Scarica installer
          </a>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <MacIcon />
            <div>
              <h2 className="text-lg font-semibold text-[#0D1B2A]">App macOS</h2>
              <span className="text-xs text-gray-400 font-normal">v{VERSIONE_MACOS}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 flex-1 mb-5">
            Scarica il DMG per usare PreviCloud sul tuo Mac (Apple Silicon).
          </p>
          <a
            href={MACOS_DMG_URL}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0D1B2A] text-white rounded-xl text-sm font-semibold hover:bg-[#162540] transition-all"
          >
            <Download size={16} />
            Scarica DMG
          </a>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <IosIcon />
            <div>
              <h2 className="text-lg font-semibold text-[#0D1B2A]">App iPhone/iPad</h2>
              <span className="text-xs text-gray-400 font-normal">TestFlight</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 flex-1 mb-5">
            Prova PreviCloud su iOS tramite TestFlight.
          </p>
          <a
            href={TESTFLIGHT_URL}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0D1B2A] text-white rounded-xl text-sm font-semibold hover:bg-[#162540] transition-all"
          >
            <Download size={16} />
            Apri TestFlight
          </a>
        </div>
      </div>

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
