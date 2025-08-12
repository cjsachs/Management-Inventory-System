import { useState } from 'react'
import './App.css'
import type { Equipment, EquipmentStats, NotificationType } from './types/equipment'
import { sampleEquipment } from './data/sampleData'
import Header from './components/Header'
import EquipmentList from './components/EquipmentList'

const App = () => {
  // sample data, will convert to dynamic later
  const [equipment, setEquipment] = useState<Equipment[]>(sampleEquipment);
  const [activeTab, setActiveTab] = useState<'inventory' | 'add'>('inventory');
  const [notification, setNotification] = useState<{
    show: boolean,
    message: string,
    type: NotificationType
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Calculate statistics for the header
  const calculateStats = (equipmentList: Equipment[]): EquipmentStats => {
    return {
      total: equipmentList.length,
      available: equipmentList.filter(item => item.status === 'available').length,
      assigned: equipmentList.filter(item => item.status === 'assigned').length,
      maintenance: equipmentList.filter(item => item.status === 'maintenance').length,
    }
  }

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
    <div className='app'>
      <div className='app-container'>
        <Header stats={stats} />
        <div className='main-content'>
          <div className='content-header'>
            <h2>Equipment Inventory</h2>
            <p className='subtitle'>Manage and track all IT equipment</p>
          </div>
          <EquipmentList equipment={equipment} />
        </div>
      </div>
    </div>
  )
}

export default App
