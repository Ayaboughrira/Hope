// app/api/auth/mfa/verify/route.js
import { NextResponse } from 'next/server'
import speakeasy from 'speakeasy'
import { connectDB } from '../../../../config/mongodb'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'
import { tempStore } from '../setup/route'

export async function POST(req) {
  const { token: otpToken, tempToken, userId } = await req.json()

  if (!otpToken) {
    return NextResponse.json({ error: 'Code manquant' }, { status: 400 })
  }

  const db = await connectDB()
  const collections = ['user', 'veterinaire', 'association', 'animalrie']

  // ─── CAS 1 : SIGNUP — tempToken présent ───────────────────────────────────
  if (tempToken) {
    const tempData = tempStore.get(tempToken)

    if (!tempData) {
      return NextResponse.json({
        error: "Session expirée, veuillez recommencer l'inscription"
      }, { status: 400 })
    }

    if (tempData.expiresAt < Date.now()) {
      tempStore.delete(tempToken)
      return NextResponse.json({
        error: 'Session expirée (10 min), veuillez recommencer'
      }, { status: 400 })
    }

    // Vérifier le code TOTP
    const verified = speakeasy.totp.verify({
      secret: tempData.secret,
      encoding: 'base32',
      token: otpToken,
      window: 1
    })

    if (!verified) {
      return NextResponse.json({ error: 'Code invalide, réessayez' }, { status: 401 })
    }

    // ✅ Code correct → créer le compte
    const { formData, userType } = tempData

    const collectionMap = {
      owner: 'user', vet: 'veterinaire',
      association: 'association', store: 'animalrie'
    }
    const targetCollection = collectionMap[userType]

    if (!targetCollection) {
      return NextResponse.json({ error: 'Type utilisateur invalide' }, { status: 400 })
    }

    // Vérifier email déjà utilisé
    const existing = await db.collection(targetCollection).findOne({ email: formData.email })
    if (existing) {
      tempStore.delete(tempToken)
      return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(formData.password, 10)

    const newUser = {
      email:      formData.email,
      password:   hashedPassword,
      phone:      formData.phone    || null,
      address:    formData.address  || null,
      mfaSecret:  tempData.secret,
      mfaEnabled: true,
      createdAt:  new Date()
    }

    switch (userType) {
      case 'owner':
        newUser.firstName = formData.firstName || null
        newUser.lastName  = formData.lastName  || null
        break
      case 'vet':
        newUser.clinicName    = formData.clinicName    || null
        newUser.licenseNumber = formData.licenseNumber || null
        newUser.description   = formData.description   || null
        break
      case 'association':
        newUser.associationName = formData.associationName || null
        newUser.description     = formData.description     || null
        break
      case 'store':
        newUser.storeName   = formData.storeName   || null
        newUser.openingTime = formData.openingTime || null
        break
    }

    const result = await db.collection(targetCollection).insertOne(newUser)
    tempStore.delete(tempToken)

    return NextResponse.json({
      success: true,
      userId: result.insertedId.toString()
    })
  }

  // ─── CAS 2 : LOGIN — userId présent ───────────────────────────────────────
  if (userId) {
    let user = null
    let targetCollection = null

    for (const col of collections) {
      const found = await db.collection(col).findOne({ _id: new ObjectId(userId) })
      if (found) { user = found; targetCollection = col; break }
    }

    if (!user?.mfaSecret) {
      return NextResponse.json({ error: 'MFA non configuré' }, { status: 400 })
    }

    const verified = speakeasy.totp.verify({
      secret:   user.mfaSecret,
      encoding: 'base32',
      token:    otpToken,
      window:   1
    })

    if (!verified) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
}