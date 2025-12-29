import axios from "axios";
import { GFGUser } from "../../types/body";



export const getTotalStudentCount = async (
    instituteId: string
) => {
    let id = instituteId;
    
    if(typeof(id) === 'number')
        id = instituteId.toString();

    try{
        const res = await axios.get(`http://practiceapi.geeksforgeeks.org/api/v1/institute/${id}/students/stats?page=1&page_size=1`);
        
        if(!res?.data.count){
            return { success: false, count: 0 };
        }

        return {
            success: true,
            count: res.data.count,
        };
    } catch(err){
        // @ts-ignore
        console.log("[GFG API: getTotalPageCount]: ", err?.message ?? err);
        return { success: false,}
    }    
}

export const getAllUsernames = async (
    instituteId: string,
    count: number | string
) => {
    let no = count;
    
    if(typeof(no) === 'number')
        no = instituteId.toString();

    try{
        const res = await axios.get(`http://practiceapi.geeksforgeeks.org/api/v1/institute/${instituteId}/students/stats?page=1&page_size=${no}`);
        
        if(!res?.data.results)
            return {
                success: false,
                message: "No usernames found"
            };

        const students = res.data.results;

        return {
            success: true,
            code: 200,
            usernames: students.map((s: GFGUser) => s.handle),
        };
    } catch(err){
        // @ts-ignore
        console.log("[GFG API: getTotalPageCount]: ", err?.message ?? err);
        return {
            success: false,
            // @ts-ignore
            message: err?.message ?? "API issues on server end."
        }
    }    
}