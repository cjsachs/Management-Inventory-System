import { Package, CheckCircle, AlertCircle, ToolCase } from 'lucide-react';
import type { EquipmentStats } from '../types/equipment';

interface HeaderProps {
  stats: EquipmentStats;
}

const Header = ({ stats }: HeaderProps) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <Package className="header-icon" />
          <h1>IT Equipment Tracking System</h1>
        </div>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon-container blue">
              <Package size={24} />
            </div>
            <div className="stat-details">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-container green">
              <CheckCircle size={24} />
            </div>
            <div className="stat-details">
              <div className="stat-value">{stats.available}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-container purple">
              <AlertCircle size={24} />
            </div>
            <div className="stat-details">
              <div className="stat-value">{stats.assigned}</div>
              <div className="stat-label">Assigned</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-container orange">
              <ToolCase size={24} />
            </div>
            <div className="stat-details">
              <div className="stat-value">{stats.maintenance}</div>
              <div className="stat-label">Maintenance</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
