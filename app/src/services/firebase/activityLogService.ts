import { addDoc, collection, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp, where } from "firebase/firestore";
import type { Equipment } from "../../types/equipment";
import type { ActivityLog } from "../../types/firebase";
import { db, COLLECTIONS } from "../../config/firebase";
import type { Unsubscribe } from "firebase/auth";

class ActivityLogService {
    private loggingEnabled: boolean = true;
    private errorCount: number = 0;
    private maxErrors: number = 3;

  // Activity log service methods...
  async logEquipmentAction(
    action: ActivityLog['action'],
    equipment: Equipment | Omit<Equipment, 'id'>,
    userId: string,
    userName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    changes?: Record<string, { from: any; to: any }>,
    details?: string
  ): Promise<void> {
    // skip logging if error threshold exceeded
    if (!this.loggingEnabled) {
        console.warn('Activity logging is disabled due to previous errors.');
        return;
    }

    try {
        const logEntry: Omit<ActivityLog, 'id'> = {
            action,
            entityType: 'equipment',
            entityId: 'id' in equipment ? equipment.id.toString() : 'new',
            entityName: equipment.assetTag,
            performedByName: userName,
            performedBy: userId,
            timestamp: serverTimestamp() as Timestamp,
        };

        if (changes) {
            logEntry.changes = changes;
        }
        if (details) {
            logEntry.details = details;
        }

        console.log('Logging equipment action:', logEntry);
 
        await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), logEntry);
        this.errorCount = 0; // reset error count on successful log
    } catch (error) {
        console.error('Error logging equipment action:', error);
        this.errorCount++;

        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'permission-denied') {
        console.error('Permission denied for activity logging. Check Firebase rules for activityLogs collection.');
        console.error('Make sure the activityLogs collection exists and has proper permissions.');
      } else {
        console.error('Error logging activity:', error);
      }

        if (this.errorCount >= this.maxErrors) {
            this.loggingEnabled = false;
            console.error('Disabling activity logging due to repeated errors.');
        }
    }
}

// re-enable logging (for admin use)
enableLogging(): void {
    this.loggingEnabled = true;
    this.errorCount = 0;
    console.log('Activity logging has been re-enabled.');
}
  
// get activity logs with filters
async getActivityLogs(
    filters?: {
        entityType?: 'equipment' | 'user' | 'assignment';
        entityId?: string;
        userId?: string;
        action?: ActivityLog['action'];
        startDate?: Date;
        endDate?: Date;
        limitCount?: number;
    }
): Promise<ActivityLog[]> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const constraints: any[] = [orderBy('timestamp', 'desc')];
        if (filters) {
            if (filters?.entityType) {
                constraints.push(where('entityType', '==', filters.entityType));
            }
            if (filters?.entityId) {
                constraints.push(where('entityId', '==', filters.entityId));
            }
            if (filters?.userId) {
                constraints.push(where('userId', '==', filters.userId));
            }
            if (filters?.action) {
                constraints.push(where('action', '==', filters.action));
            }
            if (filters?.startDate) {
                constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
            }
            if (filters?.endDate) {
                constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
            }
            if (filters?.limitCount) {
                constraints.push(limit(filters.limitCount));
            } else {
                constraints.push(limit(100)); // default limit
            }

            const q = query(collection(db, COLLECTIONS.ACTIVITY_LOGS), ...constraints);
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as ActivityLog) }));
        }
        // If no filters provided, return empty array
        return [];
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
    }
}

// subscribe to real-time updates
subscribeToActivityLogs(
    callback: (logs: ActivityLog[]) => void,
    limitCount: number = 50
): Unsubscribe {
    const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as ActivityLog) }));
        callback(logs);
    });
}

// get equipment change history
async getEquipmentChangeHistory(
    equipmentId: string): Promise<ActivityLog[]> {
    return this.getActivityLogs({ entityType: 'equipment', entityId: equipmentId, limitCount: 100 });
}

// get user action history
async getUserActionHistory(
    userId: string, limitCount: number = 50): Promise<ActivityLog[]> {
    return this.getActivityLogs({ userId, limitCount });
}

// format log mesage for display
formatLogMessage(log: ActivityLog): string {
    const actionMessages = {
        'added': `Added equipment ${log.entityName}`,
        'updated': `Updated equipment ${log.entityName}`,
        'deleted': `Deleted equipment ${log.entityName}`,
        'assigned': `Assigned equipment ${log.entityName}`,
        'returned': `Returned equipment ${log.entityName}`
    };
    return `${log.performedByName} ${actionMessages[log.action] || log.action}`;
}

// get change summary
// eslint-disable-next-line @typescript-eslint/no-explicit-any
getChangeSummary(changes?: Record<string, { from: any; to: any }>): string {
    if (!changes) return 'No changes detected';

    const summary: string[] = [];
    const fieldLabels: Record<string, string> = {
        status: 'Status',
        assignedTo: 'Assigned To',
        location: 'Location',
        notes: 'Notes',
        purchaseCost: 'Purchase Cost'
    };

    Object.entries(changes).forEach(([field, change]) => {
        const label = fieldLabels[field] || field;
        if (label) {
            summary.push(`${label} changed from "${change.from || 'N/A'}" to "${change.to || 'N/A'}"`);
        }
    });

    return summary.join('\n');
}
}
export const activityLogService = new ActivityLogService();