import { v2 as cloudinary } from "cloudinary";
import path from "path";
import productModel from "../models/productModel.js";

// INFO: Route for adding a product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestSeller,
    } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const productImages = [image1, image2, image3, image4].filter(
      (image) => image !== undefined
    );

    let imageUrls = [];
    const host = req.get("host");
    const protocol = req.protocol;

    if (process.env.CLOUDINARY_NAME && productImages.length > 0) {
      // Upload each image to Cloudinary, but don't fail the whole request if one image fails.
      imageUrls = await Promise.all(
        productImages.map(async (image) => {
          try {
            const result = await cloudinary.uploader.upload(image.path, {
              resource_type: "image",
            });
            return result.secure_url;
          } catch (err) {
            console.log("Cloudinary upload failed for", image.path, err.message || err);
            // Fallback to server-hosted upload URL for this image
            return `${protocol}://${host}/uploads/${path.basename(image.path)}`;
          }
        })
      );
    } else {
      // Cloudinary not configured; use server-served uploads as public URLs
      imageUrls = productImages.map((img) =>
        `${protocol}://${host}/uploads/${path.basename(img.path)}`
      );
    }

    const productData = {
      name,
      description,
      price: Number(price),
      category,
      subCategory,
      sizes: JSON.parse(sizes),
      bestSeller: bestSeller === "true" ? true : false,
      image: imageUrls,
      date: Date.now(),
    };

    const product = new productModel(productData);
    await product.save();

    res.status(201).json({ success: true, message: "Product added" });
  } catch (error) {
    console.log("Error while adding product: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for fetching all products
const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.log("Error while fetching all products: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for removing a product
const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.status(200).json({ success: true, message: "Product removed" });
  } catch (error) {
    console.log("Error while removing product: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for fetching a single product
const getSingleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.log("Error while fetching single product: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { addProduct, listProducts, removeProduct, getSingleProduct };
