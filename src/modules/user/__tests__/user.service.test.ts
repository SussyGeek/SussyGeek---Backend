import UserService from "../user.service";
import UserRepository from "../repositories/user.repository";
import SessionRepository from "../repositories/session.repository";
import { ApiError } from "../../../errors/ApiError";
import { userStateValidityCheck } from "../../../data/params";

// Mock the repositories and external dependencies
jest.mock("../repositories/user.repository");
jest.mock("../repositories/session.repository");
jest.mock("../../../data/params", () => ({
    userStateValidityCheck: jest.fn()
}));

describe("User Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Login", () => {
        it("should successfully log in an existing user without an active session", async () => {
            const username = "testuser";
            const mockUserRow = { $id: "user123", sessionId: null };
            const mockSession = { $id: "session123" };

            (UserRepository.findByUsername as jest.Mock).mockResolvedValue({
                total: 1,
                rows: [mockUserRow]
            });
            (SessionRepository.createSession as jest.Mock).mockResolvedValue(mockSession);

            const result = await UserService.Login(username);

            expect(UserRepository.findByUsername).toHaveBeenCalledWith(username);
            expect(UserRepository.createNewUser).not.toHaveBeenCalled();
            expect(SessionRepository.createSession).toHaveBeenCalledWith("user123");
            expect(UserRepository.updateUserById).toHaveBeenCalledWith("user123", { sessionId: "session123" });
            expect(result).toEqual({ sId: "session123" });
        });

        it("should create a new user and log them in if they do not exist", async () => {
            const username = "newuser";
            const mockNewUser = { $id: "user456", sessionId: null };
            const mockSession = { $id: "session456" };

            (UserRepository.findByUsername as jest.Mock).mockResolvedValue({ total: 0, rows: [] });
            (UserRepository.createNewUser as jest.Mock).mockResolvedValue(mockNewUser);
            (SessionRepository.createSession as jest.Mock).mockResolvedValue(mockSession);

            const result = await UserService.Login(username);

            expect(UserRepository.findByUsername).toHaveBeenCalledWith(username);
            expect(UserRepository.createNewUser).toHaveBeenCalledWith(username);
            expect(SessionRepository.createSession).toHaveBeenCalledWith("user456");
            expect(result).toEqual({ sId: "session456" });
        });

        it("should throw an ApiError if the user already has an active session", async () => {
            const username = "activeuser";
            const mockUserRow = { $id: "user789", sessionId: "existingSession123" };

            (UserRepository.findByUsername as jest.Mock).mockResolvedValue({
                total: 1,
                rows: [mockUserRow]
            });

            await expect(UserService.Login(username)).rejects.toThrow(ApiError);
            await expect(UserService.Login(username)).rejects.toMatchObject({
                statusCode: 403,
                message: "Username currently in use."
            });
            expect(SessionRepository.createSession).not.toHaveBeenCalled();
        });
    });

    describe("Logout", () => {
        it("should remove the session and update the user's sessionId to null", async () => {
            const sessionId = "session123";
            const mockUserId = "user123";

            (SessionRepository.getUIDFromSessionId as jest.Mock).mockResolvedValue({ userId: { $id: mockUserId } });

            const result = await UserService.Logout(sessionId);

            expect(SessionRepository.getUIDFromSessionId).toHaveBeenCalledWith(sessionId);
            expect(SessionRepository.removeSession).toHaveBeenCalledWith(sessionId);
            expect(UserRepository.updateUserById).toHaveBeenCalledWith(mockUserId, { sessionId: null });
            expect(result).toEqual({ success: true });
        });
    });

    describe("GetUser", () => {
        it("should return the username and active state for a valid session", async () => {
            const sessionId = "validSession";
            (SessionRepository.getUsernameAndStateBySID as jest.Mock).mockResolvedValue({
                userId: { username: "testuser", state: "active" }
            });

            const result = await UserService.GetUser(sessionId);

            expect(result).toEqual({ username: "testuser", isActive: true });
        });

        it("should return the username and inactive state if user is idle", async () => {
            const sessionId = "validSession";
            (SessionRepository.getUsernameAndStateBySID as jest.Mock).mockResolvedValue({
                userId: { username: "testuser", state: "idle" }
            });

            const result = await UserService.GetUser(sessionId);

            expect(result).toEqual({ username: "testuser", isActive: false });
        });

        it("should throw an ApiError if the session is invalid", async () => {
            const sessionId = "invalidSession";
            (SessionRepository.getUsernameAndStateBySID as jest.Mock).mockResolvedValue(null);

            await expect(UserService.GetUser(sessionId)).rejects.toThrow(ApiError);
            await expect(UserService.GetUser(sessionId)).rejects.toMatchObject({
                statusCode: 403,
                message: "Invalid session"
            });
        });
    });

    describe("SetInactive", () => {
        it("should set the user state to 'idle' based on their session", async () => {
            const sessionId = "session123";
            const mockUserId = "user123";

            (SessionRepository.getUIDFromSessionId as jest.Mock).mockResolvedValue({ userId: { $id: mockUserId } });

            const result = await UserService.SetInactive(sessionId);

            expect(SessionRepository.getUIDFromSessionId).toHaveBeenCalledWith(sessionId);
            expect(UserRepository.updateActivityById).toHaveBeenCalledWith(mockUserId, 'idle');
            expect(result).toEqual({ success: true, message: "Activity updated" });
        });
    });

    describe("UpdateUserState", () => {
        it("should update the user state and validate the state string", async () => {
            const uid = "user123";
            const state = "active";

            const result = await UserService.UpdateUserState(uid, state);

            expect(userStateValidityCheck).toHaveBeenCalledWith(state);
            expect(UserRepository.updateActivityById).toHaveBeenCalledWith(uid, state);
            expect(result).toEqual({ success: true, message: "Activity updated" });
        });
    });

    describe("getIdbyUsername", () => {
        it("should return the user's ID by their username", async () => {
            const username = "testuser";
            (UserRepository.getIdByUsername as jest.Mock).mockResolvedValue({
                rows: [{ $id: "user123" }]
            });

            const result = await UserService.getIdbyUsername(username);

            expect(UserRepository.getIdByUsername).toHaveBeenCalledWith(username);
            expect(result).toBe("user123");
        });

        it("should return null if ID is missing in the result", async () => {
            const username = "unknownuser";
            (UserRepository.getIdByUsername as jest.Mock).mockResolvedValue({
                rows: [{}] // Mocking missing $id
            });

            const result = await UserService.getIdbyUsername(username);

            expect(result).toBeNull();
        });
    });
});
