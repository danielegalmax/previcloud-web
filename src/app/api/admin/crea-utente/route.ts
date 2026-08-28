import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import {
  APK_URL,
  IOS_TESTFLIGHT_URL,
  MACOS_DMG_URL,
  VERSIONE_ANDROID,
  VERSIONE_MACOS,
  VERSIONE_WINDOWS,
  WINDOWS_INSTALLER_URL,
} from '@/lib/downloadUrls'

export async function POST(req: NextRequest) {
  // 1. Verifica chi chiama è admin (stesso pattern di
  //    api/admin/utente/[id]/trial/route.ts - riusa esattamente
  //    la stessa logica di auth+check is_admin)
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', adminUser.id)
    .single()
  if (!adminProfile?.is_admin) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  // 2. Valida body
  const body = await req.json()
  const { email, password, telefono, nome_azienda } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'Email e password obbligatorie' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password troppo corta (minimo 8 caratteri)' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 3. Crea utente Auth con email già confermata
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError || !newUser.user) {
    console.error('crea-utente error:', createError)
    return NextResponse.json({ error: createError?.message || 'Errore creazione utente' }, { status: 500 })
  }

  // 4. Calcola trial 60 giorni da ora
  const trialInizio = new Date()
  const trialFine = new Date(trialInizio.getTime() + 60 * 24 * 60 * 60 * 1000)

  // 5. Aggiorna profilo (creato automaticamente dal trigger on_auth_user_created)
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      telefono: telefono || null,
      nome_azienda: nome_azienda || null,
      plan: 'beta',
      trial_inizio: trialInizio.toISOString(),
      trial_ends_at: trialFine.toISOString(),
    })
    .eq('id', newUser.user.id)

  if (updateError) {
    console.error('crea-utente profile update error:', updateError)
    return NextResponse.json({ error: 'Utente creato ma profilo non aggiornato' }, { status: 500 })
  }

  // 6. Invia email di benvenuto con credenziali
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'PreviCloud <noreply@previcloud.it>',
      to: email,
      subject: 'Il tuo account PreviCloud è pronto!',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
          <h1>Congratulazioni! Il tuo account è stato creato</h1>
          <p>Ecco le tue credenziali di accesso:</p>
          <p><strong>Email:</strong> ${email}<br/>
          <strong>Password:</strong> ${password}</p>
          <p>Hai 60 giorni di prova gratuita del piano BETA, fino al ${trialFine.toLocaleDateString('it-IT')}.</p>
          <p><a href="https://previcloud.it/login">Accedi ora</a> per iniziare, accettare i termini e scaricare l'app.</p>
          <div style="margin-top:32px">
            <p style="font-size:14px;color:#0D1B2A;font-weight:600;margin:0 0 12px">Scarica l'app</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
              <tr>
                <td style="padding:16px">
                  <p style="margin:0;font-size:16px;font-weight:600;color:#0D1B2A">App Android</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#9ca3af">v${VERSIONE_ANDROID}</p>
                  <p style="margin:8px 0 14px;font-size:13px;color:#6b7280">Scarica l'APK e installa PreviCloud sul tuo smartphone Android.</p>
                  <a href="${APK_URL}" style="display:inline-block;padding:10px 16px;background:#0D1B2A;color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">Scarica APK</a>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
              <tr>
                <td style="padding:16px">
                  <p style="margin:0;font-size:16px;font-weight:600;color:#0D1B2A">App Windows</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#9ca3af">v${VERSIONE_WINDOWS}</p>
                  <p style="margin:8px 0 14px;font-size:13px;color:#6b7280">Scarica l'installer per usare PreviCloud sul tuo PC Windows.</p>
                  <a href="${WINDOWS_INSTALLER_URL}" style="display:inline-block;padding:10px 16px;background:#0D1B2A;color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">Scarica installer</a>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
              <tr>
                <td style="padding:16px">
                  <p style="margin:0;font-size:16px;font-weight:600;color:#0D1B2A">App macOS</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#9ca3af">v${VERSIONE_MACOS}</p>
                  <p style="margin:8px 0 14px;font-size:13px;color:#6b7280">Scarica il DMG per usare PreviCloud sul tuo Mac (Apple Silicon).</p>
                  <a href="${MACOS_DMG_URL}" style="display:inline-block;padding:10px 16px;background:#0D1B2A;color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">Scarica DMG</a>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
              <tr>
                <td style="padding:16px">
                  <p style="margin:0;font-size:16px;font-weight:600;color:#0D1B2A">App iPhone/iPad</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#9ca3af">TestFlight</p>
                  <p style="margin:8px 0 14px;font-size:13px;color:#6b7280">Prova PreviCloud su iOS tramite TestFlight.</p>
                  <a href="${IOS_TESTFLIGHT_URL}" style="display:inline-block;padding:10px 16px;background:#0E9F8E;color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">Apri TestFlight</a>
                </td>
              </tr>
            </table>
          </div>
        </div>
      `,
      text: `Congratulazioni! Il tuo account PreviCloud è stato creato.\n\nEmail: ${email}\nPassword: ${password}\n\nHai 60 giorni di prova gratuita, fino al ${trialFine.toLocaleDateString('it-IT')}.\n\nAccedi su https://previcloud.it/login per iniziare, accettare i termini e scaricare l'app.\n\nScarica l'app:\n${APK_URL}\n${WINDOWS_INSTALLER_URL}\n${MACOS_DMG_URL}\n${IOS_TESTFLIGHT_URL}`,
    })
  } catch (emailError) {
    console.error('crea-utente email error:', emailError)
    // Non blocchiamo la risposta se l'email fallisce - l'utente è comunque creato
  }

  return NextResponse.json({ ok: true, user_id: newUser.user.id })
}
