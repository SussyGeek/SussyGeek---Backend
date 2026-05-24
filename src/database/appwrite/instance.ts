import { Client, TablesDB } from "node-appwrite";
import { appwriteConfig } from "./config";

const client = new Client()
    .setEndpoint(appwriteConfig?.endpoint ?? '')
    .setProject(appwriteConfig?.projectId ?? '')
    .setKey(appwriteConfig?.apiKey ?? '');

const database = new TablesDB(client);
export { database };