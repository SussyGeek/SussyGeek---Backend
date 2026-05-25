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
    listFrozenStudents: async (instituteId: string) => {
        const raw = await StudentRepository.redisGetOrderedStudentList(instituteId);
        const students = raw.map(entry => JSON.parse(entry));
        return { 
            success: true, 
            data: { students } 
        };
    },
    // TODO: Adapt this function to use
    /*
        SORTING.
    */
    listRegularStudents: async (
        instituteId: string, 
        pageNo: number, 
        pageSize: number = 10
    ) => {
        const pageOffset = pageNo-1;

        const res = await StudentRepository.listStudents(
            instituteId,
            pageOffset,
            pageSize
        );

        return { 
            success: true, 
            data: { students: res.rows } 
        };
    },
    listStudentsByUserId: async (
        studentIds: string[]
    ) => {
        const { rows } = await StudentRepository.listStudentsById(studentIds);
        return { 
            success: true, 
            data: rows 
        };
    },
    isBatchValid: async (instituteId: string, students: BatchBody[]) => {
        const usernames = students.map(s => s.username);
        const result = await StudentRepository.redisStudentMembershipCheck(instituteId, usernames);
        return result.every(r => r === 1);
    }
};

export default StudentService;