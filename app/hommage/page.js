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
            src="/images/rosa.png" 
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
            Rosa entered my life like a gentle whisper that became the most beautiful symphony. This enchanting Siamese mix has transformed my world with her ethereal grace and captivating personality. How much do I love her? She is the sunrise that brightens my mornings and the peaceful melody that soothes my evenings.

            My experience with Rosa has been nothing short of magical. From the moment she gracefully stepped into my home, she claimed not just a corner of my house, but the entire landscape of my heart. Her piercing blue eyes seem to hold ancient wisdom, and her soft purr is like a healing balm after long days. She has taught me the art of living in the moment, finding joy in simple pleasures, and the profound comfort that comes from unconditional companionship.

            Every day with Rosa is a new chapter in our love story - whether she's curled up on my lap during quiet evenings, following me around the house like my devoted shadow, or simply existing in perfect harmony beside me.
          </p>
          <ul className={styles.animalFacts}>
            <li>🐶 Born: February 2, 2024</li>
            <li>🏆 Special Talent: Graceful Acrobat, Melodious Singer, Domestic Detective, Heart Therapist </li>
            <li>❤️ Loves:Tuna kibble, Chasing sunbeams dancing on the floor, Her soft little blanket in the living room, Cuddle moments in front of the TV in the evening </li>
          </ul>
        </div>
      </div>
      
      <div className={`${styles.animalContainer} ${styles.memorial}`}>
        <div className={styles.animalDescriptionLeft}>
          <h2 className={styles.animalName}>Achil (2013 - 2023)</h2>
          <div className={styles.inLovingMemory}>In Loving Memory</div>
          <p className={styles.animalHistory}>
            Achil was more than a pet - he was family. For 13 wonderful years, 
            he was our loyal protector, our comfort during hard times, and 
            our daily source of laughter. Though he's no longer with us physically, 
            his paw prints remain forever on our hearts.
          </p>
          <ul className={styles.animalFacts}>
            <li>🐶 Born: 2013 </li>
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