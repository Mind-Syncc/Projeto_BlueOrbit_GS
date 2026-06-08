import { getDatabase, ref, push, set, get } from "firebase/database";
import { app } from "./config";

const db = getDatabase(app);

// Criar ocorrência
export const createOccurrence = async (occurrenceData) => {
  try {
    const newOccurrenceRef = push(ref(db, "occurrences"));

    await set(newOccurrenceRef, occurrenceData);

    return {
      success: true,
      id: newOccurrenceRef.key,
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      error,
    };
  }
};

// Buscar ocorrências
export const getOccurrences = async () => {
  try {
    const snapshot = await get(ref(db, "occurrences"));

    if (snapshot.exists()) {
      const data = snapshot.val();

      const formattedData = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      return {
        success: true,
        data: formattedData.reverse(),
      };
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      error,
    };
  }
};
