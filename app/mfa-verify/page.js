'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import styles from '../styles/mfa.module.css'

export default function MfaVerifyPage() {
  const router  = useRouter()
  const [code, setCode]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [loginData, setLoginData] = useState(null)

  useEffect(() => {
    // Récupérer les credentials stockés avant MFA
    const stored = sessionStorage.getItem('login_pending')
    if (!stored) {
      router.push('/signuplogin')
      return
    }
    setLoginData(JSON.parse(stored))
  }, [router])

  const handleVerify = async () => {
    if (code.length !== 6) return setError('Code à 6 chiffres requis')
    if (!loginData) return setError('Session expirée, reconnectez-vous')
    setLoading(true)
    setError('')

    // ✅ Vérifier le code MFA avec userId stocké
    const res = await fetch('/api/auth/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token:  code,
        userId: loginData.userId
      })
    })
    const data = await res.json()

    if (data.success) {
      // ✅ Code correct → créer la session maintenant
      const loginResult = await signIn('credentials', {
        email:    loginData.email,
        password: loginData.password,
        redirect: false
      })

      if (loginResult?.error) {
        setError('Erreur de connexion, réessayez')
        setLoading(false)
        return
      }

      // Nettoyer le sessionStorage
      sessionStorage.removeItem('login_pending')
      sessionStorage.setItem('mfa_verified', 'true')

      // Rediriger vers le dashboard
      const userType = loginData.userType
      const userId   = loginData.userId
      router.push(`/profile/${userType}/${userId}`)

    } else {
      // ❌ Code faux → pas de session créée
      setError(data.error || 'Code invalide, réessayez')
      setLoading(false)
    }
  }

  return (
    <div className={styles.mfaContainer}>
      <div className={styles.mfaCard}>
        <div className={styles.shieldIcon}>🔑</div>
        <h1 className={styles.title}>Vérification en deux étapes</h1>
        <p className={styles.subtitle}>
          Ouvre Google Authenticator et saisis le code affiché
        </p>

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
          disabled={loading || code.length !== 6}
          className={styles.verifyBtn}
        >
          {loading ? 'Vérification...' : 'Confirmer et accéder'}
        </button>

        <p className={styles.securityNote}>
          🔒 Ce code change toutes les 30 secondes
        </p>
      </div>
    </div>
  )
}