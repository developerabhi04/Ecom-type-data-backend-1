import express from 'express';
import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
import NodeCache from 'node-cache';
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from 'stripe';
import cors from "cors";


// Importing Routes
import userRoute from './routes/user.js';
import productRoute from './routes/product.js';
import orderRoute from './routes/order.js';
import paymentRoute from './routes/payment.js';
import dashboardRoute from './routes/statistics.js';

config({
    path: "./.env"
})

const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";


// Database
connectDB(mongoURI);


export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());


app.get("/", (req, res) => {
    res.send("API working Fine")
})

// Using Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);


app.use("/uploads", express.static("uploads"));

// Errorhandling midddleware
app.use(errorMiddleware);


app.listen(PORT, () => {
    console.log(`Server is working on ${PORT}`);
})