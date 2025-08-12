export type EquipmentStatus =
  | 'available'
  | 'assigned'
  | 'maintenance'
  | 'retired';

export type EquipmentType =
  | 'Laptop'
  | 'Desktop'
  | 'Printer'
  | 'Phone'
  | 'Keyboard'
  | 'Mouse';

export interface Equipment {
  id: number;
  assetTag: string;
  type: EquipmentType;
  brand: string;
  model: string;
  serialNumber: string;
  status: EquipmentStatus;
  assignedTo: string;
  employeeId: string;
  department: string;
  location: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpiry: string;
  notes: string;
}

export interface EquipmentStats {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';
