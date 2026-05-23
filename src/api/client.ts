import axios from "axios";
import { ApiError } from "../errors/ApiError";
import { GfgApiClient } from "../types/gfg_api";

const gfgClient = axios.create({
    baseURL: process.env.GEEKSFORGEEKS_BASE_URL,
    timeout: 45000,
    withCredentials: false,
});

gfgClient.interceptors.response.use(
    (res) => res.data,
    (err) => {
        throw new ApiError(500, "GeeksForGeeks server error. Try again later.")
    }
);

export const GfgClient: GfgApiClient = gfgClient;