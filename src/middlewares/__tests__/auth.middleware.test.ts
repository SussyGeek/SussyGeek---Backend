import { Request, Response, NextFunction } from "express";
import { handleAuth } from "../auth.middleware";
import SessionRepository from "../../modules/user/repositories/session.repository";
import { ApiError } from "../../errors/ApiError";

// Mock the SessionRepository
jest.mock("../../modules/user/repositories/session.repository");

describe("Auth Middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockRequest = {
            headers: {}
        };
        mockResponse = {
            locals: {
                from: {
                    middlewares: {}
                }
            }
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it("should pass error to next() if no authorization header is provided", async () => {
        await handleAuth(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
        const error = mockNext.mock.calls[0][0] as ApiError;
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe("Session invalid. Please login.");
    });

    it("should pass error to next() if session ID length is not 20", async () => {
        mockRequest.headers = { authorization: "Bearer shortid" };

        await handleAuth(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
        const error = mockNext.mock.calls[0][0] as ApiError;
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe("Session invalid. Please login.");
    });

    it("should pass error to next() if session is invalid (not found in DB)", async () => {
        mockRequest.headers = { authorization: "Bearer 12345678901234567890" };

        // Mock repository to return null
        (SessionRepository.getUsernameAndStateBySID as jest.Mock).mockResolvedValue(null);

        await handleAuth(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(SessionRepository.getUsernameAndStateBySID).toHaveBeenCalledWith("12345678901234567890");
        expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
        const error = mockNext.mock.calls[0][0] as ApiError;
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe("Invalid session");
    });

    it("should attach user details to res.locals and call next() on success", async () => {
        const validSessionId = "12345678901234567890";
        mockRequest.headers = { authorization: `Bearer ${validSessionId}` };

        const mockUserRow = {
            userId: {
                username: "testuser",
                state: "active",
                $id: "user123"
            }
        };

        // Mock repository to return a valid session
        (SessionRepository.getUsernameAndStateBySID as jest.Mock).mockResolvedValue(mockUserRow);

        await handleAuth(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(SessionRepository.getUsernameAndStateBySID).toHaveBeenCalledWith(validSessionId);
        expect(mockResponse.locals?.from.middlewares.handleAuth).toEqual({
            username: "testuser",
            userState: "active",
            sessionId: validSessionId,
            userId: "user123"
        });
        expect(mockNext).toHaveBeenCalledWith(); // Called without errors
    });

    it("should handle unexpected errors and pass them to next()", async () => {
        mockRequest.headers = { authorization: "Bearer 12345678901234567890" };

        const unexpectedError = new Error("Database connection failed");
        (SessionRepository.getUsernameAndStateBySID as jest.Mock).mockRejectedValue(unexpectedError);

        await handleAuth(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
});
