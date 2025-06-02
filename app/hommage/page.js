import styles from '../styles/hommage.module.css';
import Image from 'next/image';

export default function Hommage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Our Special Companions</h1>
      <p className={styles.subtitle}>They filled our lives with unconditional love</p>
      
      <div className={styles.animalContainer}>
        <div className={styles.animalImageLeft}>
          <Image 
            src="/images/rosa.jpg" 
            alt="Rosa the dog"
            width={500}
            height={300}
            className={styles.image}
            priority
          />
        </div>
        <div className={styles.animalDescriptionRight}>
          <h2 className={styles.animalName}>Rosa</h2>
          <p className={styles.animalHistory}>
            Rosa is our bundle of joy who came into our lives in 2024. 
            Her playful energy and affectionate nature help heal our hearts.
            Every day with her is a reminder of the beautiful cycle of life.
          </p>
          <ul className={styles.animalFacts}>
            <li>🐶 Born: February 2, 2024</li>
            <li>🏆 Special Talent: Making everyone smile</li>
            <li>❤️ Loves: Morning cuddles and chew toys</li>
          </ul>
        </div>
      </div>
      
      <div className={`${styles.animalContainer} ${styles.memorial}`}>
        <div className={styles.animalDescriptionLeft}>
          <h2 className={styles.animalName}>Achil (2010 - 2023)</h2>
          <div className={styles.inLovingMemory}>In Loving Memory</div>
          <p className={styles.animalHistory}>
            Achil was more than a pet - he was family. For 13 wonderful years, 
            he was our loyal protector, our comfort during hard times, and 
            our daily source of laughter. Though he's no longer with us physically, 
            his paw prints remain forever on our hearts.
          </p>
          <ul className={styles.animalFacts}>
            <li>🐶 Born: 2010 </li>
            <li>🏆 Special Talent: Understanding human emotions</li>
            <li>❤️ Loved: Car rides </li>
            
          </ul>
        </div>
        <div className={styles.animalImageRight}>
          <Image 
            src="/images/achil.jpg" 
            alt="Achil the dog"
            width={500}
            height={300}
            className={styles.image}
          />
          <div className={styles.angelWings}>👼</div>
        </div>
      </div>
      
      <div className={styles.footer}>
        <p>"Thank you for filling our lives with love, laughter, and unforgettable moments!</p>
        <div className={styles.hearts}>❤️ 🐾 Forever in Our Hearts 🐾 ❤️</div>
      </div>
    </div>
  );
}