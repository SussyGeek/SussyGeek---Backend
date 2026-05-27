import { ID, Models, Query } from "node-appwrite";
import { appwriteConfig } from "../../../database/appwrite/config";
import { database } from "../../../database/appwrite/instance";
import { UserRow } from "../../../types/models/user";


const UserRepository = {
    findByUsername: async (username: string): Promise<Models.RowList<UserRow>> => {
        return await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.usersTableId,
            queries: [
                Query.equal('username', username),
                Query.limit(1)
            ]
        });
    },
    getIdByUsername: async (username: string) => {
        return await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.usersTableId,
            queries: [
                Query.equal('username', username),
                Query.select(['$id']),
                Query.limit(1)
            ]
        });
    },
    listSessionByUID: async (uid: string) => {
        return await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.usersTableId,
            queries: [Query.equal('sessionId', uid)]
        });
    },
    findById: async (uid: string) => {
        return await database.getRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.usersTableId,
            rowId: uid,
        });
    },
    createNewUser: async (username: string): Promise<UserRow> => {
        return await database.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.usersTableId,
            rowId: ID.unique(),
            data: { username }
        });
    },
    updateActivityById: async (uid: string, state: string) => {
        return await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.usersTableId,
            rowId: uid,
            data: { state }
        });
    },
    updateUserById: async (uid: string, data: any) => {
        return await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.usersTableId,
            rowId: uid,
            data
        });
    }
};

export default UserRepository;