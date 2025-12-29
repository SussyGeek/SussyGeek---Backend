import { database } from "../appwrite/instance";
import { appwriteConfig } from "../appwrite/config";
import { Query } from "node-appwrite";
import { randomBytes } from "crypto";
import { ID } from "node-appwrite";

export const createSession = async (
    uid: string | undefined
) => {
    if(!uid){ 
        return {
            success: false, 
            message:"Invalid UID", 
            code: 400
        };
    }

    const loginFound = await sessionExists(uid, 'uid');

    if(loginFound){
         return {
            success: false, 
            code: 403
        };
    }

    let sessionId, exists = true, tries = 2;

    while(exists && tries--){
        sessionId = randomBytes(32).toString('hex');
        exists = await sessionExists(sessionId, 'sessionId');
    }

    if(exists) {
        return {
            success: false,
            message: "Server error.",
            code: 500
        };
    }
    
    const row = await database.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.sessionsTableId,
            rowId: ID.unique(),
            data: {
                uid: uid,
                sessionId: sessionId
            }
        })

    return {
        success: true, 
        sessionId: sessionId, 
        code: 200
    };
}

export const revokeSession = async (
    sessionId: string
) => {
    try {
        const query = await database.deleteRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.sessionsTableId,
            queries: [Query.equal('sessionId', sessionId)]
        });

        if(query.total === 0){
            return {
                success: false, 
                message: "No session found.",
                code: 400
            };
        }

        return {success: true, status: 200};
    } catch (err) {
        return {
            success: false, 
            message: "Server error",
            code: 500
        };
    }
}

export const sessionExists = async (
    id: string,
    col: string
): Promise<boolean> => {
    try {
        const query = await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.sessionsTableId,
            queries: [Query.equal(col, id)]
        });

        if(query.total === 0) return false;
        return true;
    } catch (err){
        console.log(
            // @ts-ignore BAD FIX!
            err?.message ?? err);
        return true;
    }
}

export const createUsername = async (
    username: string
) => {
    try {
        const nameQuery = await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.usersTableId,
            queries: [Query.equal('username', username)]
        });

        if(nameQuery.total !== 0) {
            let userRow = nameQuery.rows[0];
            return {
                success: true,
                uid: userRow.$id,
                code: 200
            }
        }
        
        const row = await database.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.usersTableId,
            rowId: ID.unique(),
            data: {
                username
            },
        });

        return {
            success: true,
            uid: row.$id,
            code: 200
        }
    } catch (err) {
        return {
            success: false,
            code: 500,
            // @ts-ignore
            message: err?.message ?? err
        };
    }
}

export const getUID = async (
    username?: string | null,
    sessionId?: string | null
) => {
    try {
        const queries = [];
        if(username) queries.push(Query.equal('username', username));
        if(sessionId) queries.push(Query.equal('sessionId', sessionId));

        const result = await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig[username ? 'usersTableId' : 'sessionsTableId'],
            queries
        });

        if(result.total > 0){
            return {
                success: true,
                UID: username ? 
                result.rows[0].$id : 
                result.rows[0].uid,
            }
        }
        return {
            success: false
        };
    } catch (err){
        console.log('[getUID]: UID fetch err, ', err);
        return {
            success: false
        }
    }
}

export const getUsername = async ( 
    sessionId: string
) => { 
    const session = await database.listRows({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.sessionsTableId,
        queries: [Query.equal('sessionId', sessionId)]
    });

    if(session.total === 0) return {success: false, code: 403};

    const uid: string = session.rows[0].uid;

    const user = await database.getRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.usersTableId,
        rowId: uid
    });

    return {
        success: user?.username ? true : false,
        user: user?.username,
        code: user?.username ? 200 : 403
    };

}