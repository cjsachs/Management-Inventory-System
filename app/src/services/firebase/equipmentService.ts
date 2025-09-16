import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { COLLECTIONS, db } from '../../config/firebase';
import type { Equipment, EquipmentStatus } from '../../types/equipment';
import type { FirebaseEquipment } from '../../types/firebase';
import type { Unsubscribe } from 'firebase/auth';

class EquipmentService {
  // convert firestore document to equipment type
  private convertToEquipment(id: string, data: FirebaseEquipment): Equipment {
    return {
      id: id as any,
      assetTag: data.assetTag,
      type: data.type,
      brand: data.brand,
      model: data.model,
      processor: data.processor,
      serialNumber: data.serialNumber,
      status: data.status,
      assignedTo: data.assignedTo,
      employeeId: data.employeeId,
      department: data.department,
      location: data.location,
      purchaseCost: data.purchaseCost,
      notes: data.notes,
    };
  }

  // subscribe to equipment collection changes
  subscribeToEquipment(
    callback: (equipment: Equipment[]) => void,
    errorCallback?: (error: Error) => void
  ): Unsubscribe {
    try {
      const q = query(collection(db, COLLECTIONS.EQUIPMENT));

    return onSnapshot(
      q,
      (querySnapshot) => {
        const equipment: Equipment[] = querySnapshot.docs.map((doc) => {
          return this.convertToEquipment(
            doc.id,
            doc.data() as FirebaseEquipment
          );
        });
        callback(equipment);
      },
      (error: Error) => {
        console.error('Error fetching equipment:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
  } catch (error) {
      console.error('Error setting up equipment subscription:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return () => {};
    }
  }

  // get all equipment (one-time fetch)
  async getAllEquipment(): Promise<Equipment[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.EQUIPMENT),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const equipment: Equipment[] = querySnapshot.docs.map((doc) => {
        return this.convertToEquipment(doc.id, doc.data() as FirebaseEquipment);
      });
      return equipment;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
  }

  // get equipment by status
  async getEquipmentByStatus(status: EquipmentStatus): Promise<Equipment[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.EQUIPMENT),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => 
        this.convertToEquipment(doc.id, doc.data() as FirebaseEquipment)
      );
    } catch (error) {
      console.error('Error fetching equipment by status:', error);
      throw error;
    }
  }
  // get single equipment
  async getEquipmentById(id: string): Promise<Equipment | null> {
    try {
      const docRef = doc(db, COLLECTIONS.EQUIPMENT, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.convertToEquipment(
          docSnap.id,
          docSnap.data() as FirebaseEquipment
        );
      }
      return null;
    } catch (error) {
      console.error('Error fetching equipment by ID:', error);
      throw error;
    }
  }

  // add new equipment
  async addEquipment(equipment: Omit<Equipment, 'id'>, userId: string): Promise<void> {
    try {
      const docData: Omit<FirebaseEquipment, 'id'> = {
        ...equipment,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        createdBy: userId,
        updatedBy: userId,
      };
      const docRef = await addDoc(
        collection(db, COLLECTIONS.EQUIPMENT),
        docData
      );
      return docRef.id as unknown as void;
    } catch (error) {
      console.error('Error adding equipment:', error);
      throw error;
    } 
  }

  // updating equipment
  async updateEquipment(
    id: string,
    updates: Partial<Equipment>,
    userId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.EQUIPMENT, id);

      // remove id from updates if present
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, ...updateData } = updates;

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp() as Timestamp,
        updatedBy: userId,
      });
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  }

  // delete equipment
  async deleteEquipment(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.EQUIPMENT, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  }

  // full-text search with Algolia (placeholder)

  // check if asset tag exists
  async assetTagExists(assetTag: string, excludeId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, COLLECTIONS.EQUIPMENT),
        where('assetTag', '==', assetTag)
      );
      const querySnapshot = await getDocs(q);
      if (excludeId) {
        return querySnapshot.docs.some((doc) => doc.id !== excludeId);
      }
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking asset tag existence:', error);
      throw error;
    }
  }

  // get equipment assigned to a specific employee
  async getEquipmentByEmployee(employeeId: string): Promise<Equipment[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.EQUIPMENT),
        where('employeeId', '==', employeeId),
        where('status', '==', 'assigned')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        this.convertToEquipment(doc.id, doc.data() as FirebaseEquipment)
      );
    } catch (error) {
      console.error('Error fetching equipment by employee ID:', error);
      throw error;
    }
  }
}

export const equipmentService = new EquipmentService();
