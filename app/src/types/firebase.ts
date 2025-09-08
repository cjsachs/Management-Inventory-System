import type { Timestamp } from "firebase/firestore";
import type { Equipment } from "./equipment";

export interface FirebaseEquipment extends Omit<Equipment, 'id'> {
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string // user ID of creator
  updatedBy: string // user ID of last updater
}

// IT Staff user
export interface ITStaffUser {
    id?: string; // user UID from Firebase Auth
    email: string;
    name: string;
    role: 'admin';
    permissions: ('read' | 'write' | 'delete')[];
    createdAt: Timestamp;
}

// Employee (for assignments)
export interface Employee {
    id?: string;
    employeeId: string;
    name: string;
    email: string;
    department: string;
    phone?: string;
    location?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Activity Log
export interface ActivityLog {
    id?: string;
    action: 'added' | 'updated' | 'deleted' | 'assigned' | 'returned';
    entityType: 'equipment' | 'user' | 'assignment';
    entityId: string; // ID of the equipment/user/assignment
    entityName: string; // for display (e.g. "IT-2025-001")
    performedBy: string; // user ID
    performedByName: string; // user name for display
    timestamp: Timestamp;
    details?: string; // optional details about the action
}

// Assignment record
export interface Assignment {
    id?: string;
    equipmentId: string;
    equipmentAssetTag: string; // for display (e.g. "IT-2025-001")
    userId: string;
    userName: string; // for display
    employeeId: string;
    department: string;
    assignedDate: Timestamp;
    expectedReturnDate?: Timestamp;
    actualReturnDate?: Timestamp;
    status: 'active' | 'returned';
    notes?: string;
    assignedBy: string; // IT staff user ID
    returnedBy?: string; // IT staff user ID who processed return
}

// Auth context type
export interface AuthContextType {
    user: ITStaffUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}