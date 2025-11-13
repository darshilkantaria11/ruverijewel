import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from "./nopage/components/navbar"
import Footer from './nopage/components/footer'
import Headline from "./nopage/components/headline"
import Bottom from "./nopage/components/bottom"
import { CartProvider } from './nopage/context/CartContext';
import CartNotification from './nopage/components/CartNotification'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Ruveri Jewel',
  description: 'A Jewelry company',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className='bg-back'>
      <body className={inter.className}>
        <CartProvider>
          <div className=" ">
            {/* <Headline /> */}
            <Navbar />
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
