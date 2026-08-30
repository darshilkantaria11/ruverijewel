import Products from "../nopage/home/Products";

export const metadata = {
  title: "Gold, Silver & Diamond Chains for Men & Women | Ruveri Jewel",
  description:
    "Discover premium gold, silver, and diamond chains at Ruveri Jewel. Elegant chain designs crafted with precision for men and women. Luxury jewelry with worldwide shipping.",
  keywords: [
    "gold chains",
    "silver chains",
    "diamond chains",
    "chains for women",
    "chains for men",
    "luxury chains",
    "designer chains",
    "buy chains online",
    "gold jewelry",
    "diamond jewelry",
    "silver jewelry",
    "Ruveri Jewel",
  ],

  logo1Graph: {
    title: "Luxury Gold, Silver & Diamond Chains | Ruveri Jewel",
    description:
      "Shop elegant gold, silver, and diamond chains from Ruveri Jewel. Timeless jewelry designs crafted for everyday wear and special occasions.",
    url: "https://ruverijewel.com/chains",
    siteName: "Ruveri Jewel",
    images: [
      {
        url: "https://ruverijewel.com/logo1.png",
        width: 1200,
        height: 630,
        alt: "Luxury Chains Collection by Ruveri Jewel",
      },
    ],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Designer Gold, Silver & Diamond Chains | Ruveri Jewel",
    description:
      "Explore the elegant chains collection by Ruveri Jewel. Shop premium gold, silver, and diamond chains designed for modern style.",
    images: ["https://ruverijewel.com/logo1.png"],
  },

  alternates: {
    canonical: "https://ruverijewel.com/chains",
  },
};

export default function Home() {
  return (
    <>
      <Products category="spiritual" title="Spiritual" />
    </>
  );
}