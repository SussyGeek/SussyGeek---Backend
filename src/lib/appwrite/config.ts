import dotenv from "dotenv";
dotenv.config();

export const appwriteConfig = {
  projectId: process.env?.APPWRITE_PROJECT_ID ?? '',
  projectName: process.env?.APPWRITE_PROJECT_NAME ?? '',
  endpoint: process.env?.APPWRITE_ENDPOINT ?? '',
  databaseId: process.env?.APPWRITE_DATABASE_ID ?? '',
  institutionTableId: process.env?.APPWRITE_TABLE_INSTITUTION_ID ?? '',
  studentTableId: process.env?.APPWRITE_TABLE_STUDENT_ID ?? '',
  usersTableId: process.env?.APPWRITE_TABLE_USERS_ID ?? '',
  sessionsTableId: process.env?.APPWRITE_TABLE_SESSIONS_ID ?? '',
  contributionsTableId: process.env?.APPWRITE_TABLE_CONTRIBUTIONS_ID ?? '',
  metaTableId: process.env?.APPWRITE_TABLE_META_ID ?? '',
  apiKey: process.env?.APPWRITE_API_KEY ?? '',
  rowIds: {
    meta: {
      totalScore: process.env?.APPWRITE_ROWS_META_SCORE ?? '',
      totalInstitutions: process.env?.APPWRITE_ROWS_META_INSTITUTIONS ?? '',
      problemsSolved: process.env?.APPWRITE_ROWS_META_SOLVED ?? '',
      totalStudents: process.env?.APPWRITE_ROWS_META_STUDENTS ?? '' 
    }
  }
}