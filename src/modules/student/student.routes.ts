import express from "express";
import validate from "../../middlewares/validation.middleware";
import StudentValidator from "./student.validator";
import { initializeFields } from "../../middlewares/fields.middleware";
import { handleAuth } from "../../middlewares/auth.middleware";
import StudentController from "./student.controller";

const router = express.Router();

router.use(initializeFields);

router.get("/institute/:instituteId/list/regular",
    validate(StudentValidator.listRegularStudents),
    StudentController.listRegularStudents
);
router.get('/list',
    validate(StudentValidator.listStudentsByUserId),
    StudentController.listStudentsByUserIds
);
router.get("/search",
    validate(StudentValidator.listStudentByFullNameInInstitute),
    StudentController.listStudentByFullnameInInstitute
);

router.use(handleAuth);

router.get('/institute/:instituteId/list/frozen',
    validate(StudentValidator.listFrozenStudents),
    StudentController.listFrozenStudents
);

export default router;
