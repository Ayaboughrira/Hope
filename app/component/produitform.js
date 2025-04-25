'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../styles/annoncerproduit.module.css';
import { db, storage } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProductForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    libelle: '',
    prix: '',
    promotion: '',
    description: '',
    categorie: 'dog',
    image: null
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Télécharger l'image dans Firebase Storage
      let imageUrl = null;
      if (formData.image) {
        // Créer une référence unique pour l'image
        const imageRef = ref(storage, `products/${Date.now()}-${formData.image.name}`);
        
        // Télécharger l'image
        const uploadResult = await uploadBytes(imageRef, formData.image);
        
        // Obtenir l'URL de téléchargement
        imageUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // 2. Créer l'objet produit à sauvegarder dans Firestore
      const productData = {
        libelle: formData.libelle,
        prix: parseFloat(formData.prix),
        promotion: formData.promotion ? parseFloat(formData.promotion) : 0,  //valeur par defaut 0
        descriptionProduit: formData.description,
        categorie: formData.categorie,
        photosProduit: imageUrl,
        createdAt: serverTimestamp()
      };
      
      // 3. Ajouter le document à la collection "produits" dans Firestore
      const docRef = await addDoc(collection(db, "produits"), productData);
      console.log("Produit ajouté avec ID: ", docRef.id);
      
      // 4. Réinitialiser le formulaire après soumission
      setFormData({
        libelle: '',
        prix: '',
        promotion: '',
        description: '',
        categorie: 'dog',
        image: null
      });
      setImagePreview(null);
      
      // 5. Afficher un message de succès et rediriger
      alert("Produit partagé avec succès!");
      router.push('/'); // Redirection vers la page d'accueil
      
    } catch (error) {
      console.error("Erreur lors du partage du produit:", error);
      setError("Une erreur est survenue lors du partage du produit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Share Product</h1>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="libelle">Product label :</label>
          <input
            type="text"
            id="libelle"
            name="libelle"
            value={formData.libelle}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="prix">Price : </label>
            <input
              type="number"
              id="prix"
              name="prix"
              min="0"
              step="0.01"
              value={formData.prix}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="promotion">Promotion (%) :</label>
            <input
              type="number"
              id="promotion"
              name="promotion"
              min="0"
              max="100"
              value={formData.promotion}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description">Description :</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className={styles.textarea}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="categorie">Category :</label>
          <select
            id="categorie"
            name="categorie"
            value={formData.categorie}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="dog">Dogs</option>
            <option value="cats">Cats</option>
            <option value="birds">Birds</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="image">Product image</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            required
            className={styles.fileInput}
          />
          
          {imagePreview && (
            <div className={styles.imagePreview}>
              <img src={imagePreview} alt="Aperçu de l'image" />
            </div>
          )}
        </div>
        
        <button
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Partage en cours...' : 'Publish product'}
        </button>
      </form>
    </div>
  );
}