import { ApiError } from "../errors/ApiError";

export const STUDENT_BATCH_SIZE: number = 20;
export const BLOCK = 5;
export const USER_STATES = ['active', 'idle']; // unused. Probably useful in future. [for Users table]

export const userStateValidityCheck = (
    state: string
) => {
    if (!USER_STATES.includes(state))
        throw new ApiError(409, "Invalid user state used");
}

// BLOCK STATES!
export const BLOCK_STATE = {
    FREE: 0,
    ACTIVE: 1,
    COMPLETE: 2
}

export const ID_UNASSIGNED = -1; // for assignedBlock col of contributors table