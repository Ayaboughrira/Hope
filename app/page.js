'use client'
import Head from 'next/head';
import HeroCarousel from  './component/sectionone.js';
import AnimalCareSection from  './component/sectiontwo.js';
import AdoptionSection from  './component/sectionthree.js';
import Footer  from  './component/footer.js';
import Header  from  './component/navbar.js';




export default function Home() {
  return (
    <div className="min-h-screen">
      <Head>
        <title>Adopte un Animal | Trouvez votre compagnon idéal</title>
        <meta name="description" content="Plateforme d'adoption d'animaux pour trouver votre nouveau compagnon" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

     
      <main>
      < Header/>
      <HeroCarousel/>
      <AnimalCareSection/>
      <AdoptionSection/>
      
    
        
      </main>
      <Footer/>
     
    </div>
  );
}
