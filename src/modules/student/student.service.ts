import GeeksForGeeksAPI from "../../api/geeksforgeeks.api";
import { BatchBody } from "../../types/body";
import { StudentRow } from "../../types/models/student";
import InstituteService from "../institute/institute.service";
import StudentRepository from "./student.repository";

const StudentService = {
    addStudents: async (students: Partial<StudentRow>[]) => {
        students.forEach(s => {
                s.name = s.name?.toLowerCase()
                s.username = s.username?.toLowerCase()
            }
        );
        await StudentRepository.addMultiple(students);
        return { succes: true };
    },
    cacheStudentUsernames: async (instituteId: string) => {
        const count = await GeeksForGeeksAPI.getTotalStudentCount(instituteId);
        const students = await GeeksForGeeksAPI.getStudentsByInstitute(instituteId, count);

        const cacheSet = students.map(s => JSON.stringify({ username: s.handle, user_id: s.user_id }));
        // Ordered list maintains handle rather than username 
        // just respecting GFG API conventions.
        const orderedList = students.map(s => JSON.stringify({ handle: s.handle, user_id: s.user_id }));

        await StudentRepository.redisAddUsernamesToInstituteSet(instituteId, cacheSet);
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
    listStudentsByUserIds: async (
        studentIds: string[]
    ) => {
        const { rows } = await StudentRepository.listStudentsByIds(studentIds);
        return { 
            success: true, 
            data: rows 
        };
    },
    listStudentsByFullNameInInstitute: async (
        fullName: string,
        instituteId: string
    ) => {
        const { rows } = await StudentRepository.listByFullNameInInstitute(fullName, instituteId);
        return {
            success: true, 
            data: rows 
        }
    },
    isBatchValid: async (instituteId: string, students: BatchBody[]) => {
        const users = students.map(s => JSON.stringify({ username: s.username, user_id: s.id }));
        const result = await StudentRepository.redisStudentMembershipCheck(instituteId, users);
        return result.every(r => r === 1);
    },
    isSomeStudentRepeated: async (instituteId: string, students: BatchBody[]) => {
        const users = students.map(s => JSON.stringify({ username: s.username, user_id: s.id }));
        const result = await StudentRepository.redisScrappedMembershipCheck(instituteId, users);
        return result.some(r => r === 1);
    }
};

export default StudentService;