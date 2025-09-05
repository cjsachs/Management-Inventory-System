import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
} from 'firebase/auth';
import { auth, COLLECTIONS, db } from '../../config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { ITStaffUser } from '../../types/firebase';

class AuthService {
  // login (only IT Staff)
  async login(email: string, password: string): Promise<ITStaffUser>{
    try {
      // sign in with firebase auth
      const userCredential = await signInWithEmailAndPassword(auth,email,password);
      const user = userCredential.user;

      // check if user is in IT staff
      const itStaffDoc = await getDoc(doc(db, COLLECTIONS.IT_STAFF, user.uid));

      if (!itStaffDoc.exists()) {
        await signOut(auth);
        throw new Error('Access Denied. IT staff only.');
      }

      const itStaffData = itStaffDoc.data() as ITStaffUser;

      // update last login
      await setDoc(doc(db, COLLECTIONS.IT_STAFF, user.uid), 
        { lastLogin: serverTimestamp(),}, 
        { merge: true }
      );

      return {
        ...itStaffData,
        id: user.uid
      };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code?: unknown }).code === 'string'
      ) {
        const code = (error as { code: string }).code;
        if (code === 'auth/user-not-found') {
          throw new Error('User not found with this email.');
        } else if (code === 'auth/wrong-password') {
          throw new Error('Incorrect password.');
        } else if (code === 'auth/invalid-email') {
          throw new Error('Invalid email address.');
        } else if (code === 'auth/user-disabled') {
          throw new Error('This user account has been disabled.');
        }
      }
      throw error;
    }
  };

  // logout
  async logout(): Promise<void>{
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }; 

  // get current IT staff user
  async getCurrentUser(): Promise<ITStaffUser | null>{
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const itStaffDoc = await getDoc(doc(db, COLLECTIONS.IT_STAFF, user.uid));
      if (!itStaffDoc.exists()) return null;

      const itStaffData = itStaffDoc.data() as ITStaffUser;

      return {
        ...itStaffData,
        id: user.uid
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  };

  // listen to auth state
  onAuthChanged(callback: (user: ITStaffUser | null) => void, errorCallback: (error: Error) => void): Unsubscribe {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const itStaffDoc = await getDoc(doc(db, COLLECTIONS.IT_STAFF, user.uid));
          if (itStaffDoc.exists()) {
            callback({
              ...itStaffDoc.data() as ITStaffUser,
              id: user.uid
            });
          } else {
            // user is not in IT staff, sign out
            await signOut(auth);
            callback(null);
            return;
          }
        } catch (error) {
          console.error('Error getting current user:', error);
          if (errorCallback) errorCallback(error as Error);
          callback(null);
        }
      } else {
        callback(null);
      }

    });
  };
}

export const authService = new AuthService();