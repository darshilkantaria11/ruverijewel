import { Schema, model, models } from "mongoose";

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    itemNo: {
      type: String,
      required: [true, "Item number is required"],
      trim: true,
    },
    makingCharges: {
      type: Number,
      required: [true, "Making charges are required"],
    },
    metalPrice: {
      type: Number,
      required: [true, "Metal price is required"],
    },

    // 👉 Weight & Metal Details
    grossWeight: {
      type: Number,
      required: [true, "Gross weight is required"],
    },
    netWeight: {
      type: Number,
      required: [true, "Net weight is required"],
    },
    metal: {
      type: String,
      enum: ["gold", "silver"],
      required: [true, "Metal type is required"],
    },
    purity: {
      type: String,
      enum: [
        "9K",
        "14K",
        "18K",
        "20K",
        "22K",
        "24K",
        "800 Silver",
        "900 Silver",
        "925 Silver",
        "950 Silver",
        "999 Silver",
      ],
      required: [true, "Purity is required"],
    },

    // 👉 Diamond Details (NEW)
    diamondWeight: {
      type: Number,
      default: 0,
    },
    diamondPrice: {
      type: Number,
      default: 0,
    },

    // 👉 Updated Fields
    color: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["men", "women", "unisex"],
      default: "unisex",
    },

    // 👉 Images
    img1: {
      type: String,
      required: [true, "Image 1 is required"],
    },
    img2: {
      type: String,
      required: [true, "Image 2 is required"],
    },
    img3: {
      type: String,
      required: false,
    },
    img4: {
      type: String,
      required: false,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "bangles",
        "bracelets",
        "chains",
        "earrings",
        "necklace",
        "mencollections",
        "kidscollections",
        "pendents",
        "rings",
      ],
      default: "rings",
    },
    status: {
      type: String,
      enum: ["live", "inactive"],
      default: "live",
    },
  },
  {
    timestamps: true,
  }
);

export default models.Product || model("Product", productSchema);