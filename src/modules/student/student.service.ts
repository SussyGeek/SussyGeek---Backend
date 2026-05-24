import GeeksForGeeksAPI from "../../api/geeksforgeeks.api";
import { BatchBody } from "../../types/body";
import { StudentRow } from "../../types/models/student";
import InstituteService from "../institute/institute.service";
import StudentRepository from "./student.repository";

const StudentService = {
    addStudents: async (students: Partial<StudentRow>[]) => {
        await StudentRepository.addMultiple(students);
        return { succes: true };
    },
    cacheStudentUsernames: async (instituteId: string) => {
        const count = await GeeksForGeeksAPI.getTotalStudentCount(instituteId);
        const students = await GeeksForGeeksAPI.getStudentsByInstitute(instituteId, count);

        const usernames = students.map(s => s.handle);
        const orderedList = students.map(s =>
            JSON.stringify({ handle: s.handle, user_id: s.user_id })
        );

        await StudentRepository.redisAddUsernamesToInstituteSet(instituteId, usernames);
        await StudentRepository.redisCacheOrderedStudentList(instituteId, orderedList);
        const { institute } = await InstituteService.updateUserCacheStatus(instituteId, true);
        return { success: true, institute };
    },
    getOrderedStudentList: async (instituteId: string) => {
        const raw = await StudentRepository.redisGetOrderedStudentList(instituteId);
        return raw.map(entry => JSON.parse(entry));
    },
    isBatchValid: async (instituteId: string, students: BatchBody[]) => {
        const usernames = students.map(s => s.username);
        const result = await StudentRepository.redisStudentMembershipCheck(instituteId, usernames);
        return result.every(r => r === 1);
    }
};

export default StudentService;