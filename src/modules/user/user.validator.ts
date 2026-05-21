import { z } from "zod";

const UserValidator = {
    Login: {
        body: z.object({
            username: z.string().
                min(1, "Username unacceptable").
                max(24, "Username can't exceed 24 characters.")
                .nonoptional()
        })
    },
}

export default UserValidator;