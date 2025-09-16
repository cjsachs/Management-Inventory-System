export type EquipmentStatus =
  | 'available'
  | 'assigned'
  | 'maintenance'
  | 'retired';

export type EquipmentType =
  | 'Laptop'
  | 'Desktop'
  | 'Tablet'
  | 'Phone'
  | 'Keyboard'
  | 'Mouse';

  export type LocationStatus =
  | 'Dugan West'
  | 'Dugan 1280'

export interface Equipment {
  id: string | number;
  assetTag: string;
  type: EquipmentType;
  brand: string;
  model: string;
  processor: string;
  serialNumber: string;
  status: EquipmentStatus;
  assignedTo: string;
  employeeId: string;
  department: string;
  location: string;
  purchaseCost: number;
  notes: string;
}

export interface EquipmentStats {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';
