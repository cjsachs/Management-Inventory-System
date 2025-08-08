import { useState } from 'react'
import './App.css'
import type { Equipment, EquipmentStats } from './types/equipment'
import { sampleEquipment } from './data/sampleData'
import Header from './components/Header'
import EquipmentList from './components/EquipmentList'

const App = () => {
  // sample data, will convert to dynamic later
  const [equipment] = useState<Equipment[]>(sampleEquipment);

  // Calculate statistics for the header
  const calculateStats = (equipmentList: Equipment[]): EquipmentStats => {
    return {
      total: equipmentList.length,
      available: equipmentList.filter(item => item.status === 'available').length,
      assigned: equipmentList.filter(item => item.status === 'assigned').length,
      maintenance: equipmentList.filter(item => item.status === 'maintenance').length,
    }
  }

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
