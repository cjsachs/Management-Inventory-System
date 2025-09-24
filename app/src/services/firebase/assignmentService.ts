import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import type { Assignment } from "../../types/firebase";

class AssignmentService {
    private readonly collectionName = 'assignments';

    // create a new assignment
    async createAssignment(assignment: Assignment): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, this.collectionName), {
                ...assignment,
                assignedDate: Timestamp.now(),
                status: 'active',
            });

            return docRef.id;
        } catch (error) {
            console.error("Error creating assignment:", error);
            throw error;
            }
        }

        // return equipment for an assignment
        async returnAssignment(assignmentId: string, returnedBy: string, returnedByName: string, notes?: string): Promise<void> {
            try {
                const assignmentRef = doc(db, this.collectionName, assignmentId);
                await updateDoc(assignmentRef, {
                    status: 'returned',
                    returnedBy,
                    returnedByName,
                    notes: notes || '',
                });
            } catch (error) {
                console.error("Error returning assignment:", error);
                throw error;
            }
        }

        // get active assignments
        subscribeToActiveAssignments(onUpdate: (assignments: Assignment[]) => void, onError: () => void){
            const q = query(
                collection(db, this.collectionName), 
                where("status", "==", "active"),
                orderBy("assignedDate", "desc")
            );

            return onSnapshot(q, (snapshot) => {
                const assignments: Assignment[] = [];
                snapshot.forEach(doc => {
                    assignments.push({ id: doc.id, ...(doc.data() as Assignment) });
                });
                onUpdate(assignments);
            },
            onError
            );
        }

        // get all assignments
        subscribeToAllAssignments(onUpdate: (assignments: Assignment[]) => void, onError: () => void){
            const q = query(
                collection(db, this.collectionName), 
                orderBy("assignedDate", "desc")
            );

            return onSnapshot(q, (snapshot) => {
                const assignments: Assignment[] = [];
                snapshot.forEach(doc => {
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
                where("equipmentId", "==", equipmentId),
                orderBy("assignedDate", "desc")
            );

            const snapshot = await getDocs(q);
            const assignments: Assignment[] = [];
            snapshot.forEach(doc => {
                assignments.push({ id: doc.id, ...(doc.data() as Assignment) });
            });
            return assignments;
        }

        async getAssignmentsByUser(userId: string): Promise<Assignment[]> {
            const q = query(
                collection(db, this.collectionName), 
                where("userId", "==", userId),
                orderBy("assignedDate", "desc")
            );

            const snapshot = await getDocs(q);
            const assignments: Assignment[] = [];
            snapshot.forEach(doc => {
                assignments.push({ id: doc.id, ...(doc.data() as Assignment) });
            });
            return assignments;
        }

        async isEquipmentAssigned(equipmentId: string): Promise<boolean> {
            const q = query(
                collection(db, this.collectionName), 
                where("equipmentId", "==", equipmentId),
                where("status", "==", "active")
            );

            const snapshot = await getDocs(q);
            return !snapshot.empty;
        }
    }

export const assignmentService = new AssignmentService();