'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import styles from '../styles/mfa.module.css'

export default function MfaSetupPage() {
  const router = useRouter()
  const [qrCode, setQrCode]           = useState(null)
  const [tempToken, setTempToken]     = useState(null)
  const [qrLoading, setQrLoading]     = useState(true)
  const [code, setCode]               = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [credentials, setCredentials] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('mfa_pending')
    if (!stored) {
      router.push('/signuplogin')
      return
    }

    const { formData, userType } = JSON.parse(stored)
    setCredentials({ email: formData.email, password: formData.password })

    fetch('/api/auth/mfa/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData, userType })
    })
      .then(r => r.json())
      .then(data => {
        if (data.qrCode && data.tempToken) {
          setQrCode(data.qrCode)
          setTempToken(data.tempToken)
        } else {
          setError('Erreur lors de la génération du QR code')
        }
        setQrLoading(false)
      })
      .catch(() => {
        setError('Erreur serveur')
        setQrLoading(false)
      })
  }, [router])

  const handleVerify = async () => {
    if (code.length !== 6) return setError('Code à 6 chiffres requis')
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: code, tempToken })
    })
    const data = await res.json()

    if (data.success) {
      // ✅ Compte créé → connexion automatique
      sessionStorage.removeItem('mfa_pending')

      const loginResult = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false
      })

      if (loginResult?.error) {
        setError('Compte créé ! Connectez-vous sur la page de connexion.')
        setLoading(false)
        return
      }

      // Récupérer la session → userType + id → redirection dashboard
      const { getSession } = await import('next-auth/react')
      const session = await getSession()

      const userType = session?.user?.userType
      const userId   = session?.user?.id

      if (userType && userId) {
        // ✅ URL compatible avec app/api/users/[userType]/[id]/route.js
        router.push(`/profile/${userType}/${userId}`)
      } else {
        router.push('/')
      }

    } else {
      // ❌ Code faux → compte NON créé
      setError(data.error || 'Code incorrect, réessayez')
      setLoading(false)
    }
  }

  return (
    <div className={styles.mfaContainer}>
      <div className={styles.mfaCard}>
        <div className={styles.shieldIcon}>🔐</div>
        <h1 className={styles.title}>Secured your account</h1>
        <p className={styles.subtitle}>
          Just wait your account will be created after the code has been validated
        </p>

        <div className={styles.steps}>
          <div className={styles.step}>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <span>Scan the QR code below </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <span>Enter the code → your account has been created </span>
          </div>
        </div>

        <div className={styles.qrWrapper}>
          {qrLoading ? (
            <div className={styles.qrLoader}>
              <div className={styles.spinner}></div>
              <p>Generation of QR code...</p>
            </div>
          ) : qrCode ? (
            <img src={qrCode} alt="QR Code Google Authenticator" className={styles.qrImage} />
          ) : (
            <p className={styles.qrError}>Impossible de charger le QR code</p>
          )}
        </div>

        <div className={styles.codeSection}>
          <label className={styles.codeLabel}>Code Google Authenticator</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="• • • • • •"
            maxLength={6}
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
            className={styles.codeInput}
          />
        </div>

        {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6 || qrLoading}
          className={styles.verifyBtn}
        >
          {loading ? 'Account creation...' : 'Check and crated my account'}
        </button>

        
      </div>
    </div>
  )
}