import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import { COLLECTIONS, db } from '../../config/firebase';
import type { Equipment } from '../../types/equipment';
import type { FirebaseEquipment } from '../../types/firebase';
import type { Unsubscribe } from 'firebase/auth';

class EquipmentService {
  // convert firestore document to equipment type
  private convertToEquipment(id: string, data: FirebaseEquipment): Equipment {
    return {
      id: parseInt(id) || Date.now(),
      assetTag: data.assetTag,
      type: data.type,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      status: data.status,
      assignedTo: data.assignedTo,
      employeeId: data.employeeId,
      department: data.department,
      location: data.location,
      purchaseCost: data.purchaseCost,
      purchaseDate: data.purchaseDate,
      notes: data.notes,
    };
  }

  // subscribe to equipment collection changes
  subscribeToEquipment(
    callback: (equipment: Equipment[]) => void,
    errorCallback?: (error: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.EQUIPMENT),
      orderBy('createdAt', 'desc')
    );

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
          return this.convertToEquipment(
            doc.id,
            doc.data() as FirebaseEquipment
          );
        });
        return equipment;
    } catch (error) {
        console.error('Error fetching equipment:', error);
        throw error;
    }
}
}

export const equipmentService = new EquipmentService();
