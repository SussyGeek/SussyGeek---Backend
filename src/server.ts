import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import instituteRoutes from "./routes/instituteRoutes"
import metaRoutes from "./routes/metaRoutes";
import userRoutes from "./routes/userRoutes";
import contributionRoutes from "./routes/contributionRoutes";
import devRoutes from "./routes/dev/devRoutes";

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
app.use('/api/v1/institute', instituteRoutes);
app.use('/api/v1/metadata', metaRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/contribute', contributionRoutes)

// Dev routes
app.use('/api/v1/dev', devRoutes);

app.listen(PORT, () => {
    console.log(`Listening to ${PORT}`)
});