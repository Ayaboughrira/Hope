
'use client';

import React, { useState } from 'react';
import DonFormulaire from './DonFormulaire';
import RefugeFormulaire from './RefugeFormulaire';
import styles from '../../styles/donformulaire.module.css';

function FormulairePage() {
  // État pour suivre quel formulaire est actuellement affiché
  const [formulaireActif, setFormulaireActif] = useState('don');

  // Fonction pour basculer entre les formulaires
  const basculerFormulaire = () => {
    setFormulaireActif(formulaireActif === 'don' ? 'refuge' : 'don');
  };

  return (
    <div className={styles.formulairesContainer}>
      <div className={styles.formulairesHeader}>
        <h1>Lend a hand to our animal buddies</h1>
        <p>Donate or provide shelter for animals in need</p>
      </div>
      
      <div className={styles.infoMessage}>
        {formulaireActif === 'don' 
          ? "Every contribution you make can be a lifeline for an animal waiting for care and love" 
          : "Providing a shelter is an act of generosity that saves animal lives"}
      </div>
      
      {/* Afficher le formulaire actif avec animation */}
      <div className={styles.formFade}>
        {formulaireActif === 'don' ? (
          <DonFormulaire />
        ) : (
          <RefugeFormulaire />
        )}
      </div>
      
      {/* Bouton pour basculer entre les formulaires */}
      <button className={`${styles.btn} ${styles.btnToggle}`} onClick={basculerFormulaire}>
        {formulaireActif === 'don' ? 'Shelter' : 'Donation'} Form
      </button>
    </div>
  );
}

export default FormulairePage;