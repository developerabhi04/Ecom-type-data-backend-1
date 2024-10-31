import express from "express";
import { deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getlatestProducts, getSingleProduct, newProduct, updateProduct } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";
import { adminOnly } from "../middlewares/auth.js";

const router = express.Router();


// To Create New Product
router.post("/new", adminOnly, singleUpload, newProduct);

// To get All Products with filters
router.get("/all", getAllProducts);

// To get Last 10 Products
router.get("/latest", getlatestProducts);

// To get all unique Categories
router.get("/categories", getAllCategories);

// To get all Products
router.get("/admin-products", adminOnly, getAdminProducts);


router.route("/:id")
    .get(getSingleProduct)
    .put(adminOnly, singleUpload, updateProduct)
    .delete(adminOnly, deleteProduct)







export default router;