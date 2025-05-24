'use client'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../styles/compagneform.module.css';

export default function PostCampaignForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '',
    location: '',
    description: '',
    objective: '',
    email: '',
    phone: '',
    images: []
  });
  
  const [previewUrls, setPreviewUrls] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Vérifier l'authentification et le type d'utilisateur
  useEffect(() => {
    if (status === 'loading') return; // Encore en cours de chargement
    
    if (!session) {
      router.push('/signuplogin');
      return;
    }

    if (session.user.userType !== 'association') {
      router.push('/');
      return;
    }

    // Pré-remplir l'email avec celui de l'association
    setFormData(prev => ({
      ...prev,
      email: session.user.email || ''
    }));
  }, [session, status, router]);

  // Gestion des changements de champs de saisie
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ lorsque l'utilisateur tape
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Gestion du téléchargement d'images
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Limiter à 3 images
    if (formData.images.length + files.length > 3) {
      alert('Vous pouvez télécharger un maximum de 3 images.');
      return;
    }

    // Vérifier la taille des fichiers (max 5MB par image)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`L'image ${file.name} est trop grande. Taille maximum: 5MB`);
        return false;
      }
      return true;
    });

    const newImages = [...formData.images, ...validFiles];
    const newPreviewUrls = [];
    
    // Créer les URLs d'aperçu pour chaque image
    newImages.forEach(file => {
      if (file instanceof File) {
        const url = URL.createObjectURL(file);
        newPreviewUrls.push(url);
      }
    });

    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    setPreviewUrls(newPreviewUrls);
  };

  // Supprimer une image
  const removeImage = (indexToRemove) => {
    const updatedImages = formData.images.filter((_, index) => index !== indexToRemove);
    
    // Révoquer les URL d'aperçu pour éviter les fuites de mémoire
    URL.revokeObjectURL(previewUrls[indexToRemove]);
    
    const updatedPreviewUrls = previewUrls.filter((_, index) => index !== indexToRemove);

    setFormData(prev => ({
      ...prev,
      images: updatedImages
    }));
    setPreviewUrls(updatedPreviewUrls);
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
    if (!formData.startDate) newErrors.startDate = 'La date de début est requise';
    if (!formData.endDate) newErrors.endDate = 'La date de fin est requise';
    if (!formData.startTime) newErrors.startTime = "L'heure de début est requise";
    if (!formData.location) newErrors.location = 'La localisation est requise';
    if (!formData.description.trim()) newErrors.description = 'La description est requise';
    if (!formData.objective.trim()) newErrors.objective = "L'objectif est requis";
    
    // Validation de l'email
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'email est invalide";
    }

    // Validation des dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      newErrors.startDate = 'La date de début ne peut pas être dans le passé';
    }

    if (endDate < startDate) {
      newErrors.endDate = 'La date de fin ne peut pas être avant la date de début';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Créer un objet FormData pour envoyer les données et les fichiers
      const apiFormData = new FormData();
      
      // Ajouter les champs de texte
      Object.keys(formData).forEach(key => {
        if (key !== 'images') {
          apiFormData.append(key, formData[key]);
        }
      });
      
      // Ajouter les images
      formData.images.forEach(image => {
        apiFormData.append('images', image);
      });
      
      // Envoyer les données à l'API
      const response = await fetch('/api/compagne', {
        method: 'POST',
        body: apiFormData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la campagne');
      }
      
      // Nettoyage des URL d'aperçu
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      setSubmitSuccess(true);
      
      // Redirection après soumission réussie
      setTimeout(() => {
        router.push('/cataloguecompagne');
      }, 2000);
    } catch (error) {
      console.error('Erreur de soumission du formulaire:', error);
      setErrors(prev => ({
        ...prev,
        form: `Échec de la soumission du formulaire: ${error.message}`
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options des wilayas
  const wilayaOptions = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
    'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
    'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès',
    'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla'
  ];

  // Affichage de chargement pendant la vérification de session
  if (status === 'loading') {
    return (
      <div className={styles.bodyContainer}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1>Chargement...</h1>
          </div>
        </div>
      </div>
    );
  }

  // Si pas d'autorisation, ne rien afficher (redirection en cours)
  if (!session || session.user.userType !== 'association') {
    return null;
  }

  return (
    <div>
      <div className={styles.bodyContainer}>
        <div className={styles.formContainer}>
          {submitSuccess ? (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✓</div>
              <h2>Campagne soumise avec succès !</h2>
              <p>Votre campagne a été publiée.</p>
              <p>Redirection vers le catalogue...</p>
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h1>Annonce de Campagne</h1>
                <p>Ils n'ont pas choisi cette vie. Mais vous pouvez choisir d'aider</p>
                <p>Connecté en tant que: <strong>{session.user.name}</strong></p>
              </div>
              
              <form className={styles.campaignForm} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <h2 className={styles.sectionTitle}>Détails de la campagne :</h2>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="title">Titre de la campagne* :</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Entrez un titre descriptif pour votre campagne"
                      className={errors.title ? styles.errorInput : ''}
                    />
                    {errors.title && <span className={styles.errorText}>{errors.title}</span>}
                  </div>
                  
                  <div className={styles.inputRow}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="startDate">Date de début* :</label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className={errors.startDate ? styles.errorInput : ''}
                      />
                      {errors.startDate && <span className={styles.errorText}>{errors.startDate}</span>}
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label htmlFor="endDate">Date de fin* :</label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className={errors.endDate ? styles.errorInput : ''}
                      />
                      {errors.endDate && <span className={styles.errorText}>{errors.endDate}</span>}
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label htmlFor="startTime">Heure de début* :</label>
                      <input
                        type="time"
                        id="startTime"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className={errors.startTime ? styles.errorInput : ''}
                      />
                      {errors.startTime && <span className={styles.errorText}>{errors.startTime}</span>}
                    </div>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="location">Lieu (Wilaya)* :</label>
                    <select
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={errors.location ? styles.errorInput : ''}
                    >
                      <option value="">Sélectionnez une wilaya</option>
                      {wilayaOptions.map((wilaya) => (
                        <option key={wilaya} value={wilaya}>{wilaya}</option>
                      ))}
                    </select>
                    {errors.location && <span className={styles.errorText}>{errors.location}</span>}
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <h2 className={styles.sectionTitle}>Informations de la campagne :</h2>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="description">Description* :</label>
                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Décrivez votre campagne et ses activités"
                      className={errors.description ? styles.errorInput : ''}
                    ></textarea>
                    {errors.description && <span className={styles.errorText}>{errors.description}</span>}
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="objective">Objectif de la campagne* :</label>
                    <textarea
                      id="objective"
                      name="objective"
                      rows="3"
                      value={formData.objective}
                      onChange={handleChange}
                      placeholder="Quels sont les objectifs et résultats attendus de cette campagne ?"
                      className={errors.objective ? styles.errorInput : ''}
                    ></textarea>
                    {errors.objective && <span className={styles.errorText}>{errors.objective}</span>}
                  </div>
                  
                  <div className={styles.formGroup}>
                    <h2 className={styles.sectionTitle}>Images de la campagne :</h2>
                    
                    <div className={styles.imageUpload}>
                      <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={formData.images.length >= 3}
                      />
                      <label 
                        htmlFor="image" 
                        className={`${styles.uploadButton} ${formData.images.length >= 3 ? styles.disabled : ''}`}
                      >
                        <span>Choisir des images {`(${formData.images.length}/3)`}</span>
                      </label>
                    </div>
                    
                    {previewUrls.length > 0 && (
                      <div className={styles.imagePreviewContainer}>
                        {previewUrls.map((previewUrl, index) => (
                          <div key={index} className={styles.imagePreviewWrapper}>
                            <div 
                              className={styles.removeImageButton} 
                              onClick={() => removeImage(index)}
                            >
                              ×
                            </div>
                            <img 
                              src={previewUrl} 
                              alt={`Aperçu ${index + 1}`} 
                              className={styles.imagePreview} 
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <h2 className={styles.sectionTitle}>Informations de contact :</h2>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="email">Email de l'association* :</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Entrez l'email de votre association"
                      className={errors.email ? styles.errorInput : ''}
                    />
                    {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="phone">Numéro de téléphone (optionnel) :</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Entrez un numéro de contact"
                    />
                  </div>
                </div>
                
                {errors.form && <div className={styles.formError}>{errors.form}</div>}
                
                <div className={styles.formActions}>
                  <Link href="/" className={styles.cancelButton}>
                    Annuler
                  </Link>
              
              <button 
                type="submit" 
                className={styles.submitButton} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Publier la campagne'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
   </div>
  
   </div>
  );
}