import { dbConnect } from "./mongoose";
import Currency from "../models/currency";

// Symbol map — covers all 30 currencies in your DB
export const CURRENCY_SYMBOLS = {
  INR: "₹", USD: "$",  GBP: "£",  EUR: "€",  CHF: "Fr",
  SGD: "S$", CAD: "C$", AUD: "A$", NZD: "NZ$", BGN: "лв",
  ILS: "₪",  PLN: "zł", MYR: "RM", RON: "lei", BRL: "R$",
  DKK: "kr", CNY: "¥",  HKD: "HK$",SEK: "kr", NOK: "kr",
  ZAR: "R",  MXN: "$",  CZK: "Kč", THB: "฿",  TRY: "₺",
  PHP: "₱",  ISK: "kr", JPY: "¥",  HUF: "Ft", KRW: "₩",
  IDR: "Rp",
};

/**
 * Fetches the currency record from DB.
 * Falls back to INR (rate=1) if code is not found.
 */
export async function getCurrencyRate(code = "INR") {
  if (!code || code === "INR") {
    return { rateInINR: 1, symbol: "₹", code: "INR" };
  }
  await dbConnect();
  const currency = await Currency.findOne({ code: code.toUpperCase() }).lean();
  if (!currency) {
    return { rateInINR: 1, symbol: "₹", code: "INR" };
  }
  return {
    rateInINR: currency.rateInINR,
    symbol: CURRENCY_SYMBOLS[currency.code] || currency.code,
    code: currency.code,
  };
}

/**
 * Converts an INR amount to the target currency.
 * Rounds to 2 decimal places.
 */
export function convertFromINR(amountInINR, rateInINR) {
  if (!rateInINR || rateInINR <= 0) return amountInINR;
  return Math.round((amountInINR / rateInINR) * 100) / 100;
}