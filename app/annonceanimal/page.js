'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../styles/annonceanimal.module.css';

const AnimalForm = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    // Info sur l'animal
    animalName: '',
    animalType: '',
    race: '',
    age: '',
    gender: '',
    description: '',
    publishType: '',
    publishId:'',
    
    // Info sur le propriétaire - seront pré-remplies si l'utilisateur est connecté
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerAddress: '',
  });
  
  const [photos, setPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // État pour la gestion des étapes
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const fileInputRef = useRef(null);
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (status === 'loading') return;
    
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (status === 'unauthenticated') {
      router.push('/signuplogin?callbackUrl=/annonceanimal');
      return;
    }
    
    // Pré-remplir les données du propriétaire si l'utilisateur est connecté
    if (session && session.user) {
      setFormData(prevData => ({
        ...prevData,
        ownerName: session.user.name || '',
        ownerEmail: session.user.email || '',
      }));
    }
  }, [session, status, router]);
  
  // Mise à jour des classes des sections lors du changement d'étape
  useEffect(() => {
    const sections = document.querySelectorAll(`.${styles['form-section']}`);
    sections.forEach((section, index) => {
      section.classList.remove(styles['active']);
      if (index + 1 === currentStep) {
        section.classList.add(styles['active']);
      }
      
      // Ajouter la classe last-step à la dernière section
      if (index + 1 === totalSteps) {
        section.classList.add(styles['last-step']);
      } else {
        section.classList.remove(styles['last-step']);
      }
    });
    
    // Mettre à jour la barre de progression
    const progressBar = document.querySelector(`.${styles['progress-bar-inner']}`);
    if (progressBar) {
      progressBar.style.width = `${((currentStep - 1) / (totalSteps - 1)) * 100}%`;
    }
  }, [currentStep]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Limiter à 5 photos au total
    const availableSlots = 5 - photos.length;
    const filesToAdd = files.slice(0, availableSlots);
    
    const newPhotos = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setPhotos([...photos, ...newPhotos]);
  };
  
  const removePhoto = (index) => {
    const updatedPhotos = [...photos];
    URL.revokeObjectURL(updatedPhotos[index].preview);
    updatedPhotos.splice(index, 1);
    setPhotos(updatedPhotos);
  };
  
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const goToStep = (step) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validations
      if (!formData.animalName || !formData.animalType || !formData.ownerName || !formData.ownerEmail || !formData.ownerPhone) {
        throw new Error('Veuillez remplir tous les champs obligatoires.');
      }
      
      if (photos.length === 0) {
        throw new Error('Veuillez ajouter au moins une photo de votre animal.');
      }
      
      // Créer un FormData pour envoyer les données
      const formDataToSubmit = new FormData();
      
      // Ajouter les données textuelles
      for (const [key, value] of Object.entries(formData)) {
        formDataToSubmit.append(key, value);
      }
      
      // Ajouter les photos
      photos.forEach(photo => {
        formDataToSubmit.append('photos', photo.file);
      });
      
      console.log("Envoi de la requête...");
      
      // Envoyer les données à l'API
      const response = await fetch('/api/animals', {
        method: 'POST',
        body: formDataToSubmit,
        // Ne pas ajouter l'en-tête Content-Type car il est automatiquement défini avec FormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la publication');
      }
      
      const result = await response.json();
      console.log('Annonce publiée avec succès:', result);
      
      // Afficher le modal de succès
      setShowModal(true);
      
      // Réinitialiser le formulaire après succès
      setTimeout(() => {
        setFormData({
          animalName: '',
          animalType: '',
          race: '',
          age: '',
          gender: '',
          description: '',
          ownerName: session?.user?.name || '',
          ownerEmail: session?.user?.email || '',
          ownerPhone: '',
          ownerAddress: '',
        });
        
        // Libérer les URL objectURL pour éviter les fuites mémoire
        photos.forEach(photo => URL.revokeObjectURL(photo.preview));
        
        setPhotos([]);
        setCurrentStep(1);
        setShowModal(false);
        
        // Rediriger vers la page des annonces
        router.push('/catalogueanimal');
      }, 2000);
      
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Afficher un message de chargement pendant la vérification de session
  if (status === 'loading') {
    return <div className={styles['loading']}>Chargement...</div>;
  }
  
  // Le composant principal ne sera rendu que si l'utilisateur est connecté
  return (
    <div className={styles['animal-form-container']}>
      <h1 className={styles.heading}>Publier une annonce pour votre animal</h1>
      
      {error && (
        <div className={styles['error-message']}>
          {error}
        </div>
      )}
      
      {/* Barre de progression */}
      <div className={styles['progress-bar']}>
        <div className={styles['progress-bar-inner']}></div>
        {[...Array(totalSteps)].map((_, index) => (
          <div 
            key={index} 
            className={`${styles.step} ${currentStep === index + 1 ? styles.active : ''} ${currentStep > index + 1 ? styles.completed : ''}`}
            onClick={() => goToStep(index + 1)}
          >
            {index + 1}
            <span className={styles['step-label']}>
              {index === 0 ? 'Info Animal' : index === 1 ? 'Photos' : 'Contact'}
            </span>
          </div>
        ))}
      </div>
      
      {/* Modal de succès */}
      {showModal && (
        <div className={styles['success-modal']}>
          <div className={styles['modal-content']}>
            <div className={styles['success-icon']}>✓</div>
            <p>Votre annonce a été publiée avec succès !</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Section Informations sur l'animal */}
        <div className={`${styles['form-section']} ${currentStep === 1 ? styles.active : ''}`}>
          <h3 className={styles['section-title']}>Informations sur l'animal :</h3>
          
          <div className={styles['form-group']}>
            <input
              type="text"
              id="animalName"
              name="animalName"
              placeholder='Nom de animal'
              value={formData.animalName}
              onChange={handleChange}
              required
              className={styles['input-field']}
            />
          </div>
          
          <div className={styles['form-group']}>
            <select
              id="animalType"
              name="animalType"
              value={formData.animalType}
              onChange={handleChange}
              required
              className={styles['select-field']}
            >
              <option value="">Type d'animal</option>
              <option value="cat">Chat</option>
              <option value="dog">Chien</option>
            </select>
          </div>
          
          <div className={styles['form-group']}>
            <input
              type="text" 
              id="race"
              name="race"
              placeholder='Race'
              value={formData.race}
              onChange={handleChange}
              className={styles['input-field']}
            />
          </div>
          
          <div className={styles['form-row']}>
            <div className={`${styles['form-group']} ${styles.half}`}>
              <input
                type="text"
                id="age"
                name="age"
                placeholder='Âge'
                value={formData.age}
                onChange={handleChange}
                className={styles['input-field']}
              />
            </div>
            
            <div className={`${styles['form-group']} ${styles.half}`}>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={styles['select-field']}
              >
                <option value="">Genre</option>
                <option value="male">Mâle</option>
                <option value="female">Femelle</option>
              </select>
            </div>
          </div>
          
          <div className={styles['form-group']}>
            <textarea
              id="description"
              name="description"
              placeholder='Description'
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className={styles['textarea-field']}
            ></textarea>
          </div>
          
          <div className={styles['form-navigation']}>
            <button type="button" className={`${styles['nav-btn']} ${styles.next}`} onClick={nextStep}>Suivant</button>
          </div>
        </div>
        
        {/* Section Photos */}
        <div className={`${styles['form-section']} ${currentStep === 2 ? styles.active : ''}`}>
          <h3 className={styles['section-title']}>Photos :</h3>
          
          <div className={styles['form-group']}>
            <label>Photos (max 5)</label>
            <div className={styles['upload-container']}>
              <button
                type="button"
                className={styles['upload-btn']}
                onClick={() => fileInputRef.current.click()}
                disabled={photos.length >= 5}
              >
                Ajouter des photos ({5 - photos.length} restantes)
              </button>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            {photos.length > 0 && (
              <div className={styles['preview-container']}>
                {photos.map((photo, index) => (
                  <div key={index} className={styles['preview-item']}>
                    <img src={photo.preview} alt={`Aperçu ${index + 1}`} />
                    <button
                      type="button"
                      className={styles['remove-btn']}
                      onClick={() => removePhoto(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className={styles['form-navigation']}>
            <button type="button" className={`${styles['nav-btn']} ${styles.prev}`} onClick={prevStep}>Précédent</button>
            <button type="button" className={`${styles['nav-btn']} ${styles.next}`} onClick={nextStep}>Suivant</button>
          </div>
        </div>
        
        {/* Section Informations du propriétaire */}
        <div className={`${styles['form-section']} ${currentStep === 3 ? styles.active : ''} ${currentStep === 3 ? styles['last-step'] : ''}`}>
          <h3 className={styles['section-title']}>Informations de contact :</h3>
          
          <div className={styles['form-group']}>
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              placeholder='Nom complet'
              value={formData.ownerName}
              onChange={handleChange}
              required
              className={styles['input-field']}
            />
          </div>
          
          <div className={styles['form-row']}>
            <div className={`${styles['form-group']} ${styles.half}`}>
              <input
                type="email"
                id="ownerEmail"
                name="ownerEmail"
                placeholder='Email'
                value={formData.ownerEmail}
                onChange={handleChange}
                required
                className={styles['input-field']}
              />
            </div>
            
            <div className={`${styles['form-group']} ${styles.half}`}>
              <input
                type="tel"
                id="ownerPhone"
                name="ownerPhone"
                placeholder='Téléphone'
                value={formData.ownerPhone}
                onChange={handleChange}
                required
                className={styles['input-field']}
              />
            </div>
          </div>
          
          <div className={styles['form-group']}>
            <input
              type="text"
              id="ownerAddress"
              name="ownerAddress"
              placeholder='Adresse'
              value={formData.ownerAddress}
              onChange={handleChange}
              className={styles['input-field']}
            />
          </div>
          
          <div className={styles['form-navigation']}>
            <button type="button" className={`${styles['nav-btn']} ${styles.prev}`} onClick={prevStep}>Précédent</button>
          </div>
          
          <div className={styles['form-actions']}>
            <button 
              type="submit" 
              className={styles['submit-btn']}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Publication en cours...' : 'Publier l\'annonce'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AnimalForm;