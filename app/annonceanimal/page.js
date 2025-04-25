'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/annonceanimal.module.css';

const AnimalForm = () => {
  const [formData, setFormData] = useState({
    // Info sur l'animal
    animalName: '',
    animalType: '',
    race: '',
    age: '',
    gender: '',
    description: '',
    
    // Info sur le propriétaire
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerAddress: '',
  });
  
  const [photos, setPhotos] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // État pour la gestion des étapes
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  
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
  
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };
  
  const removePhoto = (index) => {
    const updatedPhotos = [...photos];
    URL.revokeObjectURL(updatedPhotos[index].preview);
    updatedPhotos.splice(index, 1);
    setPhotos(updatedPhotos);
  };
  
  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview('');
    if (videoInputRef.current) videoInputRef.current.value = '';
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
  
  // Modification simplifiée de handleSubmit dans AnimalForm.jsx

 // Ajoutez cette fonction au début de votre composant AnimalForm:

// Dans la fonction handleSubmit, modifiez pour ajouter la gestion des erreurs et le feedback utilisateur:
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    // Validations
    if (!formData.animalName || !formData.animalType || !formData.ownerName || !formData.ownerEmail || !formData.ownerPhone) {
      throw new Error('Veuillez remplir tous les champs obligatoires');
    }
    
    if (photos.length === 0) {
      throw new Error('Veuillez ajouter au moins une photo de votre animal');
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
    
    // Ajouter la vidéo si présente
    if (videoFile) {
      formDataToSubmit.append('video', videoFile);
    }
    
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
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        ownerAddress: '',
      });
      
      // Libérer les URL objectURL pour éviter les fuites mémoire
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      
      setPhotos([]);
      setVideoFile(null);
      setVideoPreview('');
      setCurrentStep(1);
      setShowModal(false);
    }, 3000);
    
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la publication: ' + error.message);
  } finally {
    setIsSubmitting(false);
  }
};
  
  return (
    <div className={styles['animal-form-container']}>
      <h1 className={styles.heading}>Post an ad for your pet</h1>
      
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
              {index === 0 ? 'Animal Info' : index === 1 ? 'Media' : 'Contact'}
            </span>
          </div>
        ))}
      </div>
      
      {/* Modal de succès */}
      {showModal && (
        <div className={styles['success-modal']}>
          <div className={styles['modal-content']}>
            <div className={styles['success-icon']}>✓</div>
            <p>Votre annonce a été publiée avec succès!</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        
        
        {/* Section Informations sur l'animal */}
        <div className={`${styles['form-section']} ${currentStep === 1 ? styles.active : ''}`}>
          <h3 className={styles['section-title']}>Animal Information:</h3>
          
          <div className={styles['form-group']}>
            <input
              type="text"
              id="animalName"
              name="animalName"
              placeholder='Animal Name'
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
              <option value="">Select Type</option>
              <option value="cat">Cat</option>
              <option value="dog">Dog</option>
            </select>
          </div>
          
          <div className={styles['form-group']}>
            <input
              type="text" 
              id="race"
              name="race"
              placeholder='Breed'
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
                placeholder='Age'
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
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
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
            <button type="button" className={`${styles['nav-btn']} ${styles.next}`} onClick={nextStep}>Next</button>
          </div>
        </div>
        
        {/* Section Photos et Vidéos */}
        <div className={`${styles['form-section']} ${currentStep === 2 ? styles.active : ''}`}>
          <h3 className={styles['section-title']}>Photos and Videos:</h3>
          
          <div className={styles['form-group']}>
            <label>Photos (max 5)</label>
            <div className={styles['upload-container']}>
              <button
                type="button"
                className={styles['upload-btn']}
                onClick={() => fileInputRef.current.click()}
                disabled={photos.length >= 5}
              >
                Upload Photos ({5 - photos.length} remaining)
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
                    <img src={photo.preview} alt={`Preview ${index + 1}`} />
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
          
          <div className={styles['form-group']}>
            <label>Video (optional)</label>
            <div className={styles['upload-container']}>
              <button
                type="button"
                className={styles['upload-btn']}
                onClick={() => videoInputRef.current.click()}
                disabled={videoFile !== null}
              >
                Upload Video
              </button>
              <input
                type="file"
                accept="video/*"
                ref={videoInputRef}
                onChange={handleVideoUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            {videoPreview && (
              <div className={styles['video-preview']}>
                <video controls src={videoPreview} />
                <button
                  type="button"
                  className={styles['remove-btn']}
                  onClick={removeVideo}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          
          <div className={styles['form-navigation']}>
            <button type="button" className={`${styles['nav-btn']} ${styles.prev}`} onClick={prevStep}>Previous</button>
            <button type="button" className={`${styles['nav-btn']} ${styles.next}`} onClick={nextStep}>Next</button>
          </div>
        </div>
        
        {/* Section Informations du propriétaire */}
        <div className={`${styles['form-section']} ${currentStep === 3 ? styles.active : ''} ${currentStep === 3 ? styles['last-step'] : ''}`}>
          <h3 className={styles['section-title']}>Owner Information:</h3>
          
          <div className={styles['form-group']}>
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              placeholder='Full Name'
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
                placeholder='Your Email'
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
                placeholder='Phone'
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
              placeholder='Address'
              value={formData.ownerAddress}
              onChange={handleChange}
              className={styles['input-field']}
            />
          </div>
          
          <div className={styles['form-navigation']}>
            <button type="button" className={`${styles['nav-btn']} ${styles.prev}`} onClick={prevStep}>Previous</button>
          </div>
          
          <div className={styles['form-actions']}>
            <button 
              type="submit" 
              className={styles['submit-btn']}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Publication en cours...' : 'Post Your Ad'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AnimalForm;