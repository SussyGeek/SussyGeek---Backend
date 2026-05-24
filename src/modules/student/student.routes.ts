import express from "express";
import validate from "../../middlewares/validation.middleware";
import StudentValidator from "./student.validator";
import { initializeFields } from "../../middlewares/fields.middleware";
import { handleAuth } from "../../middlewares/auth.middleware";
import StudentController from "./student.controller";

const router = express.Router();

router.use(initializeFields);
router.use(handleAuth);

router.get('/:instituteId/list',
    validate(StudentValidator.getStudentList),
    StudentController.getStudentList
);

export default router;
