import { Package, Plus } from "lucide-react";

interface TabNavigationProps {
    activeTab: 'inventory' | 'add';
    onTabChange: (tab: 'inventory' | 'add') => void;
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
    </div>
  )
}

export default TabNavigation