'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../styles/compagneform.module.css';



export default function PostCampaignForm() {
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
      alert('You can upload a maximum of 3 images.');
      return;
    }

    const newImages = [...formData.images, ...files];
    const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    setPreviewUrls(newPreviewUrls);
  };

  // Supprimer une image
  const removeImage = (indexToRemove) => {
    const updatedImages = formData.images.filter((_, index) => index !== indexToRemove);
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
    
    if (!formData.title.trim()) newErrors.title = ' Title is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is  requise';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.objective.trim()) newErrors.objective = 'Objective is required';
    
    // Validation de l'email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Ici, vous enverriez les données à votre backend
        // Pour l'instant, on simule une soumission réussie
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSubmitSuccess(true);
        
        // Redirection après soumission réussie
        setTimeout(() => {
          router.push('/');//hna lzm vers la page HOME apres la creer*******///
        }, 1000);
      } catch (error) {
        console.error('Erreur de soumission du formulaire:', error);
        setErrors(prev => ({
          ...prev,
          form: 'Échec de la soumission du formulaire. Veuillez réessayer.'
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Options des wilayas
  const wilayaOptions = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
    'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
    'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès',
    'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla'
  ];

  return (
   <div>
    
   <div className={styles.bodyContainer}>
    <div className={styles.formContainer}>
      {submitSuccess ? (
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>✓</div>
          <h2>Campaign submitted successfully!</h2>
          <p>Your campaign has been published .</p>
          <p>Redirection to the Home page...</p>
        </div>
      ) : (
        <>
          <div className={styles.formHeader}>
            <h1> Campaign Announcement</h1>
            <p>They didn’t choose this life. But you can choose to help</p>
          </div>
          
          <form className={styles.campaignForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <h2 className={styles.sectionTitle}>Campaign Details :</h2>
              
              <div className={styles.inputGroup}>
                <label htmlFor="title">Campaign Title* :</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a descriptive title for your campaign"
                  className={errors.title ? styles.errorInput : ''}
                />
                {errors.title && <span className={styles.errorText}>{errors.title}</span>}
              </div>
              
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="startDate">Start Date* :</label>
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
                  <label htmlFor="endDate">End Date* :</label>
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
                  <label htmlFor="startTime">Start Time* :</label>
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
                <label htmlFor="location">Location (Wilaya)* :</label>
                <select
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={errors.location ? styles.errorInput : ''}
                >
                  <option value="">Select a wilaya</option>
                  {wilayaOptions.map((wilaya) => (
                    <option key={wilaya} value={wilaya}>{wilaya}</option>
                  ))}
                </select>
                {errors.location && <span className={styles.errorText}>{errors.location}</span>}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <h2 className={styles.sectionTitle}>Campaign Information :</h2>
              
              <div className={styles.inputGroup}>
                <label htmlFor="description">Description* :</label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your campaign and its activities"
                  className={errors.description ? styles.errorInput : ''}
                ></textarea>
                {errors.description && <span className={styles.errorText}>{errors.description}</span>}
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="objective"> Campaign Objective* :</label>
                <textarea
                  id="objective"
                  name="objective"
                  rows="3"
                  value={formData.objective}
                  onChange={handleChange}
                  placeholder="What are the objectives and expected results of this campaign?"
                  className={errors.objective ? styles.errorInput : ''}
                ></textarea>
                {errors.objective && <span className={styles.errorText}>{errors.objective}</span>}
              </div>
              
              <div className={styles.formGroup}>
                <h2 className={styles.sectionTitle}>Campaign Images :</h2>
                
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
                    <span> choose images {`(${formData.images.length}/3)`}</span>
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
              <h2 className={styles.sectionTitle}> Contact Information :</h2>
              
              <div className={styles.inputGroup}>
                <label htmlFor="email">Association Email* :</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter the email of your association"
                  className={errors.email ? styles.errorInput : ''}
                />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="phone">Phone Number (optional) :</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter a contact number"
                />
              </div>
            </div>
            
            {errors.form && <div className={styles.formError}>{errors.form}</div>}
            
            <div className={styles.formActions}>
              <Link href="/" className={styles.cancelButton}> {/* href="/Home   nrmlm mais lzm la creer d'abord*/ }
                Cancel
              </Link>
              
              <button 
                type="submit" 
                className={styles.submitButton} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending in progress...' : 'Publish the campaign'}
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