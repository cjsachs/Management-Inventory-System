import { AlertTriangle } from "lucide-react";
import type { Equipment } from "../types/equipment";

interface DeleteConfirmModalProps {
  equipment: Equipment;
  onConfirm: (equipment: Equipment) => void;
  onCancel: () => void;
}

const DeleteConfirmModal = ({ equipment, onConfirm, onCancel }: DeleteConfirmModalProps) => {
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal modal-confirm">
        <div className="modal-icon-wrapper">
          <AlertTriangle size={48} className="modal-warning-icon" />
        </div>
        
        <div className="modal-content">
          <h2>Delete Equipment</h2>
          <p className="modal-message">
            Are you sure you want to delete this equipment?
          </p>
          
          <div className="delete-item-details">
            <div className="detail-row">
              <span className="detail-label">Asset Tag:</span>
              <span className="detail-value">{equipment.assetTag}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{equipment.type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Brand/Model:</span>
              <span className="detail-value">{equipment.brand} {equipment.model}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Serial Number:</span>
              <span className="detail-value">{equipment.serialNumber}</span>
            </div>
            {equipment.assignedTo && (
              <div className="detail-row">
                <span className="detail-label">Currently Assigned To:</span>
                <span className="detail-value">{equipment.assignedTo}</span>
              </div>
            )}
          </div>
          
          <p className="warning-text">
            <strong>Warning:</strong> This action cannot be undone. All data associated with this equipment will be permanently removed.
          </p>
        </div>

        <div className="modal-footer">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(equipment)}
            className="btn btn-danger"
          >
            Delete Equipment
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal