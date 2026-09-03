import { Inter } from 'next/font/google'
import Script from 'next/script'

import './globals.css'

import Navbar1 from "./nopage/components/navbar1"
import Navbar2 from "./nopage/components/navbar2"
import Footer from './nopage/components/footer'
import Headline from "./nopage/components/headline"
import Bottom from "./nopage/components/bottom"

import { CartProvider } from './nopage/context/CartContext'
import CartNotification from './nopage/components/CartNotification'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Ruveri Jewel',
  description: 'A Jewelry company',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-[#FFF5F5] ci">
      <body className={inter.className}>

        {/* Google Ads Google Tag */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17274749876"
          strategy="afterInteractive"
        />

        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-17274749876');
          `}
        </Script>

        <CartProvider>
          <div>

            {/* <Headline /> */}

            <Navbar1 />
            <Navbar2 />

            {children}

            {/* <Bottom /> */}

            <Footer />
            <CartNotification />

          </div>
        </CartProvider>

      </body>
    </html>
  )
}