import { appwriteConfig } from "../appwrite/config";
import { database } from "../appwrite/instance";
import { Models, Query } from "node-appwrite";
import { omitDBInfo } from "../utils";

export const getMetaCounts = async (
    name: string | null
) => {
    try{
        const queries = name ? 
        [Query.equal('name',name)] :
        null

        const response = await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.metaTableId,
            queries: queries ?? [],
        });

        if(response.rows.length === 0){
            return {
                success: false,
                message: "No data found."
            } 
        } else {
            omitDBInfo(response.rows, false) // keep date
            const data = name ? 
                response.rows[0]?.counter :
                response.rows ;
            return {
                success: true,
                data: response.rows,
            }
        } 
    } catch (err){
        console.log("Institute count fetch err: ", err);
        throw(err); // Problematic
    }
} 


export const updateCounter = async (
    row: "totalScore" | "problemsSolved" | "totalStudents" | "totalInstitutions",
    type: "add" | "subtract",
    amount: number
) => {
    let result: Models.DefaultRow;
    try{
        if(type === "add"){
            result = await database.incrementRowColumn({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.metaTableId,
                rowId: appwriteConfig.rowIds.meta[row],
                column: 'counter',
                value: amount
            }); 
        } else if(type === "subtract") {
            result = await database.decrementRowColumn({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.metaTableId,
                rowId: appwriteConfig.rowIds.meta[row],
                column: 'counter', // column
                value: amount // value
            });
        }

        if(// @ts-ignore // BAD FIX
            result.$id){
            return { 
                success: true
            };
        }

    } catch (err){
        console.log(err) // FIX : GET RID OF THIS IN PROD.
        return {
            success: false,
            code: 500
        };
    }
}