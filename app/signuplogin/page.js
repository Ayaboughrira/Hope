'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User, Mail, Lock, Phone, MapPin, 
  Building, FileText, Store,
  ChevronLeft, ChevronRight, HeartPulse, Clock
} from 'lucide-react';
import Image from 'next/image';
import styles from '../styles/signuplogin.module.css';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

const Signup = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isLogin, setIsLogin]         = useState(false);
  const [userType, setUserType]       = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData]       = useState({});
  const [errors, setErrors]           = useState({});
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Redirection uniquement si déjà connecté avec MFA activé ET vérifié
  useEffect(() => {
    if (status === 'loading') return;
    if (redirecting) return;
    if (status === 'authenticated' && session?.user?.mfaEnabled) {
      // Vérifier si MFA déjà vérifié dans cette session
      const mfaVerified = sessionStorage.getItem('mfa_verified')
      if (mfaVerified === 'true') {
        router.push('/');
      }
    }
  }, [status, session, redirecting, router]);

  const validationPatterns = useMemo(() => ({
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^(0)(5|6|7)[0-9]{8}$/,
    licenseNumber: /^ONV-[0-9]{2}-[0-9]{4}$/
  }), []);

  const validateField = useCallback((name, value) => {
    if (!value) return "This field is required";
    switch (name) {
      case 'email':
        return validationPatterns.email.test(value) ? "" : "Please enter a valid email address";
      case 'phone':
        return validationPatterns.phone.test(value) ? "" : "Please enter a valid Algerian phone number (e.g., 0561234567)";
      case 'licenseNumber':
        return validationPatterns.licenseNumber.test(value) ? "" : "Please enter a valid license number (format: ONV-xx-yyyy)";
      default:
        return "";
    }
  }, [validationPatterns]);

  const userTypes = useMemo(() => [
    { id: 'owner',       label: 'Pet Owner',    icon: User       },
    { id: 'vet',         label: 'Veterinarian', icon: HeartPulse },
    { id: 'association', label: 'Association',  icon: Building   },
    { id: 'store',       label: 'Pet Store',    icon: Store      }
  ], []);

  const formFields = useMemo(() => ({
    owner: [
      { name: 'firstName', label: 'First Name',   type: 'text',     icon: User     },
      { name: 'lastName',  label: 'Last Name',    type: 'text',     icon: User     },
      { name: 'email',     label: 'Email',        type: 'email',    icon: Mail     },
      { name: 'password',  label: 'Password',     type: 'password', icon: Lock     },
      { name: 'phone',     label: 'Phone Number', type: 'tel',      icon: Phone    },
      { name: 'address',   label: 'Address',      type: 'text',     icon: MapPin   }
    ],
    vet: [
      { name: 'clinicName',    label: 'Clinic Name',    type: 'text',     icon: Building },
      { name: 'licenseNumber', label: 'License Number', type: 'text',     icon: FileText },
      { name: 'email',         label: 'Email',          type: 'email',    icon: Mail     },
      { name: 'password',      label: 'Password',       type: 'password', icon: Lock     },
      { name: 'phone',         label: 'Contact',        type: 'tel',      icon: Phone    },
      { name: 'address',       label: 'Clinic Address', type: 'text',     icon: MapPin   },
      { name: 'description',   label: 'Description',    type: 'text',     icon: FileText }
    ],
    association: [
      { name: 'associationName', label: 'Association Name',    type: 'text',     icon: Building },
      { name: 'address',         label: 'Association Address', type: 'text',     icon: MapPin   },
      { name: 'email',           label: 'Email',               type: 'email',    icon: Mail     },
      { name: 'password',        label: 'Password',            type: 'password', icon: Lock     },
      { name: 'phone',           label: 'Contact',             type: 'tel',      icon: Phone    },
      { name: 'description',     label: 'Description',         type: 'text',     icon: FileText }
    ],
    store: [
      { name: 'storeName',   label: 'Store Name',   type: 'text',     icon: Building },
      { name: 'openingTime', label: 'Opening Time', type: 'text',     icon: Clock    },
      { name: 'email',       label: 'Email',        type: 'email',    icon: Mail     },
      { name: 'password',    label: 'Password',     type: 'password', icon: Lock     },
      { name: 'phone',       label: 'Contact',      type: 'tel',      icon: Phone    },
      { name: 'address',     label: 'Store Address',type: 'text',     icon: MapPin   }
    ]
  }), []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (['email', 'phone', 'licenseNumber'].includes(name)) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  }, [validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  }, [validateField]);

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  const handleLoginSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      const { email, password } = formData;
      if (!email || !password) { setError('Please enter your Email and Password'); return; }

      const emailError = validateField('email', email);
      if (emailError) { setError(emailError); return; }

      // ✅ Vérifier d'abord les credentials via l'API login SANS créer la session
      const checkRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const checkData = await checkRes.json()

      if (!checkData.success) {
        setError('Email ou mot de passe incorrect');
        return;
      }

      // ✅ Stocker les credentials temporairement pour après MFA
      sessionStorage.setItem('login_pending', JSON.stringify({
        email,
        password,
        userType: checkData.user.userType,
        userId:   checkData.user.id
      }))

      // ✅ Rediriger vers vérification MFA SANS créer la session
      setRedirecting(true);
      router.push('/mfa-verify');

    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  }, [formData, validateField, router]);

  // ─── SIGNUP : stocke dans sessionStorage → /mfa-setup ────────────────────
  const handleSignupSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      const requiredFields = formFields[userType];
      const missingFields = requiredFields.filter(f => !formData[f.name]);
      if (missingFields.length > 0) {
        setError(`Please enter : ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }

      if (formData.email) {
        const emailError = validateField('email', formData.email);
        if (emailError) { setError(emailError); return; }
      }
      if (formData.phone) {
        const phoneError = validateField('phone', formData.phone);
        if (phoneError) { setError(phoneError); return; }
      }
      if (formData.licenseNumber) {
        const licenseError = validateField('licenseNumber', formData.licenseNumber);
        if (licenseError) { setError(licenseError); return; }
      }

      // Stocker les données du formulaire (PAS en DB)
      sessionStorage.setItem('mfa_pending', JSON.stringify({ formData, userType }))

      setRedirecting(true);
      router.push('/mfa-setup');

    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [formData, userType, formFields, validateField, router]);

  const getCurrentFields = useMemo(() => {
    if (!userType) return [];
    return formFields[userType].slice(currentStep * 2, currentStep * 2 + 2);
  }, [userType, currentStep, formFields]);

  const maxSteps = useMemo(() => {
    return userType ? Math.ceil(formFields[userType].length / 2) : 0;
  }, [userType, formFields]);

  const UserTypeSelection = useMemo(() => (
    <div className={styles.userTypeGrid}>
      {userTypes.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => setUserType(id)} className={styles.userTypeButton} type="button">
          <Icon className={styles.userTypeIcon} />
          {label}
        </button>
      ))}
    </div>
  ), [userTypes]);

  const LoginForm = useMemo(() => (
    <form className={styles.loginForm} onSubmit={handleLoginSubmit}>
      <div className={styles.formField}>
        <div className={styles.inputWithIcon}>
          <Mail className={styles.fieldIcon} />
          <input type="email" name="email" value={formData.email || ''}
            onChange={handleInputChange} onBlur={handleBlur}
            className={`${styles.fieldInput} ${errors.email ? styles.errorInput : ''}`}
            placeholder="Your Email" />
        </div>
        {errors.email && <div className={styles.fieldError}>{errors.email}</div>}
      </div>
      <div className={styles.formField}>
        <div className={styles.inputWithIcon}>
          <Lock className={styles.fieldIcon} />
          <input type="password" name="password" value={formData.password || ''}
            onChange={handleInputChange} className={styles.fieldInput} placeholder="Your Password" />
        </div>
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? 'Vérification...' : 'Sign in'}
      </button>
    </form>
  ), [formData, errors, error, loading, handleInputChange, handleBlur, handleLoginSubmit]);

  const SignupForm = useMemo(() => (
    <form className={styles.signupForm} onSubmit={currentStep === maxSteps - 1 ? handleSignupSubmit : undefined}>
      <div>
        {getCurrentFields.map((field) => (
          <div key={field.name} className={styles.formField}>
            <div className={styles.inputWithIcon}>
              <field.icon className={styles.fieldIcon} />
              <input type={field.type} name={field.name} value={formData[field.name] || ''}
                onChange={handleInputChange} onBlur={handleBlur}
                className={`${styles.fieldInput} ${errors[field.name] ? styles.errorInput : ''}`}
                placeholder={field.label} />
            </div>
            {errors[field.name] && <div className={styles.fieldError}>{errors[field.name]}</div>}
          </div>
        ))}
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <div className={styles.formNavigation}>
        <button type="button"
          onClick={() => { if (currentStep === 0) setUserType(''); else setCurrentStep(currentStep - 1); }}
          className={styles.navButton} disabled={loading}>
          <ChevronLeft className={styles.buttonIcon} /> Retour
        </button>
        <button
          type={currentStep === maxSteps - 1 ? 'submit' : 'button'}
          onClick={() => { if (currentStep < maxSteps - 1) setCurrentStep(currentStep + 1); }}
          className={styles.navButton} disabled={loading}>
          {loading ? 'Processing...' : currentStep === maxSteps - 1 ? 'Suivant → Scanner QR' : 'Next'}
          {currentStep < maxSteps - 1 && <ChevronRight className={styles.buttonIcon} />}
        </button>
      </div>
    </form>
  ), [getCurrentFields, formData, errors, error, loading, currentStep, maxSteps, handleInputChange, handleBlur, handleSignupSubmit]);

  if (status === 'loading') return null;

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        <div className={styles.authCard}>
          <div className={styles.authImage}>
            <Image src='/images/image11.jpg' alt="Animaux" fill className={styles.imageCover} />
          </div>
          <div className={styles.authForm}>
            <div className={styles.formHeader}>
              <Image src="/images/logo1.png" alt="Logo" width={100} height={50} className={styles.appLogo} />
              <h2 className={styles.formTitle}>
                {isLogin ? 'Welcome back' : 'Create your Account'}
              </h2>
              <p className={styles.formSubtitle}>
                {isLogin ? 'Sign in to access your account' : 'Join our community today'}
              </p>
            </div>

            {!isLogin && !userType && UserTypeSelection}
            {!isLogin && userType && SignupForm}
            {isLogin && LoginForm}

            <div className={styles.formFooter}>
              <button
                onClick={() => {
                  setIsLogin(!isLogin); setUserType(''); setCurrentStep(0);
                  setFormData({}); setError(''); setErrors({});
                }}
                className={styles.switchModeButton} type="button">
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;