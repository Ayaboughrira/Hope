'use client'

import React, { useState } from 'react';
import { 
  User, Mail, Lock, Phone, MapPin, 
  Building, FileText, Store, Heart,
  ChevronLeft, ChevronRight, HeartPulse, Clock }  from 'lucide-react';
import Image from 'next/image';
import styles from '../styles/signuplogin.module.css';
import { signup, login } from '../services/clientauthservices';
import { useRouter } from 'next/navigation';

const Signup = () => {
  const router = useRouter();
  
  // State management
  const [isLogin, setIsLogin] = useState(false);
  const [userType, setUserType] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // User type options
  const userTypes = [
    { id: 'owner', label: 'Pet Owner', icon: User },
    { id: 'vet', label: 'Veterinarian', icon: HeartPulse },
    { id: 'association', label: 'Association', icon: Building },
    { id: 'store', label: 'Pet Store', icon: Store }
  ];

  // Form fields for each user type
  const formFields = {
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
      { name: 'phone', label: 'Phone Number', type: 'tel', icon: Phone },
      { name: 'address', label: 'Clinic Address', type: 'text', icon: MapPin },
      {name:'description' , label:'Description' , type :'text', icon: FileText }
    ],
    association: [
      { name: 'associationName', label: 'Association Name', type: 'text', icon: Building },
      { name: 'address', label: 'Association Address', type: 'text', icon: MapPin },
      { name: 'email', label: 'Email', type: 'email', icon: Mail },
      { name: 'password', label: 'Password', type: 'password', icon: Lock },
      { name: 'phone', label: 'Contact', type: 'tel', icon: Phone },
      {name:'description' , label:'Description' , type :'text', icon: FileText }
    ],
    store: [
      { name: 'storeName', label: 'Store Name', type: 'text', icon: Building },
      { name: 'openingtime', label: 'Opening time', type: 'time', icon: Clock },
      { name: 'email', label: 'Email', type: 'email', icon: Mail },
      { name: 'password', label: 'Password', type: 'password', icon: Lock },
      { name: 'phone', label: 'Contact', type: 'tel', icon: Phone },
      { name: 'address', label: 'Store Address', type: 'text', icon: MapPin }
    ]
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { email, password } = formData;
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }
      
      const result = await login(email, password);
      if (result.success) {
        // Redirect to dashboard or home page
        router.push('/');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle signup submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Vérification des champs requis
      const requiredFields = formFields[userType];
      const missingFields = requiredFields.filter(f => !formData[f.name]);
      
      if (missingFields.length > 0) {
        setError(`Please fill: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }
  
      // Appel au service
      const result = await signup(userType, formData);
      
      if (result.success) {
        router.push(`/${userType}-dashboard`); //hna lzm profile de usertype 
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Registration failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get current fields
  const getCurrentFields = () => {
    if (!userType) return [];
    const fields = formFields[userType];
    const startIdx = currentStep * 2;
    return fields.slice(startIdx, startIdx + 2);
  };

  // Calculate max steps
  const maxSteps = userType ? Math.ceil(formFields[userType].length / 2) : 0;

  // Component for user type selection
  const UserTypeSelection = () => (
    <div className={styles.userTypeGrid}>
      {userTypes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setUserType(id)}    
          className={styles.userTypeButton}
        >
          <Icon className={styles.userTypeIcon} />
          {label}
        </button>
      ))}
    </div>
  );

  // Component for login form
  const LoginForm = () => (
    <form className={styles.loginForm} onSubmit={handleLoginSubmit}>
      <div className={styles.formField}>
        <div className={styles.inputWithIcon}>
          <Mail className={styles.fieldIcon} />
          <input 
            type="email" 
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            className={styles.fieldInput} 
            placeholder="Email address" 
          />
        </div>
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
            placeholder="Your password" 
          />
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <button 
        type="submit" 
        className={styles.submitButton}
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );

  // Component for signup form
  const SignupForm = () => (
    <form className={styles.signupForm} onSubmit={currentStep === maxSteps - 1 ? handleSignupSubmit : null}>
      <div>
        {getCurrentFields().map((field) => (
          <div key={field.name} className={styles.formField}>
            <div className={styles.inputWithIcon}>
              <field.icon className={styles.fieldIcon} />
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                className={styles.fieldInput}
                placeholder={field.label}
              />
            </div>
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
          Back
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
              ? 'Create Account' 
              : 'Next'
          }
          {currentStep < maxSteps - 1 && <ChevronRight className={styles.buttonIcon} />}
        </button>
      </div>
    </form>
  );

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        <div className={styles.authCard}>
          <div className={styles.authImage}>
            <Image
              src='/images/image11.jpg'
              alt="Pets"
              fill
              className={styles.imageCover}
            />
          </div>
          
          <div className={styles.authForm}>
            {/* Header */}
            <div className={styles.formHeader}>
              <Image
                src="/api/placeholder/100/50"
                alt="Logo"
                width={100}
                height={50}
                className={styles.appLogo}
              />
              <h2 className={styles.formTitle}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className={styles.formSubtitle}>
                {isLogin ? 'Sign in to access your account' : 'Join our pet community today'}
              </p>
            </div>

            {/* Form Content */}
            {!isLogin && !userType && <UserTypeSelection />}
            {!isLogin && userType && <SignupForm />}
            {isLogin && <LoginForm />}

            {/* Footer */}
            <div className={styles.formFooter}>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setUserType('');
                  setCurrentStep(0);
                  setFormData({});
                  setError('');
                }}
                className={styles.switchModeButton}
                type="button"
              >
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