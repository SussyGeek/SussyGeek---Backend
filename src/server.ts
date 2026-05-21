import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import appRoutes from "./routes";
import ErrorHandler from "./middlewares/error.middleware";

dotenv.config();

const PORT = process.env.PORT;

const app = express();

// Configuration
app.use(cookieParser());
app.use(cors(
    {
        origin: process.env.ORIGIN_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
));
app.use(express.json());

// Routes
app.use('/api/v1', appRoutes);

app.use(ErrorHandler);

app.listen(PORT, () => {
    console.log(`Listening to ${PORT}`)
});