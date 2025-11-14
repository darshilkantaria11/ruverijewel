import Home1 from "./nopage/home/home1a";
import Home2 from "./nopage/home/home1b";
import Products from "./nopage/home/Products";

export const metadata = {
  title: "Personalized Name Jewelry – Custom Necklaces, Pendants & Keychains | Erroneous Gold",
  description:
    "Shop custom-made name jewelry at Erroneous Gold. Discover personalized name necklaces, couple pendants, designer keychains, and more – handcrafted with love and elegance.",
  keywords: [
    "personalized jewelry",
    "custom name necklace",
    "name pendant",
    "couple necklace",
    "custom keychain",
    "personalized rakhi",
    "engraved jewelry",
    "name jewelry india",
    "erroneous gold",
  ],
  openGraph: {
    title: "Erroneous Gold – Personalized Name Jewelry Store",
    description:
      "Design your own name jewelry with Erroneous Gold. From name necklaces to keychains and pendants – all personalized just for you.",
    url: "https://erroneousgold.com",
    siteName: "Erroneous Gold",
    images: [
      {
        url: "https://erroneousgold.com/open.png", // replace with actual OG image URL
        width: 1200,
        height: 630,
        alt: "Personalized Name Jewelry – Erroneous Gold",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erroneous Gold – Personalized Jewelry Store",
    description:
      "Create your own name jewelry – necklaces, keychains, and pendants handcrafted with precision and love.",
    images: ["https://erroneousgold.com/open.png"], // same OG image
  },
  alternates: {
    canonical: "https://erroneousgold.com",
    
  },
};

export default function Home() {
  return (
    <>
  
      <Home1  />
    

      {/* <Products category="singlenamenecklace" title="Single Name Necklaces" />
      <Products category="rakhi" title="Rakhi" />
      <Products category="couplenamenecklace" title="Couple Name Necklaces" />
      <Products category="keychain" title="Keychains" />
      <Products category="carcharam" title="Car Charam" />
      <Products category="skeychain" title="Single Name Keychain" />
      <Products category="ckeychain" title="Couple Name Keychain" />
      <Products category="designerpendents" title="Designer Pendents" /> */}
    </>
  );
}
