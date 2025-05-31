'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User, Mail, Lock, Phone, MapPin, 
  Building, FileText, Store, Heart,
  ChevronLeft, ChevronRight, HeartPulse, Clock }  from 'lucide-react';
import Image from 'next/image';
import styles from '../styles/signuplogin.module.css';
import redirectStyles from '../styles/signuplogin.module.css';
import { signup } from '../services/clientauthservices';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

const Signup = () => {
  const router = useRouter();
  
  const { data: session, status } = useSession();
  
  // State management
  const [isLogin, setIsLogin] = useState(false);
  const [userType, setUserType] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Redirection si déjà connecté
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/');  
    }
  }, [status, session, router]);
  
  // Validation patterns - useMemo pour éviter la re-création
  const validationPatterns = useMemo(() => ({
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^(0)(5|6|7)[0-9]{8}$/,  
    licenseNumber: /^ONV-[0-9]{2}-[0-9]{4}$/  
  }), []);

  // Validation function - useCallback pour éviter la re-création
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
  
  // User type options - useMemo pour éviter la re-création
  const userTypes = useMemo(() => [
    { id: 'owner', label: 'Pet Owner', icon: User },
    { id: 'vet', label: 'Veterinarian', icon: HeartPulse },
    { id: 'association', label: 'Association', icon: Building },
    { id: 'store', label: 'Pet Store', icon: Store }
  ], []);

  // Form fields for each user type - useMemo pour éviter la re-création
  const formFields = useMemo(() => ({
    owner: [
      { name: 'firstName', label: 'First Name', type: 'text', icon: User },
      { name: 'lastName', label: 'Last Name', type: 'text', icon: User },
      { name: 'email', label: 'Email', type: 'email', icon: Mail },
      { name: 'password', label: 'Password', type: 'password', icon: Lock },
      { name: 'phone', label: 'Phone Number', type: 'tel', icon: Phone },
      { name: 'address', label: 'Address', type: 'text', icon: MapPin }
    ],
    vet: [
      { name: 'clinicName', label: 'Clinic Name', type: 'text', icon: Building },
      { name: 'licenseNumber', label: 'License Number', type: 'text', icon: FileText },
      { name: 'email', label: 'Email', type: 'email', icon: Mail },
      { name: 'password', label: 'Password', type: 'password', icon: Lock },
      { name: 'phone', label: 'Contact', type: 'tel', icon: Phone },
      { name: 'address', label: 'Clinic Address', type: 'text', icon: MapPin },
      { name: 'description', label: 'Description', type: 'text', icon: FileText }
    ],
    association: [
      { name: 'associationName', label: 'Association Name', type: 'text', icon: Building },
      { name: 'address', label: 'Association Address', type: 'text', icon: MapPin },
      { name: 'email', label: 'Email', type: 'email', icon: Mail },
      { name: 'password', label: 'Password', type: 'password', icon: Lock },
      { name: 'phone', label: 'Contact', type: 'tel', icon: Phone },
      { name: 'description', label: 'Description', type: 'text', icon: FileText }
    ],
    store: [
      { name: 'storeName', label: 'Store Name', type: 'text', icon: Building },
      { name: 'openingTime', label: 'Opening Time', type: 'text', icon: Clock },
      { name: 'email', label: 'Email', type: 'email', icon: Mail },
      { name: 'password', label: 'Password', type: 'password', icon: Lock },
      { name: 'phone', label: 'Contact', type: 'tel', icon: Phone },
      { name: 'address', label: 'Store Address', type: 'text', icon: MapPin }
    ]
  }), []);

  // Handle input changes with validation - useCallback
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate field if it's one of our special validation fields
    if (['email', 'phone', 'licenseNumber'].includes(name)) {
      const validationError = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: validationError
      }));
    }
  }, [validateField]);

  // Handle input blur for validation - useCallback
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    
    // Validate all fields on blur
    const validationError = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: validationError
    }));
  }, [validateField]);

  // Handle login submission - useCallback
  const handleLoginSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { email, password } = formData;
      if (!email || !password) {
        setError('Please enter your Email and Password');
        setLoading(false);
        return;
      }
      
      // Validate email
      const emailError = validateField('email', email);
      if (emailError) {
        setError(emailError);
        setLoading(false);
        return;
      }
      
      // Utiliser directement signIn de NextAuth
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });
      
      if (result.error) {
        setError('Email ou mot de passe incorrect');
      } else {
        // Redirection vers la page d'accueil
        router.push('/');
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [formData, validateField, router]);

  // Handle signup submission - useCallback
  const handleSignupSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validation des champs requis
      const requiredFields = formFields[userType];
      const missingFields = requiredFields.filter(f => !formData[f.name]);
      
      if (missingFields.length > 0) {
        setError(`Please enter : ${missingFields.map(f => f.label).join(', ')}`);
        setLoading(false);
        return;
      }
      
      // Validate email, phone, and license number if present
      if (formData.email) {
        const emailError = validateField('email', formData.email);
        if (emailError) {
          setError(emailError);
          setLoading(false);
          return;
        }
      }
      
      if (formData.phone) {
        const phoneError = validateField('phone', formData.phone);
        if (phoneError) {
          setError(phoneError);
          setLoading(false);
          return;
        }
      }
      
      if (formData.licenseNumber) {
        const licenseError = validateField('licenseNumber', formData.licenseNumber);
        if (licenseError) {
          setError(licenseError);
          setLoading(false);
          return;
        }
      }
  
      // Appel au service d'inscription
      const result = await signup(userType, formData);
      
      if (result.success) {
        // Connexion automatique après inscription réussie
        const { email, password } = formData;
        const loginResult = await signIn('credentials', {
          email,
          password,
          redirect: false
        });
        
        if (loginResult.error) {
          setError('Inscription réussie mais erreur lors de la connexion automatique');
        } else {
          // Redirection vers la page d'accueil
          router.push('/');
        }
      } else {
        setError(result.error || 'Failed to register');
      }
    } catch (err) {
      setError('Failed to register');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [formData, userType, formFields, validateField, router]);

  // Helper function to get current fields - useMemo
  const getCurrentFields = useMemo(() => {
    if (!userType) return [];
    const fields = formFields[userType];
    const startIdx = currentStep * 2;
    return fields.slice(startIdx, startIdx + 2);
  }, [userType, currentStep, formFields]);

  // Calculate max steps - useMemo
  const maxSteps = useMemo(() => {
    return userType ? Math.ceil(formFields[userType].length / 2) : 0;
  }, [userType, formFields]);

  // Component for user type selection - useMemo pour éviter re-render
  const UserTypeSelection = useMemo(() => (
    <div className={styles.userTypeGrid}>
      {userTypes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setUserType(id)}    
          className={styles.userTypeButton}
          type="button"
        >
          <Icon className={styles.userTypeIcon} />
          {label}
        </button>
      ))}
    </div>
  ), [userTypes]);

  // Component for login form - useMemo pour éviter re-render
  const LoginForm = useMemo(() => (
    <form className={styles.loginForm} onSubmit={handleLoginSubmit}>
      <div className={styles.formField}>
        <div className={styles.inputWithIcon}>
          <Mail className={styles.fieldIcon} />
          <input 
            type="email" 
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`${styles.fieldInput} ${errors.email ? styles.errorInput : ''}`} 
            placeholder="Your Email" 
          />
        </div>
        {errors.email && <div className={styles.fieldError}>{errors.email}</div>}
      </div>

      <div className={styles.formField}>
        <div className={styles.inputWithIcon}>
          <Lock className={styles.fieldIcon} />
          <input 
            type="password" 
            name="password"
            value={formData.password || ''}
            onChange={handleInputChange}
            className={styles.fieldInput} 
            placeholder="Your Password" 
          />
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <button 
        type="submit" 
        className={styles.submitButton}
        disabled={loading}
      >
        {loading ? 'Current Connection...' : 'Sign in'}
      </button>
    </form>
  ), [formData, errors, error, loading, handleInputChange, handleBlur, handleLoginSubmit, styles]);

  // Component for signup form - useMemo pour éviter re-render
  const SignupForm = useMemo(() => (
    <form className={styles.signupForm} onSubmit={currentStep === maxSteps - 1 ? handleSignupSubmit : undefined}>
      <div>
        {getCurrentFields.map((field) => (
          <div key={field.name} className={styles.formField}>
            <div className={styles.inputWithIcon}>
              <field.icon className={styles.fieldIcon} />
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${styles.fieldInput} ${errors[field.name] ? styles.errorInput : ''}`}
                placeholder={field.label}
              />
            </div>
            {errors[field.name] && <div className={styles.fieldError}>{errors[field.name]}</div>}
          </div>
        ))}
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formNavigation}>
        <button
          type="button"
          onClick={() => {
            if (currentStep === 0) setUserType('');
            else setCurrentStep(currentStep - 1);
          }}
          className={styles.navButton}
          disabled={loading}
        >
          <ChevronLeft className={styles.buttonIcon} />
          Retour
        </button>

        <button
          type={currentStep === maxSteps - 1 ? 'submit' : 'button'}
          onClick={() => {
            if (currentStep < maxSteps - 1) setCurrentStep(currentStep + 1);
          }}
          className={styles.navButton}
          disabled={loading}
        >
          {loading 
            ? 'Processing...' 
            : currentStep === maxSteps - 1 
              ? 'Creat your Account' 
              : 'Next'
          }
          {currentStep < maxSteps - 1 && <ChevronRight className={styles.buttonIcon} />}
        </button>
      </div>
    </form>
  ), [getCurrentFields, formData, errors, error, loading, currentStep, maxSteps, handleInputChange, handleBlur, handleSignupSubmit, styles]);

  // Si déjà connecté, afficher un message de redirection
  if (status === 'authenticated') {
    return (
      <div className={styles.authContainer}>
        <div className={redirectStyles.redirectMessage}>
          You are logged in. Redirecting to the home page...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        <div className={styles.authCard}>
          <div className={styles.authImage}>
            <Image
              src='/images/image11.jpg'
              alt="Animaux"
              fill
              className={styles.imageCover}
            />
          </div>
          
          <div className={styles.authForm}>
            {/* Header */}
            <div className={styles.formHeader}>
              <Image
                src="/images/logo1.png"
                alt="Logo"
                width={100}
                height={50}
                className={styles.appLogo}
              />
              <h2 className={styles.formTitle}>
                {isLogin ? 'Welcome back' : 'Creat your Account '}
              </h2>
              <p className={styles.formSubtitle}>
                {isLogin ? 'Sign in to access your account' : 'Join to our community today'}
              </p>
            </div>

            {/* Form Content */}
            {!isLogin && !userType && UserTypeSelection}
            {!isLogin && userType && SignupForm}
            {isLogin && LoginForm}

            {/* Footer */}
            <div className={styles.formFooter}>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setUserType('');
                  setCurrentStep(0);
                  setFormData({});
                  setError('');
                  setErrors({});
                }}
                className={styles.switchModeButton}
                type="button"
              >
                {isLogin ? "Don't have an account ? Sign up" : "already have an account ? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;