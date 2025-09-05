import { useState } from "react";
import type { Equipment, EquipmentStatus, EquipmentType } from "../types/equipment";
import { Save, X } from "lucide-react";

interface EditEquipmentModalProps {
    equipment: Equipment;
    onSave: (equipment: Equipment) => Promise<boolean>;
    onClose: () => void;
}

const EditEquipmentModal = ({ equipment, onSave, onClose }: EditEquipmentModalProps) => {
    const [formData, setFormData] = useState<Equipment>(equipment);
    const [errors, setErrors] = useState<Partial<Record<keyof Equipment, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const equipmentTypes: EquipmentType[] = ['Laptop', 'Desktop', 'Keyboard', 'Mouse', 'Phone'];

    const statusOptions: EquipmentStatus[] = ['available', 'assigned', 'maintenance', 'retired'];

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
    
        if (errors[name as keyof Equipment]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    
        if (name === 'purchaseCost') {
            setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const validateForm = () => {
        const newErrors: Partial<Record<keyof Equipment, string>> = {};
        if (!formData.assetTag.trim()) {
            newErrors.assetTag = 'Asset Tag is required'
        };
        if (!formData.serialNumber.trim()) {
            newErrors.serialNumber = 'Serial Number is required'
        };
        if (!formData.brand.trim()) {
            newErrors.brand = 'Brand is required'
        };

    // asset tag format validation (ex: IT-YYYY-XXX)
    const assetTagPattern = /^IT-\d{4}-\w{3}$/;
    if (formData.assetTag && !assetTagPattern.test(formData.assetTag)) {
      newErrors.assetTag =
        'Asset Tag format should be XX-YYYY-### (ex: IT-2025-001)';
    } 

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if(!validateForm()){
            return;
        }

        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 500)); // simulate delay
        
        const success = await onSave(formData);

        if (success) {
            onClose();
        }

        setIsSubmitting(false);
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };



  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <h2>Edit Equipment</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="edit-assetTag" className="required">
                    Asset Tag
                  </label>
                  <input
                    type="text"
                    id="edit-assetTag"
                    name="assetTag"
                    value={formData.assetTag}
                    onChange={handleChange}
                    className={errors.assetTag ? 'error' : ''}
                  />
                  {errors.assetTag && (
                    <span className="error-message">{errors.assetTag}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-type">
                    Equipment Type
                  </label>
                  <select
                    id="edit-type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    {equipmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-brand" className="required">
                    Brand
                  </label>
                  <input
                    type="text"
                    id="edit-brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className={errors.brand ? 'error' : ''}
                  />
                  {errors.brand && (
                    <span className="error-message">{errors.brand}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-model">
                    Model
                  </label>
                  <input
                    type="text"
                    id="edit-model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-serialNumber" className="required">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    id="edit-serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className={errors.serialNumber ? 'error' : ''}
                  />
                  {errors.serialNumber && (
                    <span className="error-message">{errors.serialNumber}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-status">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-location">
                    Location
                  </label>
                  <input
                    type="text"
                    id="edit-location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-purchaseCost">
                    Purchase Cost ($)
                  </label>
                  <input
                    type="number"
                    id="edit-purchaseCost"
                    name="purchaseCost"
                    value={formData.purchaseCost || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={errors.purchaseCost ? 'error' : ''}
                  />
                  {errors.purchaseCost && (
                    <span className="error-message">{errors.purchaseCost}</span>
                  )}
                </div>
              </div>
            </div>

            {formData.status === 'assigned' && (
              <div className="form-section">
                <h3 className="form-section-title">Assignment Information</h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="edit-assignedTo">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      id="edit-assignedTo"
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-employeeId">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      id="edit-employeeId"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-department">
                      Department
                    </label>
                    <input
                      type="text"
                      id="edit-department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-section">
              <div className="form-group">
                <label htmlFor="edit-notes">
                  Notes
                </label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
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
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEquipmentModal