import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const authService = {
  // login (only IT Staff)
  login: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // check if user is in IT Staff
    const itStaffDoc = await getDoc(
      doc(db, 'itStaff', userCredential.user.uid)
    );
    if (!itStaffDoc.exists()) {
      await signOut(auth);
      throw new Error('Access Denied. IT staff only.');
    }

    return userCredential.user;
  },

  // logout
  logout: async () => {
    await signOut(auth);
  },

  // listen to auth state
  onAuthChanged: (callback: (user: any) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};
