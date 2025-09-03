import { useMemo, useState, useEffect } from 'react'
import './App.css'
import type { Equipment, EquipmentStats, EquipmentStatus, NotificationType } from './types/equipment'
import Header from './components/Header'
import EquipmentList from './components/EquipmentList'
import AddEquipmentForm from './components/AddEquipmentForm'
import Notification from './components/Notification'
import TabNavigation from './components/TabNavigation'
import SearchFilter from './components/SearchFilter'
import EditEquipmentModal from './components/EditEquipmentModal'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import { equipmentService } from './services/firebase/equipmentService'

const App = () => {
  // sample data, will convert to dynamic later
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'add'>('inventory');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean,
    message: string,
    type: NotificationType
  }>({
    show: false,
    message: '',
    type: 'success'
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Calculate statistics for the header
  const calculateStats = (equipmentList: Equipment[]): EquipmentStats => {
    return {
      total: equipmentList.length,
      available: equipmentList.filter(item => item.status === 'available').length,
      assigned: equipmentList.filter(item => item.status === 'assigned').length,
      maintenance: equipmentList.filter(item => item.status === 'maintenance').length,
    }
  }

  // filter equipment by search term and status
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      // search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        item.assetTag.toLowerCase().includes(searchLower) ||
        item.serialNumber.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower) ||
        item.assignedTo.toLowerCase().includes(searchLower) ||
        item.department.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower);
      
        // status filter
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
  });
}, [equipment, searchTerm, statusFilter]);

  // handler for adding equipment
  const handleAddEquipment = (newEquipment: Omit<Equipment, 'id'>) => {
    try {
      // generate a new ID (use backend for this)
      const equipmentWithId: Equipment = {
        ...newEquipment,
        id: Date.now(), // simple ID generation
      };
      // add to equipment list
      setEquipment(prev => [...prev, equipmentWithId]);

      // show success notification
      showNotification('Equipment added successfully', 'success');

      // switch to intentory tab to see new item
      setActiveTab('inventory');

      return true;
    } catch (error) {
      // show error notification
      showNotification('Failed to add equipment', 'error');
      return false;
    }
  }

  // handler for editing equipment
  const handleEditEquipment = (updatedEquipment: Equipment) => {
    try {
      setEquipment(prev => 
      prev.map(item => 
        item.id === updatedEquipment.id ? updatedEquipment : item));
        showNotification('Equipment updated successfully', 'success');
        setEditingEquipment(null);
        return true;
    } catch (error) {
      showNotification('Failed to update equipment', 'error');
      return false
    }
  }

  // handler for deleting equipment
  const handleDeleteEquipment = (equipmentToDelete: Equipment) => {
    try {
      setEquipment(prev => prev.filter(item => item.id !== equipmentToDelete.id));
      showNotification(`Equipment ${equipmentToDelete.assetTag} deleted successfully`, 'success');
      setDeletingEquipment(null);
      return true;
    } catch (error) {
      showNotification('Failed to delete equipment', 'error');
      return false;
    }
  }

  // handle clearing filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  // show notification helper
  const showNotification = (message: string, type: NotificationType)=> {
    setNotification({
      show: true,
      message,
      type
    });
  }

  // auto-hide notification after 3s
  setTimeout(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, 3000);

  const stats = calculateStats(equipment);

  return (
    <div className="app">
      <div className="app-container">
        <Header stats={stats} />
        
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        <div className="main-content">
          {activeTab === 'inventory' ? (
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
                <p className="subtitle">Enter equipment details to add to inventory</p>
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
            onClose={() => setNotification(prev => ({ ...prev, show: false }))}
          />
        )}
      </div>
    </div>
  );
}

export default App
