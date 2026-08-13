import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import appRoutes from "./routes";
import ErrorHandler from "./middlewares/error.middleware";

import { initializeChatWebSocket } from "./modules/chat/chat.websocket";

dotenv.config();

const PORT = process.env.PORT;

const app = express();

// Configuration
app.set('trust proxy', 1);
const allowedOrigins = [
    process.env.ORIGIN_URL,
    "https://www.geeksforgeeks.org",
    "https://practiceapi.geeksforgeeks.org"
].filter(Boolean);

app.use(cors(
    {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
));
app.use(express.json());

// Routes
app.use('/api/v1', appRoutes);

app.use(ErrorHandler);

const server = http.createServer(app);
initializeChatWebSocket(server);

server.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});