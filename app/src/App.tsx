import { useMemo, useState, useEffect, useRef } from 'react';
import './App.css';
import type {
  Equipment,
  EquipmentStats,
  EquipmentStatus,
  NotificationType,
} from './types/equipment';
import Header from './components/Header';
import EquipmentList from './components/EquipmentList';
import AddEquipmentForm from './components/AddEquipmentForm';
import Notification from './components/Notification';
import TabNavigation from './components/TabNavigation';
import SearchFilter from './components/SearchFilter';
import EditEquipmentModal from './components/EditEquipmentModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { equipmentService } from './services/firebase/equipmentService';
import { Loader, Upload, Download } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { activityLogService } from './services/firebase/activityLogService';
import AssignmentList from './components/AssignmentList';
import type { Assignment } from './types/firebase';
import { Timestamp } from 'firebase/firestore';
import { assignmentService } from './services/firebase/assignmentService';
import AssignmentModel from './components/AssignmentModel';
import BulkImportModal from './components/BulkImportModal';
import * as XLSX from 'xlsx';


const App = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    'inventory' | 'add' | 'assignments'
  >('inventory');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>(
    'all'
  );
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null
  );
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(
    null
  );
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: NotificationType;
  }>({
    show: false,
    message: '',
    type: 'success',
  });
  const [assigningEquipment, setAssigningEquipment] =
    useState<Equipment | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // subscribe to equipment changes when user is authenticated
  useEffect(() => {
    if (!user) {
      setLoadingUser(false);
      return;
    }

    setLoadingUser(true);

    // subscribe to equipment updates
    const unsubscribeEquipment = equipmentService.subscribeToEquipment(
      (equipmentList) => {
        setEquipment(equipmentList);
        setLoadingUser(false);
      },
      (error) => {
        console.error('Error fetching equipment:', error);
        showNotification('Error fetching equipment data', 'error');
        setLoadingUser(false);
      }
    );

    // cleanup subscription on unmount
    return () => {
      unsubscribeEquipment();
    };
  }, [user]);

  // Calculate statistics for the header
  const calculateStats = (equipmentList: Equipment[]): EquipmentStats => {
    return {
      total: equipmentList.length,
      available: equipmentList.filter((item) => item.status === 'available').length,
      assigned: equipmentList.filter((item) => item.status === 'assigned').length,
      maintenance: equipmentList.filter((item) => item.status === 'maintenance').length,
      retired: equipmentList.filter((item) => item.status === 'retired').length,
      sold: equipmentList.filter((item) => item.status === 'sold').length,
    };
  };

  // filter equipment by search term and status
  const filteredEquipment = useMemo(() => {
    // Sort equipment by asset tag in descending order
    setEquipment(
      equipment.sort((a, b) => {
        // Extract the last numeric part after the last dash
        const numA = parseInt(a.assetTag.split('-').pop() ?? '', 10);
        const numB = parseInt(b.assetTag.split('-').pop() ?? '', 10);

        // Descending order
        return numB - numA;
      })
    );
    return equipment.filter((item) => {
      // search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        item.assetTag.toLowerCase().includes(searchLower) ||
        item.serialNumber.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower) ||
        item.processor.toLowerCase().includes(searchLower) ||
        item.assignedTo.toLowerCase().includes(searchLower) ||
        item.department.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower);

      // status filter
      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [equipment, searchTerm, statusFilter]);

  // handler for adding equipment
  const handleAddEquipment = async (newEquipment: Omit<Equipment, 'id'>) => {
    if (!user) return false;

    try {
      // check if asset tag already exists
      const exists = await equipmentService.assetTagExists(
        newEquipment.assetTag
      );
      if (exists) {
        showNotification('Asset tag already exists', 'error');
        return false;
      }

      // add equipment to Firebase
      await equipmentService.addEquipment(newEquipment, user.id!);

      // log activity
      await activityLogService.logEquipmentAction(
        'added',
        { ...newEquipment },
        user.id!,
        user.name,
        undefined,
        `Added ${newEquipment.type}: ${newEquipment.brand} ${newEquipment.model}`
      );

      showNotification('Equipment added successfully!', 'success');
      setActiveTab('inventory');
      return true;
    } catch (error: any) {
      console.error('Error adding equipment:', error);
      showNotification(error.message || 'Failed to add equipment', 'error');
      return false;
    }
  };

  // Handle editing equipment
  const handleEditEquipment = async (
    updatedEquipment: Equipment
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('Updating equipment:', updatedEquipment);
      // Find original equipment for comparison
      const original = equipment.find((e) => e.id === updatedEquipment.id);
      if (!original) {
        console.error('Original equipment not found');
        return false;
      }

      // Track changes
      const changes: Record<string, any> = {};
      Object.keys(updatedEquipment).forEach((key) => {
        if (
          original[key as keyof Equipment] !==
          updatedEquipment[key as keyof Equipment]
        ) {
          changes[key] = {
            from: original[key as keyof Equipment],
            to: updatedEquipment[key as keyof Equipment],
          };
        }
      });

      console.log('Changes detected:', changes);

      // convert id to string for Firebase
      const equipmentId =
        typeof updatedEquipment.id === 'number'
          ? updatedEquipment.id.toString()
          : updatedEquipment.id;

      // Update in Firebase
      await equipmentService.updateEquipment(
        equipmentId,
        updatedEquipment,
        user.id!
      );

      // Log activity
      await activityLogService.logEquipmentAction(
        'updated',
        updatedEquipment,
        user.id!,
        user.name,
        changes,
        `Updated equipment details`
      );

      showNotification('Equipment updated successfully!', 'success');
      setEditingEquipment(null);
      return true;
    } catch (error: any) {
      console.error('Error updating equipment:', error);
      showNotification(error.message || 'Failed to update equipment', 'error');
      return false;
    }
  };

  // Add the handler for creating assignments
  const handleAssignEquipment = async (assignmentData: {
    userId: string;
    userName: string;
    employeeId: string;
    department: string;
    expectedReturnDate?: Date;
    notes?: string;
  }): Promise<boolean> => {
    if (!user || !assigningEquipment) return false;

    try {
      // Create the assignment in Firebase
      await assignmentService.createAssignment({
        equipmentId: assigningEquipment.id.toString(),
        equipmentAssetTag: assigningEquipment.assetTag,
        userId: assignmentData.userId,
        userName: assignmentData.userName,
        employeeId: assignmentData.employeeId,
        department: assignmentData.department,
        assignedDate: Timestamp.now(),
        expectedReturnDate: assignmentData.expectedReturnDate
          ? Timestamp.fromDate(assignmentData.expectedReturnDate)
          : undefined,
        status: 'active',
        notes: assignmentData.notes,
        assignedBy: user.id!,
        assignedByName: user.name,
      });

      // Update equipment status to assigned
      await equipmentService.updateEquipment(
        assigningEquipment.id.toString(),
        {
          status: 'assigned',
          assignedTo: assignmentData.userName,
          employeeId: assignmentData.employeeId,
          department: assignmentData.department,
        },
        user.id!
      );

      // Log the activity
      await activityLogService.logEquipmentAction(
        'assigned',
        assigningEquipment,
        user.id!,
        user.name,
        undefined,
        `Assigned to ${assignmentData.userName} (${assignmentData.employeeId})`
      );

      showNotification('Equipment assigned successfully!', 'success');
      setAssigningEquipment(null);
      return true;
    } catch (error: any) {
      console.error('Error assigning equipment:', error);
      showNotification(error.message || 'Failed to assign equipment', 'error');
      return false;
    }
  };

  // Handle deleting equipment
  const handleDeleteEquipment = async (equipmentToDelete: Equipment) => {
    if (!user) return;

    try {
      console.log('Deleting equipment:', equipmentToDelete);

      // convert id to string for Firebase
      const equipmentId =
        typeof equipmentToDelete.id === 'number'
          ? equipmentToDelete.id.toString()
          : equipmentToDelete.id;

      // Delete from Firebase
      await equipmentService.deleteEquipment(equipmentId);

      // Log activity
      await activityLogService.logEquipmentAction(
        'deleted',
        equipmentToDelete,
        user.id!,
        user.name,
        undefined,
        `Deleted ${equipmentToDelete.type}: ${equipmentToDelete.brand} ${equipmentToDelete.model}`
      );

      showNotification(
        `Equipment ${equipmentToDelete.assetTag} deleted successfully!`,
        'success'
      );
      setDeletingEquipment(null);
    } catch (error: any) {
      console.error('Error deleting equipment:', error);
      showNotification(error.message || 'Failed to delete equipment', 'error');
    }
  };

  const handleReturnAssignment = async (assignment: Assignment) => {
    if (!user) return;

    try {
      await assignmentService.returnAssignment(
        assignment.id!,
        user.id!,
        user.name
      );

      await equipmentService.updateEquipment(
        assignment.equipmentId,
        { status: 'available', assignedTo: '', employeeId: '', department: '' },
        user.id!
      );

      await activityLogService.logEquipmentAction(
        'returned',
        equipment.find((e) => e.id?.toString() === assignment.equipmentId) ?? { assetTag: assignment.equipmentAssetTag } as any,
        user.id!,
        user.name,
        undefined,
        `Equipment returned by ${assignment.userName}`
      );

      showNotification(`${assignment.equipmentAssetTag} marked as returned`, 'success');
    } catch (error: any) {
      console.error('Error returning assignment:', error);
      showNotification(error.message || 'Failed to return equipment', 'error');
    }
  };

  const handleViewAssignmentDetails = (_assignment: Assignment) => {
    // placeholder — detail view not yet implemented
  };

  // handle clearing filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  // show notification helper
  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ show: true, message, type });
  };

  const handleBulkImport = async (
    equipmentList: Omit<Equipment, 'id'>[]
  ): Promise<{ success: number; failed: number; errors: string[] }> => {
    if (!user) return { success: 0, failed: equipmentList.length, errors: ['Not authenticated'] };

    try {
      const result = await equipmentService.bulkAddEquipment(equipmentList, user.id!);

      // Log the bulk import as a single activity log entry
      if (result.success > 0) {
        await activityLogService.logEquipmentAction(
          'added',
          { id: 'bulk-import', assetTag: `Bulk Import (${result.success} items)` } as Equipment,
          user.id!,
          user.name,
          undefined,
          `Bulk imported ${result.success} equipment item(s)${result.failed > 0 ? `, ${result.failed} failed` : ''}`
        );
      }

      if (result.success > 0) {
        showNotification(`Successfully imported ${result.success} item(s)!`, 'success');
      }
      if (result.failed > 0) {
        showNotification(`${result.failed} item(s) failed to import`, 'warning');
      }

      return result;
    } catch (error: any) {
      console.error('Error during bulk import:', error);
      showNotification('Bulk import failed', 'error');
      return { success: 0, failed: equipmentList.length, errors: [error.message || 'Unknown error'] };
    }
  };

  // auto-hide notification after 3s, cleared on each new notification
  useEffect(() => {
    if (!notification.show) return;
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    notificationTimerRef.current = setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 3000);
    return () => {
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, [notification.show, notification.message]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="loading-container">
        <Loader className="spinner-large" />
        <p>Loading...</p>
      </div>
    );
  }

  // show login if not authenticated
  if (!user) {
    return <Login />;
  }

  const handleExportEquipment = () => {
    if (equipment.length === 0) {
      showNotification('No equipment data to export', 'warning');
      return;
    }

    const exportData = equipment.map((item) => ({
      'Asset Tag': item.assetTag,
      'Equipment Type': item.type,
      'Brand': item.brand,
      'Model': item.model,
      'Processor': item.processor,
      'Serial Number': item.serialNumber,
      'Status': item.status,
      'Assigned To': item.assignedTo,
      'Employee ID': item.employeeId,
      'Department': item.department,
      'Location': item.location,
      'Purchase Cost': item.purchaseCost,
      'Notes': item.notes,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipment');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `equipment_export_${dateStr}.xlsx`);

    showNotification(`Exported ${equipment.length} items successfully!`, 'success');
  };


  const stats = calculateStats(equipment);

  return (
    <div className="app">
      <div className="app-container">
        <Header stats={stats} user={user} onLogout={handleLogout} />

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="main-content">
          {loadingUser ? (
            <div className="loading-container">
              <Loader className="spinner-large" />
              <p>Loading equipment data...</p>
            </div>
          ) : activeTab === 'inventory' ? (
            <>
              <div className="content-header">
                <div>
                  <h2>Equipment Inventory</h2>
                  <p className="subtitle">Manage and track all IT equipment</p>
                </div>
              </div>

              <div className="header-actions">
                <button
                  className="btn btn-import"
                  onClick={handleExportEquipment}
                >
                  <Download size={18} />
                  Export Data
                </button>
                <button
                  className="btn btn-import"
                  onClick={() => setShowBulkImport(true)}
                >
                  <Upload size={18} />
                  Bulk Import
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('add')}
                >
                  Add Equipment
                </button>
              </div>

              <SearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onClearFilters={handleClearFilters}
                resultCount={filteredEquipment.length}
                totalCount={equipment.length}
              />

              <EquipmentList
                equipment={filteredEquipment}
                onEdit={setEditingEquipment}
                onDelete={setDeletingEquipment}
                onAssign={setAssigningEquipment}
              />
            </>
          ) : activeTab === 'add' ? (
            <>
              <div className="content-header">
                <h2>Add New Equipment</h2>
                <p className="subtitle">
                  Enter equipment details to add to inventory
                </p>
              </div>
              <AddEquipmentForm onSubmit={handleAddEquipment} />
            </>
          ) : activeTab === 'assignments' ? (
            <>
              <div className="content-header">
                <h2>Equipment Assignments</h2>
                <p className="subtitle">
                  Manage equipment assignments and returns
                </p>
              </div>
              <AssignmentList
                onReturn={handleReturnAssignment}
                onViewDetails={handleViewAssignmentDetails}
              />
            </>
          ) : null}
        </div>

        {assigningEquipment && (
          <AssignmentModel
            equipment={assigningEquipment}
            onAssign={handleAssignEquipment}
            onClose={() => setAssigningEquipment(null)}
          />
        )}

        {/* Edit Modal */}
        {editingEquipment && (
          <EditEquipmentModal
            equipment={editingEquipment}
            onSave={handleEditEquipment}
            onClose={() => setEditingEquipment(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deletingEquipment && (
          <DeleteConfirmModal
            equipment={deletingEquipment}
            onConfirm={handleDeleteEquipment}
            onCancel={() => setDeletingEquipment(null)}
          />
        )}

        {/* Bulk Import Modal */}
        {showBulkImport && (
          <BulkImportModal
            onImport={handleBulkImport}
            onClose={() => setShowBulkImport(false)}
          />
        )}

        {/* Notification */}
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() =>
              setNotification((prev) => ({ ...prev, show: false }))
            }
          />
        )}
      </div>
    </div>
  );
};

export default App;