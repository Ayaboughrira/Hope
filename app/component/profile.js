'use client'

import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Building, FileText, Store, Clock } from 'lucide-react';
import { getUserData } from '../services/userservices';
import { useParams } from 'next/navigation';
import styles from '../styles/profile.module.css';

const Profile = () => {
  const params = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Récupérer le type et l'ID utilisateur depuis les paramètres d'URL
  const { userType, id } = params;
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userType || !id) {
          setError('Paramètres utilisateur invalides');
          setLoading(false);
          return;
        }
        
        const data = await getUserData(userType, id);
        if (data.success) {
          setUserData(data.user);
        } else {
          setError(data.message || 'Échec du chargement des données utilisateur');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des données utilisateur:', err);
        setError('Une erreur inattendue s\'est produite');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userType, id]);

  // Rendre différentes informations de profil en fonction du type d'utilisateur
  const renderProfileInfo = () => {
    if (!userData) return null;

    const profileFields = {
      owner: [
        { label: 'Name', value: `${userData.firstName} ${userData.lastName}`, icon: User },
        { label: 'Email', value: userData.email, icon: Mail },
        { label: 'Phone Number', value: userData.phone, icon: Phone },
        { label: 'Address', value: userData.address, icon: MapPin }
      ],
      vet: [
        { label: 'Clinic Name', value: userData.clinicName, icon: Building },
        { label: 'License Number', value: userData.licenseNumber, icon: FileText },
        { label: 'Email', value: userData.email, icon: Mail },
        { label: 'Phone Number', value: userData.phone, icon: Phone },
        { label: 'Address', value: userData.address, icon: MapPin },
        { label: 'Description', value: userData.description, icon: FileText }
      ],
      association: [
        { label: 'Association Name', value: userData.associationName, icon: Building },
        { label: 'Email', value: userData.email, icon: Mail },
        { label: 'Contact', value: userData.phone, icon: Phone },
        { label: 'Association Address', value: userData.address, icon: MapPin },
        { label: 'Description', value: userData.description, icon: FileText }
      ],
      store: [
        { label: 'Store Name', value: userData.storeName, icon: Building },
        { label: 'Opening time', value: userData.openingtime, icon: Clock },
        { label: 'Email', value: userData.email, icon: Mail },
        { label: 'Contact', value: userData.phone, icon: Phone },
        { label: 'Store Address', value: userData.address, icon: MapPin }
      ]
    };

    const fields = profileFields[userType] || [];

    return (
      <div className={styles.profileInfo}>
        <h2 className={styles.profileType}>
          {userType === 'owner' && ' Owner Profil'}
          {userType === 'vet' && 'Veterinarian Profil '}
          {userType === 'association' && 'Association Profil'}
          {userType === 'store' && 'Pet Store Profil'}
        </h2>
        
        {fields.map((field, index) => (
          <div key={index} className={styles.infoField}>
            <field.icon className={styles.fieldIcon} />
            <div className={styles.fieldContent}>
              <span className={styles.fieldLabel}>{field.label}:</span>
              <span className={styles.fieldValue}>{field.value}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading profil data...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            {userType === 'owner' && userData?.firstName?.charAt(0).toUpperCase()}
            {userType === 'vet' && <FileText />}
            {userType === 'association' && <Building />}
            {userType === 'store' && <Store />}
          </div>
        </div>
        
        {renderProfileInfo()}
      </div>
    </div>
  );
};

export default Profile;