import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

import { addMessage, getMessages } from "./chat.service";
import UserService from "../user/user.service";

var LAST_USER_REFRESH = Date.now();
var connectedUsers = new Map();

export function initializeChatWebSocket(server: HTTPServer) {

    const wss = new WebSocketServer({
        server,
        path: "/chat"
    });

    wss.on("connection", (socket) => {
        console.log("Some guy connected");
        socket.send(JSON.stringify({
            type: "chat_history",
            messages: getMessages()
        }));


        // Receive messages
        socket.on("message", async (data) => {
            try {
                const payload = JSON.parse(data.toString());
                if (payload.type !== "send_message") {
                    return;
                }
                if (
                    typeof payload.message !== "string" ||
                    payload.message.trim().length === 0 ||
                    payload.id.trim().length === 0 // TODO: Respect ID structure.
                ) {
                    return;
                }

                let username = connectedUsers.get(payload.id);
                if (!username) {
                    username = (await UserService.GetUser(payload.id)).username;
                    connectedUsers.set(payload.id, username);
                }

                const elapsedSinceRefresh = (Date.now() / 1000) - (LAST_USER_REFRESH / 1000);
                if (elapsedSinceRefresh >= 1800) {
                    LAST_USER_REFRESH = Date.now();
                    connectedUsers = new Map();
                }

                const message = await addMessage(
                    username,
                    payload.message.trim()
                );

                // Silently ignore and prevent invalid / offensive messages.
                if (!message) {
                    return;
                }

                // Broadcast
                const response = JSON.stringify({
                    type: "chat_message",
                    message
                });

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(response);
                    }
                });

            } catch (error) {
                console.error("Invalid WebSocket message", error);
            }
        });

        // Disconnect
        socket.on("close", () => {
            console.log("Chat client disconnected");
        });
    });
}