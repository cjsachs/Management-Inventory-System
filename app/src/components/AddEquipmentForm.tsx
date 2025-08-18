import React, { useState } from 'react';
import type { EquipmentStatus, EquipmentType } from '../types/equipment';
import { Save, X } from 'lucide-react';

// Define Equipment type if not already imported
type Equipment = {
  assetTag: string;
  type: EquipmentType;
  brand: string;
  model: string;
  serialNumber: string;
  status: EquipmentStatus;
  assignedTo: string;
  employeeId: string;
  department: string;
  location: string;
  purchaseDate: string;
  purchaseCost: number;
  notes: string;
};

interface AddEquipmentFormProps {
  onSubmit: (equipment: Omit<Equipment, 'id'>) => boolean;
}

const AddEquipmentForm = ({ onSubmit }: AddEquipmentFormProps) => {
  const initialFormState = {
    assetTag: '',
    type: 'Laptop' as EquipmentType,
    brand: '',
    model: '',
    serialNumber: '',
    status: 'available' as EquipmentStatus,
    assignedTo: '',
    employeeId: '',
    department: '',
    location: '',
    purchaseDate: '',
    purchaseCost: 0,
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // equipment types for dropdown
  const equipmentTypes: EquipmentType[] = [
    'Laptop',
    'Desktop',
    'Phone',
    'Printer',
    'Keyboard',
    'Mouse',
  ];

  // status options for dropdown
  const statusOptions: EquipmentStatus[] = [
    'available',
    'assigned',
    'maintenance',
    'retired',
  ];

  // handle input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // clear errors for the current field
    if (errors[name as keyof typeof errors]) {
      setErrors((prev: Partial<Record<keyof typeof formData, string>>) => ({
        ...prev,
        [name]: '',
      }));
    }

    // handle number fields
    if (name === 'purchaseCost') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};
    // required field validation
    if (!formData.assetTag.trim()) {
      newErrors.assetTag = 'Asset Tag is required';
    }
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial Number is required';
    }
    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    // asset tag format validation (ex: IT-YYYY-XXX)
    const assetTagPattern = /^IT-\d{4}-\w{3}$/;
    if (formData.assetTag && !assetTagPattern.test(formData.assetTag)) {
      newErrors.assetTag =
        'Asset Tag format should be XX-YYYY-### (ex: IT-2025-001)';
    }

    // cost validation
    if (formData.purchaseCost < 0) {
      newErrors.purchaseCost = 'Purchase Cost must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // simulate api call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // call parent component's onSubmit function
    const success = onSubmit(formData);

    if (success) {
      // reset form on successful submission
      setFormData(initialFormState);
      setErrors({});
    }

    setIsSubmitting(false);
  };

  // reset form
  const handleReset = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  return (
    <div className="add-equipment-form">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3 className="form-section-title">Basic Information</h3>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="assetTag" className="required">
                Asset Tag
              </label>
              <input
                type="text"
                id="assetTag"
                name="assetTag"
                value={formData.assetTag}
                onChange={handleChange}
                placeholder="IT-2025-001"
                className={errors.assetTag ? 'error' : ''}
              />
              {errors.assetTag && (
                <span className="error-message">{errors.assetTag}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="type" className="required">
                Equipment Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                {equipmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="brand" className="required">
                Brand
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Lenovo, Apple, HP, etc."
                className={errors.brand ? 'error' : ''}
              />
              {errors.brand && (
                <span className="error-message">{errors.brand}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="model">Model</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Latitude 5520"
              />
            </div>

            <div className="form-group">
              <label htmlFor="serialNumber" className="required">
                Serial Number
              </label>
              <input
                type="text"
                id="serialNumber"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="SN123456789"
                className={errors.serialNumber ? 'error' : ''}
              />
              {errors.serialNumber && (
                <span className="error-message">{errors.serialNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Assignment (Optional)</h3>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="assignedTo">Assigned To</label>
              <input
                type="text"
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                placeholder="Employee Name"
                disabled={formData.status !== 'assigned'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="employeeId">Employee ID</label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="EMP001"
                disabled={formData.status !== 'assigned'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Engineering, Sales, etc."
                disabled={formData.status !== 'assigned'}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Any additional information about this equipment..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            <X size={20} />
            Reset Form
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Adding...
              </>
            ) : (
              <>
                <Save size={20} />
                Add Equipment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEquipmentForm;
