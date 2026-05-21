import { userStateValidityCheck } from "../../data/params";
import { ApiError } from "../../errors/ApiError";
import createSessionId from "../../utils/createSessionId";
import SessionRepository from "./repositories/session.repository";
import UserRepository from "./repositories/user.repository"


const UserService = {
    Login: async (username: string) => {
        const userRes = await UserRepository.findByUsername(username);

        const userRow = (userRes.total > 0 ?
            userRes.rows[0] :
            await UserRepository.createNewUser(username)
        );

        const uid = userRow.$id;
        const existingSessions = (userRes.total > 0 ?
            await UserRepository.listSessionByUID(uid) : // User already exists.
            { total: 0, rows: [] } // We just created the user.
        );

        if (existingSessions.total > 0) throw new ApiError(403, "Username currently occupied.");

        const session = await SessionRepository.createSession(uid);
        await UserRepository.updateUserById(uid, { sessionId: session.$id });

        return { sId: session.$id };
    },
    Logout: async (sessionId: string) => {
        const { $id: userId } = (await SessionRepository.getUIDFromSessionId(sessionId)).userId;
        await SessionRepository.removeSession(sessionId);
        await UserRepository.updateUserById(userId, { sessionId: null });
        return { success: true };
    },
    GetUser: async (sessionId: string) => {
        const session = await SessionRepository.getUsernameAndStateBySID(sessionId);
        if (!session) throw new ApiError(403, "Invalid session");

        return {
            username: session.userId.username,
            isActive: session.userId.state === "active"
        };
    },
    SetInactive: async (sessionId: string) => {
        const { $id: userId } = (await SessionRepository.getUIDFromSessionId(sessionId)).userId;
        await UserRepository.updateActivityById(userId, 'idle');
        return {
            success: true,
            message: "Activity updated"
        };
    },
    UpdateUserState: async (uid: string, state: string) => {
        userStateValidityCheck(state);
        await UserRepository.updateActivityById(uid, state);
        return {
            success: true,
            message: "Activity updated"
        };
    },
    getIdbyUsername: async (username: string) => {
        const result = await UserRepository.getIdByUsername(username);
        return result.rows[0].$id ?? null;
    }
}

export default UserService;