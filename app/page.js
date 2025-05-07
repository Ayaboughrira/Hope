'use client'
import Head from 'next/head';
import HeroCarousel from  './component/sectionone.js';
import AnimalCareSection from  './component/sectiontwo.js';
import AdoptionSection from  './component/sectiontrois.js';





export default function Home() {
  return (
    <div className="min-h-screen">
      
     
      <main>
     
      <HeroCarousel/>
      <AnimalCareSection/>
      <AdoptionSection/>
      
    
        
      </main>
    
     
    </div>
  );
}
