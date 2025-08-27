import { Edit, Keyboard, Laptop, Monitor, Mouse, Package, Smartphone, Trash2 } from "lucide-react";
import type { Equipment, EquipmentStatus, EquipmentType } from "../types/equipment";

interface EquipmentListProps {
  equipment: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
}

const EquipmentList = ({ equipment, onEdit, onDelete }: EquipmentListProps) => {

  // helper to get respective icon for equipment type
  const getEquipmentIcon = (type: EquipmentType) => {
    const iconMap: Record<EquipmentType, React.ComponentType<{ size?: number }>> = {
      'Laptop': Laptop,
      'Desktop': Monitor,
      'Phone': Smartphone,
      'Keyboard': Keyboard,
      'Mouse': Mouse
    };

    const IconComponent = iconMap[type] ?? Package; // Default to Package if type not found
    return <IconComponent size={18} />;
  }

  // helper to get status badge styling
  const getStatusBadgeClass = (status: EquipmentStatus): string => {
    const statusClasses: Record<EquipmentStatus, string> = {
      'available': 'status-badge status-available',
      'assigned': 'status-badge status-assigned',
      'maintenance': 'status-badge status-maintenance',
      'retired': 'status-badge status-retired'
    }
    return statusClasses[status] || 'status-badge status-unknown';
  }

  // Function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Function to Format Date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // function to capitalize the first letter of each status
  const formatStatus = (status: EquipmentStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <div className="equipment-list-container">
      <div className="table-wrapper">
        <table className="equipment-table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Type</th>
              <th>Brand & Model</th>
              <th>Serial Number</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Location</th>
              <th>Purchase Date</th>
              <th>Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipment.length > 0 ? (
              equipment.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="asset-tag">
                      {getEquipmentIcon(item.type)}
                      <span>{item.assetTag}</span>
                    </div>
                  </td>
                  <td>{item.type}</td>
                  <td>
                    <div className="brand-model">
                      <span className="brand">{item.brand}</span>
                      {item.model && <span className="model">{item.model}</span>}
                    </div>
                  </td>
                  <td className="serial-number">{item.serialNumber}</td>
                  <td>
                    <span className={getStatusBadgeClass(item.status)}>
                      {formatStatus(item.status)}
                    </span>
                  </td>
                  <td>
                    {item.assignedTo ? (
                      <div className="assigned-info">
                        <span className="employee-name">{item.assignedTo}</span>
                        {item.department && (
                          <span className="department">{item.department}</span>
                        )}
                      </div>
                    ) : (
                      <span className="unassigned">-</span>
                    )}
                  </td>
                  <td>{item.location || '-'}</td>
                  <td>{formatDate(item.purchaseDate)}</td>
                  <td className="currency">{formatCurrency(item.purchaseCost)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => onEdit(item)}
                        className="action-btn action-btn-edit"
                        title="Edit equipment"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="action-btn action-btn-delete"
                        title="Delete equipment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="empty-state">
                  <Package size={48} />
                  <h3>No Equipment Found</h3>
                  <p>Try adjusting your search or filter criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Summary footer */}
      {equipment.length > 0 && (
        <div className="table-footer">
          <div className="summary-info">
            Showing {equipment.length} items
          </div>
          <div className="total-value">
            Total Value: {formatCurrency(
              equipment.reduce((sum, item) => sum + item.purchaseCost, 0)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentList