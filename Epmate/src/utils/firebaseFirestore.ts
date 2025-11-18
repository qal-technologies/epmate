// utils/firebase/firebaseFirestore.ts
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

export const db = firestore();

type CollectionName = string;

// Constrain T to Firestore-compatible data
type FirestoreData = FirebaseFirestoreTypes.DocumentData;

const firebaseFirestore = {
  addDocument: async <T extends FirestoreData>(
    collection: CollectionName,
    data: T,
  ): Promise<FirebaseFirestoreTypes.DocumentReference<T>> => {
    // Use .add(data) returns DocumentReference<DocumentData>
    const docRef = await firestore().collection(collection).add(data);
    // Cast to DocumentReference<T> is safe if data matches T
    return docRef as FirebaseFirestoreTypes.DocumentReference<T>;
  },

  getDocument: async <T extends FirestoreData>(
    collection: CollectionName,
    docId: string,
  ): Promise<T | null> => {
    const doc = await firestore().collection(collection).doc(docId).get();
    // doc.exists is a boolean, not a function, in this API
    if (doc.exists() || doc.exists) {
      return doc.data() as T;
    } else {
      return null;
    }
  },

  updateDocument: async (
    collection: CollectionName,
    docId: string,
    data: Partial<FirestoreData>,
  ): Promise<void> => {
    await firestore().collection(collection).doc(docId).update(data);
  },

  deleteDocument: async (
    collection: CollectionName,
    docId: string,
  ): Promise<void> => {
    await firestore().collection(collection).doc(docId).delete();
  },

  getCollection: async <T extends FirestoreData>(
    collection: CollectionName,
  ): Promise<T[]> => {
    const snapshot = await firestore().collection(collection).get();
    return snapshot.docs.map(doc => doc.data() as T);
  },
};

export { firebaseFirestore };
