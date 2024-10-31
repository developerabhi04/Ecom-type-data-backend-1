import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";
// import { faker } from "@faker-js/faker";




// Revalidate on New, Update, Delete Product & on New Order
export const getlatestProducts = TryCatch(async (req, res, next) => {
    let products;

    if (myCache.has("latest-products")) {
        products = JSON.parse(myCache.get("latest-products") as string);
    } else {
        products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
        myCache.set("latest-products", JSON.stringify(products));
    }


    return res.status(201).json({
        success: true,
        products,
    })
})


// Revalidate on New, Update, Delete Product & on New Order
export const getAllCategories = TryCatch(async (req, res, next) => {
    let categories;

    if (myCache.has("categories")) {
        categories = JSON.parse(myCache.get("categories")!);
    } else {
        categories = await Product.distinct("category");
        myCache.set("categories", JSON.stringify(categories));
    }


    return res.status(200).json({
        success: true,
        categories,
    })
})


// Revalidate on New, Update, Delete Product & on New Order
export const getAdminProducts = TryCatch(async (req, res, next) => {
    let products;

    if (myCache.has("all-products")) {
        products = JSON.parse(myCache.get("all-products") as string);
    } else {
        products = await Product.find({});

        if (!products) return next(new ErrorHandler("Product Not Found", 404));

        myCache.set("all-products", JSON.stringify(products));
    }

    return res.status(200).json({
        success: true,
        products,
    })
})


// Revalidate on New, Update, Delete Product & on New Order
export const getSingleProduct = TryCatch(async (req, res, next) => {

    let product;
    const id = req.params.id;

    if (myCache.has(`product-${id}`)) {
        product = JSON.parse(myCache.get(`product-${id}`) as string);
    } else {
        product = await Product.findById(id);

        if (!product) return next(new ErrorHandler("Product Not Found", 404));

        myCache.set(`product-${id}`, JSON.stringify(product));

    }


    return res.status(200).json({
        success: true,
        product,
    })
})


// Create or add product
export const newProduct = TryCatch(async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {

    const { name, price, stock, category } = req.body;
    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please Add Photo", 400));

    if (!name || !price || !stock || !category) {

        rm(photo.path, () => {
            console.log("Deleted");
        })

        return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    await Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo?.path,

    });

    invalidatesCache({
        product: true,
        admin: true,
    });

    return res.status(201).json({
        success: true,
        message: "Product Created SuccessFully",
    })
})



export const updateProduct = TryCatch(async (req, res, next) => {

    const { id } = req.params;

    const { name, price, stock, category } = req.body;
    const photo = req.file;
    const product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Invalid Product ID", 404));

    if (photo) {
        rm(product.photo!, () => {
            console.log("old Photo Deleted");
        })
        product.photo = photo.path;
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;

    await product.save();

    invalidatesCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });


    return res.status(200).json({
        success: true,
        message: "Product Updated SuccessFully",
    })
})





export const deleteProduct = TryCatch(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) return next(new ErrorHandler("Product Not Found", 404));


    rm(product.photo!, () => {
        console.log("old Photo Deleted");
    })

    await product.deleteOne();

    invalidatesCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });


    return res.status(200).json({
        success: true,
        message: "Product Deleted SuccessFully",
    });
})





// Get All Product
export const getAllProducts = TryCatch(async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {

    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 6;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    // price: {
    //     $lte: Number(price)
    // },
    // category,

    if (search) {
        baseQuery.name = {
            $regex: search,
            $options: "i",
        }
    }

    if (price) {
        baseQuery.price = {
            $lte: Number(price)
        }
    }

    if (category) {
        baseQuery.category = category;
    }

    // in promise

    const productsPromise = Product.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : - 1 })
        .limit(limit)
        .skip(skip);

    const [products, filteredOnlyproduct] = await Promise.all([
        productsPromise,
        Product.find(baseQuery),
    ])


    // const products = await Product.find(baseQuery)
    //     .sort(sort && { price: sort === "asc" ? 1 : - 1 })
    //     .limit(limit)
    //     .skip(skip);

    // const filteredOnlyproduct = await Product.find(baseQuery);

    const totalPage = Math.ceil(filteredOnlyproduct.length / limit);


    return res.status(200).json({
        success: true,
        products,
        totalPage,
    })
})











// generate rabdom product

// const generateRandomProducts = async (count: number = 10) => {
//     const products = [];

//     for (let i = 0; i < count; i++) {
//         const product = {
//             name: faker.commerce.productName(),
//             photo: "uploads\\6f59f9de-647f-440d-92ab-6b1064505106.jpeg",
//             price: faker.commerce.price({ min: 1500, max: 100000, dec: 0 }),
//             stock: faker.commerce.price({ min: 0, max: 500, dec: 0 }),
//             category: faker.commerce.department(),
//             createdAt: new Date(faker.date.past()),
//             updatedAt: new Date(faker.date.recent()),
//             __v: 0,
//         };

//         products.push(product);
//     }

//     await Product.create(products);

//     console.log({ success: true });

// }

// generateRandomProducts(50)

// delete-product

// const deleteRandomsProducts = async (count: number = 10) => {
//     const products = await Product.find({}).skip(2);

//     for (let i = 0; i < products.length; i++) {
//         const product = products[i];
//         await product.deleteOne();
//     }

//     console.log({ success: true });

// }
// deleteRandomsProducts(30)