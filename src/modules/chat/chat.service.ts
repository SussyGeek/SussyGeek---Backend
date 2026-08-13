import type { ChatMessage } from "../../types/models/chat";
import path from "node:path"
import { loadBannedWords } from "../../utils/loadBannedWords";

const MAX_MESSAGES = 1000;
const DECRYPTION_SECRET = process.env.BANNED_WORDS_DECRYPTION_KEY;
if (!DECRYPTION_SECRET) {
    throw new Error("Banned word decryption secret not found");
}

const messages: ChatMessage[] = [];
const bannedWords: Promise<Set<string>> = loadBannedWords(
    path.join(process.cwd(), "src", "data", "banned-words.enc"), DECRYPTION_SECRET);

let nextMessageId = 1;

export function getMessages(): ChatMessage[] {
    return messages;
}

export async function addMessage(
    username: string,
    message: string
): Promise<ChatMessage | null> {
    if (message.length > 120) return null;
    const banned = await bannedWords;
    if (message.split(/\s+/).some(word => banned.has(word.toLowerCase())))
        return null;

    const chatMessage: ChatMessage = {
        id: nextMessageId++,
        user: username,
        timestamp: Date.now(),
        message
    };

    messages.push(chatMessage);

    if (messages.length > MAX_MESSAGES) {
        messages.shift();
    }

    return chatMessage;
}