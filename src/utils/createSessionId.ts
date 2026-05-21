import { randomBytes } from "crypto";


function createSessionId(bytes: number = 32) {
    return randomBytes(32).toString('hex');
} 

export default createSessionId;