import GeeksForGeeksAPI from "../../api/geeksforgeeks.api";
import { BatchBody } from "../../types/body";
import { StudentRow } from "../../types/models/student";
import StudentRepository from "./student.repository";

const StudentService = {
    addStudents: async (students: Partial<StudentRow>[]) => {
        await StudentRepository.addMultiple(students);
        return { succes: true };
    },
    cacheStudentUsernames: async (instituteId: string) => {
        const count = await GeeksForGeeksAPI.getTotalStudentCount(instituteId);
        const usernames = await GeeksForGeeksAPI.getUsernamesByInstitute(instituteId, count);

        await StudentRepository.redisAddUsernamesToInstituteSet(instituteId, usernames);
        return { success: true };
    },
    isBatchValid: async (instituteId: string, students: BatchBody[]) => {
        const usernames = students.map(s => s.username);
        const result = await StudentRepository.redisStudentMembershipCheck(instituteId, usernames);
        return result.every(r => r === 1);
    }
};

export default StudentService;