import { useMemo, useState, useEffect } from 'react';
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
import { Loader } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { activityLogService } from './services/firebase/activityLogService';

const App = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'add'>('inventory');
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
      available: equipmentList.filter((item) => item.status === 'available')
        .length,
      assigned: equipmentList.filter((item) => item.status === 'assigned')
        .length,
      maintenance: equipmentList.filter((item) => item.status === 'maintenance')
        .length,
    };
  };

  

  // filter equipment by search term and status
  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      console.log('Filtering item:', item);
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
      const exists = await equipmentService.assetTagExists(newEquipment.assetTag);
      if (exists) {
        showNotification('Asset tag already exists', 'error');
        return false;
      }

      // add equipment to Firebase
      const equipmentId = await equipmentService.addEquipment(newEquipment, user.id!);
      console.log(equipmentId, 'test');

      // log activity (not implemented here, placeholder for future)

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
  const handleEditEquipment = async (updatedEquipment: Equipment): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('Updating equipment:', updatedEquipment);
      // Find original equipment for comparison
      const original = equipment.find(e => e.id === updatedEquipment.id);
      if (!original) {
        console.error('Original equipment not found');
        return false;
      }

      // Track changes
      const changes: Record<string, any> = {};
      Object.keys(updatedEquipment).forEach(key => {
        if (original[key as keyof Equipment] !== updatedEquipment[key as keyof Equipment]) {
          changes[key] = {
            from: original[key as keyof Equipment],
            to: updatedEquipment[key as keyof Equipment]
          };
        }
      });

      console.log('Changes detected:', changes);

      // convert id to string for Firebase
      const equipmentId = typeof updatedEquipment.id === 'number' 
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

  // Handle deleting equipment
  const handleDeleteEquipment = async (equipmentToDelete: Equipment) => {
    if (!user) return;

    try {
      console.log('Deleting equipment:', equipmentToDelete);

      // convert id to string for Firebase
      const equipmentId = typeof equipmentToDelete.id === 'number' 
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

      showNotification(`Equipment ${equipmentToDelete.assetTag} deleted successfully!`, 'success');
      setDeletingEquipment(null);
    } catch (error: any) {
      console.error('Error deleting equipment:', error);
      showNotification(error.message || 'Failed to delete equipment', 'error');
    }
  };

  // handle clearing filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  // show notification helper
  const showNotification = (message: string, type: NotificationType) => {
    setNotification({
      show: true,
      message,
      type,
    });
  };

  // auto-hide notification after 3s
  setTimeout(() => {
    setNotification((prev) => ({ ...prev, show: false }));
  }, 3000);

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
                <div className="header-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab('add')}
                  >
                    Add Equipment
                  </button>
                </div>
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
              />
            </>
          ) : (
            <>
              <div className="content-header">
                <h2>Add New Equipment</h2>
                <p className="subtitle">
                  Enter equipment details to add to inventory
                </p>
              </div>
              <AddEquipmentForm onSubmit={handleAddEquipment} />
            </>
          )}
        </div>

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
