// services/firebase/processorOverrideService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { COLLECTIONS, db } from '../../config/firebase';
import type { ProcessorOverride } from '../../types/firebase';
import type { Unsubscribe } from 'firebase/auth';

class ProcessorOverrideService {
  // subscribe to real-time updates
  subscribeToOverrides(
    callback: (overrides: ProcessorOverride[]) => void,
    errorCallback?: (error: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.PROCESSOR_OVERRIDES),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const overrides = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ProcessorOverride)
        );
        callback(overrides);
      },
      (error) => {
        console.error('Error fetching processor overrides:', error);
        if (errorCallback) errorCallback(error);
      }
    );
  }

  // add a new override
  async addOverride(
    matchString: string,
    label: string,
    releaseYear: number,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, COLLECTIONS.PROCESSOR_OVERRIDES), {
        matchString: matchString.trim().toUpperCase(),
        label: label.trim(),
        releaseYear,
        createdBy: userId,
        createdByName: userName,
        createdAt: serverTimestamp() as Timestamp,
      });
    } catch (error) {
      console.error('Error adding processor override:', error);
      throw new Error('Failed to add processor override');
    }
  }

  // update an existing override
  async updateOverride(
    id: string,
    updates: Partial<Pick<ProcessorOverride, 'matchString' | 'label' | 'releaseYear'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.PROCESSOR_OVERRIDES, id);
      const cleanedUpdates: any = { ...updates };
      if (cleanedUpdates.matchString) {
        cleanedUpdates.matchString = cleanedUpdates.matchString.trim().toUpperCase();
      }
      await updateDoc(docRef, cleanedUpdates);
    } catch (error) {
      console.error('Error updating processor override:', error);
      throw new Error('Failed to update processor override');
    }
  }

  // delete an override
  async deleteOverride(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.PROCESSOR_OVERRIDES, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting processor override:', error);
      throw new Error('Failed to delete processor override');
    }
  }
}

export const processorOverrideService = new ProcessorOverrideService();