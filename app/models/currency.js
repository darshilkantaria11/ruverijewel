import { Schema, model, models } from "mongoose";

const currencySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    rateInINR: {
      type: Number, // 1 Unit of currency in INR, Example: 1 USD = 89.63
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default models.Currency || model("Currency", currencySchema);
