import { batchDict } from "../data/meta";
import { BatchBody, StudentBody } from "../types/body";
import { StudentRow } from "../types/models/student";
import { RedisHashObjectType } from "../types/repo";
export const prepBatchList = (
  students: BatchBody[],
  instituteId: string
): StudentBody[] => {

  let batch: StudentBody[] = [];

  for (const student of students) {

    let transformedStudent: Partial<StudentBody> = { instituteId };

    for (const [beforeKey, afterKey] of Object.entries(batchDict)) {
      transformedStudent[afterKey as keyof StudentBody] = student[beforeKey as keyof BatchBody] as any;
    }

    batch.push(transformedStudent as StudentBody);
  }

  return batch;
}

export const aggregateScore = (batch: StudentBody[]) => {
  const studentRows: Partial<StudentRow>[] = [];
  const scoreArr: RedisHashObjectType[] = [];
  const streakArr: RedisHashObjectType[] = [];
  const solvedArr: RedisHashObjectType[] = [];

  const hashData: Record<string, string> = {};

  batch.forEach(student => {
    studentRows.push({
      $id: student.$id,
      instituteId: student.instituteId,
      branch: student.branch ?? null,
      username: student.username,
      name: student.name
    });

    const stats = JSON.stringify({
      score: student.score,
      solved: student.solved,
      streak: student.streak
    });

    hashData[student.username] = stats;

    scoreArr.push({ score: student.score, value: student.username });
    streakArr.push({ score: student.streak, value: student.username });
    solvedArr.push({ score: student.solved, value: student.username });
  });

  return {
    rows: studentRows,
    hashScores: hashData,
    counterArrays: {
      scoreArr,
      streakArr,
      solvedArr
    }
  }
}