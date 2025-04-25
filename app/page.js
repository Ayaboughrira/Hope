'use client'
import Head from 'next/head';
import HeroCarousel from  './component/sectionone.js';
import AnimalCareSection from  './component/sectiontwo.js';
import AdoptionSection from  './component/sectiontrois.js';





export default function Home() {
  return (
    <div className="min-h-screen">
      <Head>
        <title>Adopte un Animal | Trouvez votre compagnon idéal</title>
        <meta name="description" content="Plateforme d'adoption d'animaux pour trouver votre nouveau compagnon" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

     
      <main>
     
      <HeroCarousel/>
      <AnimalCareSection/>
      <AdoptionSection/>
      
    
        
      </main>
    
     
    </div>
  );
}
