'use client'

import { useEffect, useState } from 'react'
import { Loader2, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  APK_URL,
  IOS_TESTFLIGHT_URL,
  MACOS_DMG_URL,
  VERSIONE_ANDROID,
  VERSIONE_MACOS,
  VERSIONE_WINDOWS,
  WINDOWS_INSTALLER_URL,
} from '@/lib/downloadUrls'

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
        fill="#0D1B2A"
      />
    </svg>
  )
}

export default function ScaricaPage() {
  const [nomeAzienda, setNomeAzienda] = useState('')
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
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#0E9F8E]" />
      </div>
    )
  }

  return (
    <DashboardLayout nomeAzienda={nomeAzienda} activeRoute="/scarica">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0D1B2A]">Scarica PreviCloud</h1>
          <p className="text-sm text-gray-500 mt-1">
            Installa l&apos;app sul tuo dispositivo per lavorare ovunque.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              href={IOS_TESTFLIGHT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0E9F8E] text-white rounded-xl text-sm font-semibold hover:bg-[#0B8A7B] transition-all"
            >
              <Download size={16} />
              Apri TestFlight
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
        </div>
      </div>
    </DashboardLayout>
  )
}
