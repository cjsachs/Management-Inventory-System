import { Package, CheckCircle, AlertCircle, ToolCaseIcon, LogOut, User } from 'lucide-react';
import type { EquipmentStats } from '../types/equipment';
import type { ITStaffUser } from '../types/firebase';

interface HeaderProps {
  stats: EquipmentStats;
  user?: ITStaffUser | null;
  onLogout?: () => void;
}

const Header = ({ stats, user, onLogout }: HeaderProps) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-top">
          <div className="header-title">
            <img src="public/images/dugan-logo.png" alt="Logo" className="dp-logo" />
            <h1>Equipment Tracking System</h1>
          </div>
          
          {user && (
            <div className="header-user">
              <div className="user-info">
                <User size={20} />
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role === 'admin' ? 'Administrator' : 'Technician'}</span>
                </div>
              </div>
              {onLogout && (
                <button onClick={onLogout} className="logout-btn">
                  <LogOut size={18} />
                  Logout
                </button>
              )}
            </div>
          )}
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
              <ToolCaseIcon size={24} />
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
