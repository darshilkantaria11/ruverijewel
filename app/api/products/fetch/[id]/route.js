import { dbConnect } from '../../../../utils/mongoose';
import Product from '../../../../models/product';
import { getCurrencyRate, convertFromINR } from '../../../../utils/currency';
import { NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const getPurityMultiplier = (metal, purity) => {
  const goldMap = { "24K":1,"22K":0.916,"20K":0.833,"18K":0.78,"14K":0.615,"9K":0.415 };
  const silverMap = { "999 Silver":1,"950 Silver":0.95,"925 Silver":0.925,"900 Silver":0.9,"800 Silver":0.8 };
  if (metal === "gold") return goldMap[purity] || 1;
  if (metal === "silver") return silverMap[purity] || 1;
  return 1;
};

const calcTotalPriceINR = (product) => {
  if (product.metal === "silver") return Number(product.metalPrice) || 0;
  const netWeight        = Number(product.netWeight)     || 0;
  const metalPrice       = Number(product.metalPrice)    || 0;
  const makingCharges    = Number(product.makingCharges) || 0;
  const diamondPrice     = Number(product.diamondPrice)  || 0;
  const purityMultiplier = getPurityMultiplier(product.metal, product.purity);
  return Math.ceil(netWeight * metalPrice * purityMultiplier + makingCharges + diamondPrice);
};

export async function GET(req, { params }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ message: "Invalid product ID" }, { status: 400 });

  const authKey = req.headers.get("x-api-key");
  if (!authKey || authKey !== API_KEY) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const currencyCode = url.searchParams.get("currency") || "INR"; // 👈 NEW

  try {
    await dbConnect();

    const product = await Product.findById(id);
    if (!product || product.status !== "live") {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const { rateInINR, symbol, code } = await getCurrencyRate(currencyCode); // 👈 NEW
    const priceINR = calcTotalPriceINR(product);

    return NextResponse.json({
      ...product.toObject(),
      totalPrice: convertFromINR(priceINR, rateInINR), // 👈 converted
      currencySymbol: symbol,                           // 👈 NEW
      currencyCode: code,                               // 👈 NEW
    });
  } catch (error) {
    console.error("PRODUCT FETCH ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}