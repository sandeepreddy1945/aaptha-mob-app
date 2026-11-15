import { getFirestore } from 'firebase/firestore';
import { app } from '../firebaseConfig';

export { app };
export const db = getFirestore(app);
