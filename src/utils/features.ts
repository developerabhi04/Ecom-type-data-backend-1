import mongoose, { Document } from "mongoose";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";

export const connectDB = (uri: string) => {
    mongoose.connect(uri, {
        dbName: "Ecommerceeeee"
    }).then((c) => console.log(`DB Connected to ${c.connection.host}`))
        .catch((e) => console.log(e));
}


export const invalidatesCache = ({ product, order, admin, userId, orderId, productId }: InvalidateCacheProps) => {
    if (product) {
        const productKeys: string[] = [
            "latest-products",
            "categories",
            "all-products",
            `product-${productId}`
        ];
        // `product-${id}`
        // const products = await Product.find({}).select("_id");

        // products.forEach((i) => {
        //     // const id = i._id;
        //     // `product-${i.id}`
        //     productKeys.push(`product-${i.id}`);
        // })

        if (typeof productId === "string") {
            productKeys.push(`product-${productId}`);
        }

        //if array


        myCache.del(productKeys);
    }

    if (order) {
        const ordersKeys: string[] = [
            "all-orders",
            `my-orders-${userId}`,
            `order-${orderId}`,
        ];
        myCache.del(ordersKeys);
    }

    if (admin) {
        myCache.del([
            "admin-stats",
            "admin-pie-charts",
            "admin-bar-charts",
            "admin-line-charts",
        ]);
    }

};


export const reducerStock = async (orderItems: OrderItemType[]) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);

        if (!product) throw new Error("Product Not Found");
        product.stock -= order.quantity;

        await product.save();
    }
}

// export const reducerStock = async (orderItems: OrderItemType[]) => {
//     for (let i = 0; i < orderItems.length; i++) {
//         const order = orderItems[i];
//         const product = await Product.findById(order.productId);

//         if (!product) throw new Error("Product Not Found");

//         // Check if stock is sufficient
//         if (product.stock < order.quantity) {
//             throw new Error(`Not enough stock for product: ${product.name}`);
//         }

//         // Decrease the stock but prevent it from going below zero
//         product.stock = Math.max(0, product.stock - order.quantity);

//         await product.save();
//     }
// };



export const calculatePercentage = (thisMonth: number, lastMonth: number) => {

    if (lastMonth === 0) {
        return thisMonth * 100;
    }

    const percent = (thisMonth / lastMonth) * 100;
    return Number(percent.toFixed(0));


}



export const getCategories = async ({ categories, productsCount }: { categories: string[], productsCount: number; }) => {

    const categoriesCountPromise = categories.map((category) => (
        Product.countDocuments({ category }))
    )
    const categoriesCount = await Promise.all(categoriesCountPromise);

    // const categoriesCount = await Promise.all(
    //     categories.map((category) => Product.countDocuments({ category }))
    // )

    const categoryCount: Record<string, number>[] = [];

    categories.forEach((category, i) => {
        categoryCount.push({
            [category]: Math.round((categoriesCount[i] / productsCount) * 100),
        })
    })

    return categoryCount;
}


interface MyDocument extends Document {
    createdAt: Date;
    discount?: number;
    total?: number;
}

type FuncProps = {
    length: number;
    docArr: MyDocument[];
    today: Date;
    property?: "discount" | "total";
}
// 
export const getChartData = ({ length, docArr, today, property, }: FuncProps) => {
    // const today = new Date();
    const data: number[] = new Array(length).fill(0);

    docArr.forEach((i) => {
        const creationDate = i.createdAt;
        const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;


        if (monthDiff < length) {
            if (property) {
                data[length - monthDiff - 1] += i[property]!;
            } else {
                data[length - monthDiff - 1] += 1;
            }
        }
    });

    return data;
}



// if (monthDiff < length) {
//     if (property) {
//         data[length - monthDiff - 1] += i[property]!;
//     } else {
//         data[length - monthDiff - 1] += 1;
//     }
// }