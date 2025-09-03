import {
    collection,
    onSnapshot,
} from 'firebase/firestore'

import { db } from '../../config/firebase'
import type { Equipment } from '../../types/equipment'

export const equipmentService = {
    // real-time equipment list
    subscribeToEquipmentList: (callback: (equipment: Equipment[]) => void) => {
        const q = collection(db, 'equipment');
        onSnapshot(q, (snapshot) => {
            const equipment = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Equipment[];
            callback(equipment);
        });
    },
};