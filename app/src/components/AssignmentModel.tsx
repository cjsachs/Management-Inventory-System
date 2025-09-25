import { useState } from "react";
import type { Equipment } from "../types/equipment"
import { Package, User, X } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { assignmentService } from "../services/firebase/assignmentService";

interface AssignmentModelProps {
  equipment: Equipment;
  onAssign: (assignmentData: {
    userId: string;
    userName: string;
    employeeId: string;
    department: string;
    expectedReturnDate?: Date;
    notes?: string;
  }) => Promise<boolean>;
  onClose: () => void;
}

const AssignmentModel = ({ equipment, onAssign, onClose }: AssignmentModelProps) => {
  const [formData, setFormData] = useState({
    userName: '',
    employeeId: '',
    department: '',
    expectedReturnDate: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof formData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.userName.trim()) newErrors.userName = 'User Name is required';
    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    // Validate expected return date if provided
      if (formData.expectedReturnDate) {
        const returnDate = new Date(formData.expectedReturnDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (returnDate < today) {
          newErrors.expectedReturnDate = 'Return date must be in the future';
        }
      }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleAssignEquipment = async (assignmentData: {
  userId: string;
  userName: string;
  employeeId: string;
  department: string;
  expectedReturnDate?: Date;
  notes?: string;
}): Promise<boolean> => {
  if (!user || !equipment) return false;

  try {
    // Build the assignment object, excluding undefined fields
    const assignmentToCreate: any = {
      equipmentId: equipment.id.toString(),
      equipmentAssetTag: equipment.assetTag,
      userId: assignmentData.userId,
      userName: assignmentData.userName,
      employeeId: assignmentData.employeeId,
      department: assignmentData.department,
      assignedDate: Timestamp.now(),
      status: 'active',
      assignedBy: user.id!,
      assignedByName: user.name,
    };

    // Only add optional fields if they have values
    if (assignmentData.expectedReturnDate) {
      assignmentToCreate.expectedReturnDate = Timestamp.fromDate(assignmentData.expectedReturnDate);
    }
    if (assignmentData.notes) {
      assignmentToCreate.notes = assignmentData.notes;
    }

    // Create the assignment in Firebase
    await assignmentService.createAssignment(
      assignmentToCreate
    );

  } catch (error) {
    console.error("Error creating assignment:", error);
      return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const assignmentData = {
        userId: `user-${formData.employeeId}`,
        userName: formData.userName,
        employeeId: formData.employeeId,
        department: formData.department,
        expectedReturnDate: formData.expectedReturnDate
          ? new Date(formData.expectedReturnDate)
          : undefined,
        notes: formData.notes || undefined
      };
      const success = await onAssign(assignmentData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error assigning equipment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <h2>Assign Equipment</h2>
          <button 
            onClick={onClose} 
            className="modal-close-btn"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Equipment Info */}
            <div className="form-section">
              <h3 className="form-section-title">Equipment Details</h3>
              <div className="equipment-info-box" style={{ 
                background: '#f7fafc', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '16px' 
              }}>
                <div className="info-row" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '8px' 
                }}>
                  <Package size={18} />
                  <div>
                    <strong>{equipment.assetTag}</strong> - {equipment.type}
                  </div>
                </div>
                <div className="info-row" style={{ color: '#718096', fontSize: '0.875rem' }}>
                  {equipment.brand} {equipment.model} • S/N: {equipment.serialNumber}
                </div>
              </div>
            </div>

            {/* Assignment Information */}
            <div className="form-section">
              <h3 className="form-section-title">Assignment Information</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="userName" className="required">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    placeholder="Tom Dugan"
                    className={errors.userName ? 'error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.userName && (
                    <span className="error-message">{errors.userName}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="employeeId" className="required">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    placeholder="EMP001"
                    className={errors.employeeId ? 'error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.employeeId && (
                    <span className="error-message">{errors.employeeId}</span>
                  )}
                </div>

                <div className="form-group">
              <label htmlFor="department">Job Title:</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="IT Specialist"
                className={errors.department ? 'error' : ''}
                disabled={isSubmitting}
              />
            </div>
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional notes about this assignment..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Assigning...
                </>
              ) : (
                <>
                  <User size={20} />
                  Assign Equipment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentModel;