'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import styles from '../../styles/donformulaire.module.css';
import SuccessModal from '../SuccessModal'; // Importer le composant modal

// Liste des wilayas d'Algérie
const wilayasAlgerie = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
  'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
  'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda',
  'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem',
  'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arreridj',
  'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
  'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
  'Ghardaïa', 'Relizane', 'El M\'Ghair', 'El Meniaa', 'Ouled Djellal',
  'Bordj Baji Mokhtar', 'Béni Abbès', 'Timimoun', 'Touggourt', 'Djanet',
  'In Salah', 'In Guezzam'
];

function RefugeFormulaire() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [refugeData, setRefugeData] = useState({
    nom: '',
    adresse: {
      wilaya: '',
      commune: '',
      cite: ''
    },
    contact: {
      telephone: '',
      email: ''
    },
    capacite: '',
    typeAnimaux: [],
    description: ''
  });
  
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false); // État pour le modal
  const fileInputRef = useRef(null);

   // Rediriger si non connecté
  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") {
    router.push('/auth/signiuplogin');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Gérer les champs imbriqués pour l'adresse et le contact
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setRefugeData({
        ...refugeData,
        [parent]: {
          ...refugeData[parent],
          [child]: value
        }
      });
    } else {
      setRefugeData({
        ...refugeData,
        [name]: value
      });
    }
  };
  
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    let newTypeAnimaux = [...refugeData.typeAnimaux];
    
    if (checked) {
      newTypeAnimaux.push(value);
    } else {
      newTypeAnimaux = newTypeAnimaux.filter(type => type !== value);
    }
    
    setRefugeData({
      ...refugeData,
      typeAnimaux: newTypeAnimaux
    });
  };

  // Fonction pour gérer l'upload de photos
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limiter le nombre de photos à 2 maximum
    const newPhotos = [...photos];
    const remainingSlots = 2 - newPhotos.length;
    
    if (remainingSlots > 0) {
      const filesToAdd = files.slice(0, remainingSlots);
      
      filesToAdd.forEach(file => {
        // Ajouter uniquement les fichiers image
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newPhotos.push({
              file: file,
              preview: e.target.result,
              name: file.name
            });
            setPhotos([...newPhotos]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };
  
  // Fonction pour supprimer une photo
  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  // Fonction pour fermer le modal et réinitialiser le formulaire
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    // Réinitialiser le formulaire
    setRefugeData({
      nom: '',
      adresse: {
        wilaya: '',
        commune: '',
        cite: ''
      },
      contact: {
        telephone: '',
        email: ''
      },
      capacite: '',
      typeAnimaux: [],
      description: ''
    });
    setPhotos([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Vérifier si au moins 1 photo est requise
    if (photos.length < 1) {
      setError('Veuillez ajouter au moins une photo pour votre refuge.');
      setIsSubmitting(false);
      return;
    }
    // Vérifier si au moins un type d'animal est sélectionné
    if (refugeData.typeAnimaux.length === 0) {
      setError('Veuillez sélectionner au moins un type d\'animal accepté.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Créer FormData pour l'envoi
      const formData = new FormData();
      
      // Données du refuge
      formData.append('nom', refugeData.nom);
      formData.append('adresse.wilaya', refugeData.adresse.wilaya);
      formData.append('adresse.commune', refugeData.adresse.commune);
      formData.append('adresse.cite', refugeData.adresse.cite);
      formData.append('contact.telephone', refugeData.contact.telephone);
      formData.append('contact.email', refugeData.contact.email);
      formData.append('capacite', refugeData.capacite);
      formData.append('description', refugeData.description);
      
      // Types d'animaux (array)
      refugeData.typeAnimaux.forEach(type => {
        formData.append('typeAnimaux', type);
      });
      
      // Ajouter les photos
      photos.forEach(photo => {
        formData.append('photos', photo.file);
      });
      
      const response = await fetch('/api/refuge', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Afficher le modal de succès au lieu de l'alert
        setShowSuccessModal(true);
      } else {
        setError(result.message || 'Erreur lors de la création du refuge');
      }
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formulaire}>
      <h2>Provide a shelter</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label>Name of shelter:</label>
          <input
            type="text"
            name="nom"
            value={refugeData.nom}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Adresse avec structure multi-attributs */}
        <div className={styles.addressGroup}>
          <h3>Address</h3>
          
          <div className={styles.inputGroup}>
            <label>Wilaya:</label>
            <select
              name="adresse.wilaya"
              value={refugeData.adresse.wilaya}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez une wilaya</option>
              {wilayasAlgerie.map((wilaya, index) => (
                <option key={index} value={wilaya}>{wilaya}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.inputGroup}>
            <label>Commune:</label>
            <input
              type="text"
              name="adresse.commune"
              value={refugeData.adresse.commune}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Cité/Quartier:</label>
            <input
              type="text"
              name="adresse.cite"
              value={refugeData.adresse.cite}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        {/* Contact unifié */}
        <div className={styles.contactGroup}>
          <h3>Contact Information</h3>
          
          <div className={styles.inputGroup}>
            <label>Phone:</label>
            <input
              type="tel"
              name="contact.telephone"
              value={refugeData.contact.telephone}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Email:</label>
            <input
              type="email"
              name="contact.email"
              value={refugeData.contact.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className={styles.inputGroup}>
          <label>Shelter capacity (Animals number):</label>
          <input
            type="number"
            name="capacite"
            value={refugeData.capacite}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
        
        <div className={styles.inputGroup}>
          <label>Types of animals accepted</label>
          <div className={styles.checkboxGroup}>
            {['Cats', 'Dogs', 'Birds', 'Other'].map(type => (
              <label key={type} className={styles.checkbox}>
                <input
                  type="checkbox"
                  value={type}
                  checked={refugeData.typeAnimaux.includes(type)}
                  onChange={handleCheckboxChange}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className={styles.inputGroup}>
          <label>Shelter Description:</label>
          <textarea
            name="description"
            value={refugeData.description}
            onChange={handleChange}
            placeholder="Describe your shelter, its facilities, and any useful information."
            required
          />
        </div>
        
        {/* Système d'upload de photos */}
        <div className={styles.inputGroup}>
          <label>Photos (min. 1 required):</label>
          <div className={styles.photoUploadContainer}>
            <div className={styles.photoPreviewArea}>
              {photos.map((photo, index) => (
                <div key={index} className={styles.photoPreview}>
                  <img src={photo.preview} alt={`Uploaded ${index + 1}`} />
                  <button 
                    type="button" 
                    className={styles.removePhotoBtn}
                    onClick={() => removePhoto(index)}
                  >
                    ×
                  </button>
                  <span className={styles.photoName}>{photo.name}</span>
                </div>
              ))}
              
              {photos.length < 2 && (
                <div 
                  className={styles.photoPlaceholder}
                  onClick={() => fileInputRef.current.click()}
                >
                  <span>+</span>
                  <p>Add Photo</p>
                </div>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
              multiple={true}
            />
            
            <div className={styles.photoUploadInfo}>
              <p>Required: 1 photo(s) minimum - Maximum: 2 photo(s)</p>
              <button 
                type="button" 
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current.click()}
              >
                Browse...
              </button>
            </div>
          </div>
        </div>
        
        <button 
          type="submit" 
          className={`${styles.btn} ${styles.btnSubmit}`}
          disabled={photos.length < 1 || refugeData.typeAnimaux.length === 0 || isSubmitting}
          aria-busy={isSubmitting}
        >
           {isSubmitting ? 'Registering...' : 'Register the shelter'}
        </button>
      </form>

      {/* Modal de succès */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        title="Thank You for Your Shelter Proposal!"
        message="Your shelter has been successfully registered and will help provide a safe haven for animals in need."
      />
    </div>
  );
}

export default RefugeFormulaire;