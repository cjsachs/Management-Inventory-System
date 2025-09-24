import { useState } from "react";
import type { Equipment } from "../types/equipment"
import { Calendar, Package, User, X } from "lucide-react";

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

  const departments = ['IT','HR', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'Administration'];

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
    
    if (formData.expectedReturnDate) {
      const returnDate = new Date(formData.expectedReturnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (returnDate < today) {
        newErrors.expectedReturnDate = 'Expected Return Date must be today or in the future';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        expectedReturnDate: formData.expectedReturnDate ? new Date(formData.expectedReturnDate) : undefined,
        notes: formData.notes
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

  // set min date to today for the date picker
  const today = new Date().toISOString().split('T')[0];

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
                  <label htmlFor="department" className="required">
                    Department
                  </label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={errors.department ? 'error' : ''}
                    disabled={isSubmitting}
                  >
                    <option value="">Select department...</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && (
                    <span className="error-message">{errors.department}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="expectedReturnDate">
                    <Calendar size={18} />
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    id="expectedReturnDate"
                    name="expectedReturnDate"
                    value={formData.expectedReturnDate}
                    onChange={handleChange}
                    min={today}
                    className={errors.expectedReturnDate ? 'error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.expectedReturnDate && (
                    <span className="error-message">{errors.expectedReturnDate}</span>
                  )}
                </div>
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