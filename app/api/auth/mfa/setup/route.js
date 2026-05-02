// app/api/auth/mfa/setup/route.js
import { NextResponse } from 'next/server'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'

// Stockage temporaire en mémoire serveur (max 10 min)
// Les données du formulaire restent ici jusqu'à validation du code MFA
export const tempStore = new Map()

export async function POST(req) {
  const { formData, userType } = await req.json()

  if (!formData?.email || !userType) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Nettoyer les entrées expirées
  const now = Date.now()
  for (const [key, val] of tempStore.entries()) {
    if (val.expiresAt < now) tempStore.delete(key)
  }

  // Générer le secret TOTP
  const secret = speakeasy.generateSecret({
    name: `PetAdopt (${formData.email})`,
    length: 20
  })

  // Token unique pour identifier cette tentative d'inscription
  const tempToken = crypto.randomUUID()

  // Stocker les données du formulaire temporairement (PAS en DB)
  tempStore.set(tempToken, {
    formData,
    userType,
    secret: secret.base32,
    expiresAt: now + 10 * 60 * 1000  // expire dans 10 min
  })

  // Générer le QR code en base64
  const qrCode = await QRCode.toDataURL(secret.otpauth_url)

  return NextResponse.json({ qrCode, tempToken })
}