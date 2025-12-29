import { batchDict } from "../data/meta";
import { Institution } from "../types/appwrite";
import { BatchBody, StudentBody } from "../types/body";


export const prepInstitutionObject = (
    name: string,
    slug: string,
    registeredGeeks: number,
    location: {
        city: string,
        state: string,
        country: string
    }
): Institution => (
    {
        name,
        slug,
        city: location?.city ?? '',
        state: location?.state ?? '',
        country: location?.country ?? '',
        score: 0,
        students: registeredGeeks ?? 0,
        scrappedStudents: 0,
        status: "Incomplete"
    }
);

export const omitDBInfo = (
  rows: Array<Record<string, any>>,  // This is stupid fix this later.
  keepDate: boolean // Change name to a more appropriate. We fetching $id too. FIX
) => {

  for (const obj of rows) {
    for (const key in obj) {
      let satisfies = key.startsWith('$') && !(keepDate && (key === '$createdAt' || key === '$id' || key === '$updatedAt'));
      if (satisfies) delete obj[key];
    }
  }
}

export const prepBatchList = (
  students: BatchBody[],
  instituteId: string
): StudentBody[] => {

  let batch: StudentBody[] = [];
  
  for(const student of students){

      let transformedStudent: Partial<StudentBody> = { instituteId };

      for(const [beforeKey, afterKey] of Object.entries(batchDict)){
          transformedStudent[afterKey as keyof StudentBody] = student[beforeKey as keyof BatchBody];
      }

      batch.push(transformedStudent as StudentBody);
  }

  return batch;
}

export const extractUsernames = (
  students: BatchBody[]
) => {
  let usernames = [];

  for(const student of students){
    usernames.push(student.username);
  }
  
  return usernames;
}