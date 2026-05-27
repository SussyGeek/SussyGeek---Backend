import { ID, Models, Query } from "node-appwrite";
import { appwriteConfig } from "../../../database/appwrite/config"
import { database } from "../../../database/appwrite/instance"
import { ApiError } from "../../../errors/ApiError";
import { SessionRow } from "../../../types/models/session";



const SessionRepository = {
    getSessionById: async (sId: string) => {
        try {
            const res = await database.getRow({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.sessionsTableId,
                rowId: sId
            });
            return res;
        } catch (err) {
            return null;
        }
    },
    getUsernameAndStateBySID: async (sId: string) => {
        try {
            return await database.getRow({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.sessionsTableId,
                rowId: sId,
                queries: [Query.select(['userId.username', 'userId.state'])]
            });
        } catch (err) {
            return null;
        }
    },
    createSession: async (userId: string): Promise<SessionRow> => {
        return await database.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.sessionsTableId,
            rowId: ID.unique(),
            data: {
                userId: userId,
            }
        });
    },
    removeSession: async (sessionId: string) => {
        try {
            const res = database.deleteRow({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.sessionsTableId,
                rowId: sessionId
            });
        } catch (err) {
            // TODO: Decide on this in future. POSSIBLY WILL LEAD TO BUG.
            // BUG PRONE if application scaled.
            // Most likely scenario: SessionId non existant, SO EXCUSED.
            return {};
        }
    },
    getUIDFromSessionId: async (sessionId: string) => {
        try {
            return await database.getRow({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.sessionsTableId,
                rowId: sessionId,
                queries: [Query.select(['userId.$id'])]
            });
        } catch (err) {
            throw new ApiError(403, "Invalid session id");
        }
    }
}

export default SessionRepository;