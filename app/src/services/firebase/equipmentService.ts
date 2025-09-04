import {
    collection,
    onSnapshot,
} from 'firebase/firestore'

import { db } from '../../config/firebase'
import type { Equipment } from '../../types/equipment'
import type { FirebaseEquipment } from '../../types/firebase';

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
            notes: data.notes
        };
    }
    
};