import Link from 'next/link';
import styles from '../styles/aboutus.module.css';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>About Us</h1>
        <p className={styles.subtitle}>From a Simple Idea to a Responsible Adoption Movement </p>
      </section>

      <section className={styles.mission}>
        <h2 className={styles.sectionTitle}>Our Mission</h2>
        <div className={styles.missionContent}>
          <p>
            Hope was created in 2025 by a team of passionate students. Our platform aims to revolutionize animal protection in Algeria by connecting all stakeholders in the sector.
          </p>
          <div className={styles.missionCards}>
            <div className={styles.card}>
              <h3>Responsible Adoption</h3>
              <p>We facilitate transparent adoptions between owners and foster families.</p>
            </div>
            <div className={styles.card}>
              <h3>Protection Animale</h3>
              <p>Our reporting system helps combat mistreatment and disappearances.</p>
            </div>
            <div className={styles.card}>
              <h3>Community Committed</h3>
              <p>Veterinarians, associations and pet shops united for the same cause.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>What We Offer</h2>
        <ul className={styles.featuresList}>
          <li>Central platform for animal adoption</li>
          <li>Organize awareness campaigns</li>
          <li>Reporting system for mistreatment and loss of animals</li>
          <li>A professional space where veterinarians can share their articles</li>
          <li>Promote local animal products</li>
        </ul>
      </section>

      <section className={styles.team}>
        <h2 className={styles.sectionTitle}>The Team</h2>
        <p>
          The idea for the Hope application was conceived by Boughrira Aya and Djouadi Amani,
          two students of computer science at the University of Sidi Amar Annaba (Algeria). 
          Their main motivation was to use their technical skills to create a useful tool,
          related to a cause that was close to our hearts.
        </p>
      </section>

      <section className={styles.login}>
        <h2 className={styles.sectionTitle}>Join Our Community</h2>
        <p>Connect with us to be part of the animal protection movement</p>
        
        <div className={styles.loginForm}>
          
          <div className={styles.loginLinks}>
            <Link href="/signuplogin" className={styles.joinButton}>
             Join Now
           </Link>
         </div>
        </div>
      </section>
    </div>
  );
}