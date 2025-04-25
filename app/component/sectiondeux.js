// components/PrendreSoinSection.jsx
import React from 'react';
import Link from 'next/link';
import { Cat, Dog, Bird } from 'lucide-react';
import styles from '../styles/sectiondeux.module.css';

const PrendreSoinSection = () => {
  const careCards = [
    {
      id: 'cats',
      title: 'Chats',
      icon: <Cat className={styles.icon} />,
      description: 'Les chats ont besoin d\'un environnement calme et sécurisé. Assurez-vous de leur fournir une alimentation équilibrée, de l\'eau fraîche quotidiennement et un bac à litière propre. Les visites régulières chez le vétérinaire sont essentielles pour leur santé.',
      link: '/prendre-soin/chats'
    },
    {
      id: 'dogs',
      title: 'Chiens',
      icon: <Dog className={styles.icon} />,
      description: 'Les chiens nécessitent de l\'exercice quotidien, une alimentation adaptée à leur taille et leur âge, ainsi qu\'une éducation bienveillante. N\'oubliez pas les promenades régulières et les moments de jeu pour leur bien-être physique et mental.',
      link: '/prendre-soin/chiens'
    },
    {
      id: 'birds',
      title: 'Oiseaux',
      icon: <Bird className={styles.icon} />,
      description: 'Les oiseaux ont besoin d\'une cage spacieuse, d\'une alimentation variée avec des graines, fruits et légumes. Offrez-leur des jouets et laissez-les voler dans un espace sécurisé. Une interaction sociale régulière est importante pour leur bonheur.',
      link: '/prendre-soin/oiseaux'
    }
  ];

  return (
    <section className={styles.careSectionContainer}>
      <h2 className={styles.sectionTitle}>Prendre Soin</h2>
      <p className={styles.sectionDescription}>
        Découvrez comment prendre soin de vos compagnons à quatre pattes ou à plumes
      </p>
      
      <div className={styles.cardsContainer}>
        {careCards.map((card) => (
          <div key={card.id} className={styles.careCard}>
            <div className={styles.iconContainer}>
              {card.icon}
            </div>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardDescription}>{card.description}</p>
            <Link href={card.link} className={styles.moreButton}>
              En savoir plus
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PrendreSoinSection;