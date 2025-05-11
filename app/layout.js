import { Inter } from "next/font/google";
import { Roboto_Mono} from "next/font/google";
import "./globals.css";
import DonateButton from  './component/boutondon.js';
import Navbar  from './component/navbar.js';
import Footer   from   './component/footer.js';
import { Providers } from './providers';

const inter = Inter({
 /* variable: "--font-inter",*/
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
 /* variable: "--font-roboto-mono",*/
  subsets: ["latin"],
});


export const metadata = {
  title: "Hope",
  description: "Helping Our Pets Everyday.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${robotoMono.className}`}>
        
       <Providers>
          {children}
          <Navbar/>
          <DonateButton />
          <Footer/>
       </Providers>

      </body>
    </html>
  );
}
