import { batchDict } from "../data/meta";
import { Institution } from "../types/appwrite";
import { BatchBody, StudentBody } from "../types/body";


// FIX!
export const prepInstitutionObject = (
    name: string,
    slug: string,
    registeredGeeks: number,
    location: {
        city: string,
        state: string,
        country: string
    }
): Partial<Institution> => (
    {
        name,
        slug,
        city: location?.city ?? '',
        state: location?.state ?? '',
        country: location?.country ?? '',
        score: 0,
        students: registeredGeeks ?? 0,
        scrappedStudents: 0,
        status: "Incomplete",
    }
);

export const SECONDSFOR = {
  HalfHour: 1800,
  Hour: 3600
};

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

type errorInstanceType = {
  success: false,
  code: number,
  message: string
};

export const handleError = (
  source: string,
  code: number,
  dataObject: string
): errorInstanceType => {
  
  let message = code === 404 ?
    `${dataObject} not found.` :
    'Server error';

  message = code === 409 ?
    `High contention. Try again.` :
    'Server error';

  console.log(`[${source}]: ${message}`);
  return {
    success: false,
    code,
    message,
  };
}

export const sleep = (s: number) => new Promise<void>(resolve => setTimeout(resolve, s * 1000));