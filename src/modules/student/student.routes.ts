import express from "express";
import validate from "../../middlewares/validation.middleware";
import { rateLimit } from "../../middlewares/rateLimit.middleware";
import { RATE_LIMITS } from "../../config/ratelimit";
import StudentValidator from "./student.validator";
import { handleAuth } from "../../middlewares/auth.middleware";
import StudentController from "./student.controller";

const router = express.Router();

router.get("/institute/:instituteId/list/regular",
    rateLimit(RATE_LIMITS.DATA_FETCH),
    validate(StudentValidator.listRegularStudents),
    StudentController.listRegularStudents
);

router.get("/institute/:instituteId/list/sorted",
    rateLimit(RATE_LIMITS.DATA_FETCH),
    validate(StudentValidator.listSortedStudents),
    StudentController.listSortedStudents
);

router.get('/list',
    rateLimit(RATE_LIMITS.DATA_FETCH),
    validate(StudentValidator.listStudentsByUserId),
    StudentController.listStudentsByUserIds
);
router.get("/search",
    rateLimit(RATE_LIMITS.DATA_FETCH),
    validate(StudentValidator.listStudentByFullNameInInstitute),
    StudentController.listStudentByFullnameInInstitute
);

router.use(rateLimit(RATE_LIMITS.HANDLE_AUTH));
router.use(handleAuth);

router.get('/institute/:instituteId/list/frozen',
    rateLimit(RATE_LIMITS.DATA_FETCH),
    validate(StudentValidator.listFrozenStudents),
    StudentController.listFrozenStudents
);

export default router;
