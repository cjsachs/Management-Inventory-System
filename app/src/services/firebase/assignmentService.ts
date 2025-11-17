import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Assignment } from '../../types/firebase';

class AssignmentService {
  private readonly collectionName = 'assignments';

  // create a new assignment
  async createAssignment(
    assignment: Omit<Assignment, 'id'>,
    performedBy: string,
    performedByName: string
  ): Promise<string> {
    try {
      // Build the document data, excluding undefined fields
      const documentData: any = {
        equipmentId: assignment.equipmentId,
        equipmentAssetTag: assignment.equipmentAssetTag,
        userId: assignment.userId,
        userName: assignment.userName,
        employeeId: assignment.employeeId,
        department: assignment.department,
        assignedDate: assignment.assignedDate || Timestamp.now(),
        status: 'active',
        assignedBy: assignment.assignedBy,
        assignedByName: assignment.assignedByName,
      };

      // Only add optional fields if they exist and are not undefined
      if (assignment.expectedReturnDate) {
        documentData.expectedReturnDate = assignment.expectedReturnDate;
      }
      if (assignment.notes) {
        documentData.notes = assignment.notes;
      }
      if (assignment.actualReturnDate) {
        documentData.actualReturnDate = assignment.actualReturnDate;
      }
      if (assignment.returnedBy) {
        documentData.returnedBy = assignment.returnedBy;
      }
      if (assignment.returnedByName) {
        documentData.returnedByName = assignment.returnedByName;
      }

      const docRef = await addDoc(collection(db, this.collectionName), documentData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  // return equipment for an assignment
  async returnAssignment(
    assignmentId: string,
    returnedBy: string,
    returnedByName: string,
    notes?: string
  ): Promise<void> {
    try {
      const assignmentRef = doc(db, this.collectionName, assignmentId);
      await updateDoc(assignmentRef, {
        status: 'returned',
        returnedBy,
        returnedByName,
        notes: notes || '',
      });
    } catch (error) {
      console.error('Error returning assignment:', error);
      throw error;
    }
  }

  // get active assignments
  subscribeToActiveAssignments(
    onUpdate: (assignments: Assignment[]) => void,
    onError: () => void
  ) {
    const q = query(
      collection(db, this.collectionName),
      where('status', '==', 'active'),
      orderBy('assignedDate', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const assignments: Assignment[] = [];
        snapshot.forEach((doc) => {
          assignments.push({ id: doc.id, ...(doc.data() as Assignment) });
        });
        onUpdate(assignments);
      },
      onError
    );
  }

  // get all assignments
  subscribeToAllAssignments(
    onUpdate: (assignments: Assignment[]) => void,
    onError: () => void
  ) {
    const q = query(
      collection(db, this.collectionName),
      orderBy('assignedDate', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const assignments: Assignment[] = [];
        snapshot.forEach((doc) => {
          assignments.push({ id: doc.id, ...(doc.data() as Assignment) });
        });
        onUpdate(assignments);
      },
      onError
    );
  }

  // get assignments by equipment
  async getAssignmentsByEquipment(equipmentId: string): Promise<Assignment[]> {
    const q = query(
      collection(db, this.collectionName),
      where('equipmentId', '==', equipmentId),
      orderBy('assignedDate', 'desc')
    );

    const snapshot = await getDocs(q);
    const assignments: Assignment[] = [];
    snapshot.forEach((doc) => {
      assignments.push({ id: doc.id, ...(doc.data() as Assignment) });
    });
    return assignments;
  }

  async getAssignmentsByUser(userId: string): Promise<Assignment[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('assignedDate', 'desc')
    );

    const snapshot = await getDocs(q);
    const assignments: Assignment[] = [];
    snapshot.forEach((doc) => {
      assignments.push({ id: doc.id, ...(doc.data() as Assignment) });
    });
    return assignments;
  }

  async isEquipmentAssigned(equipmentId: string): Promise<boolean> {
    const q = query(
      collection(db, this.collectionName),
      where('equipmentId', '==', equipmentId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }
}

export const assignmentService = new AssignmentService();
