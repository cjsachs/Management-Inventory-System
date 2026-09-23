import { Package, Plus, Users, BarChart3 } from "lucide-react";

interface TabNavigationProps {
    activeTab: 'inventory' | 'add' | 'assignments' | 'reports';
    onTabChange: (tab: 'inventory' | 'add' | 'assignments' | 'reports') => void;
}

const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="tab-navigation">
        <button
        className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
        onClick={() => onTabChange('inventory')}
        >
          <Package size={20} />
          <span>Inventory</span>
        </button>
        <button
        className={`tab ${activeTab === 'add' ? 'active' : ''}`}
        onClick={() => onTabChange('add')}
        >
          <Plus size={20}/>
          <span>Add Equipment</span>
        </button>
        <button
        className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
        onClick={() => onTabChange('assignments')}
        >
          <Users size={20}/>
          <span>Assignments</span>
        </button>
        <button
        className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
        onClick={() => onTabChange('reports')}
        >
          <BarChart3 size={20}/>
          <span>Reports</span>
        </button>
    </div>
  )
}

export default TabNavigation