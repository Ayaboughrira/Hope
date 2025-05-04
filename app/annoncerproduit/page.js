
import Head from 'next/head';
import ProductForm from '../component/produitform';
import styles from '../styles/annoncerproduit.module.css';

export default function ShareProduct() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Partager un produit</title>
        <meta name="description" content="Share your pet products." />
       <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <ProductForm />
      </main>
    </div>
  );
}