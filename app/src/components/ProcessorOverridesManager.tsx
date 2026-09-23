// components/ProcessorOverridesManager.tsx
import { useState } from 'react';
import { Plus, Trash2, Edit, Save, X, Cpu } from 'lucide-react';
import type { ProcessorOverride } from '../types/firebase';
import { processorOverrideService } from '../services/firebase/processorOverrideService';
import { useAuth } from '../contexts/AuthContext';

interface ProcessorOverridesManagerProps {
  overrides: ProcessorOverride[];
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const ProcessorOverridesManager = ({ overrides, onNotify }: ProcessorOverridesManagerProps) => {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ matchString: '', label: '', releaseYear: new Date().getFullYear() });

  const resetForm = () => {
    setFormData({ matchString: '', label: '', releaseYear: new Date().getFullYear() });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!user) return;
    if (!formData.matchString.trim() || !formData.label.trim()) {
      onNotify('Match string and label are required', 'error');
      return;
    }

    try {
      await processorOverrideService.addOverride(
        formData.matchString,
        formData.label,
        formData.releaseYear,
        user.id!,
        user.name
      );
      onNotify('Override added successfully!', 'success');
      resetForm();
    } catch (error: any) {
      onNotify(error.message || 'Failed to add override', 'error');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await processorOverrideService.updateOverride(id, {
        matchString: formData.matchString,
        label: formData.label,
        releaseYear: formData.releaseYear,
      });
      onNotify('Override updated successfully!', 'success');
      resetForm();
    } catch (error: any) {
      onNotify(error.message || 'Failed to update override', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this processor override?')) return;
    try {
      await processorOverrideService.deleteOverride(id);
      onNotify('Override deleted', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Failed to delete override', 'error');
    }
  };

  const startEdit = (override: ProcessorOverride) => {
    setEditingId(override.id!);
    setFormData({
      matchString: override.matchString,
      label: override.label,
      releaseYear: override.releaseYear,
    });
    setIsAdding(false);
  };

  return (
    <div className="equipment-list-container" style={{ marginTop: '24px' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={20} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Processor Overrides</h3>
            <p className="subtitle" style={{ margin: 0 }}>Manually verified release dates for unrecognized processors</p>
          </div>
        </div>
        {!isAdding && !editingId && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            <Plus size={18} />
            Add Override
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="form-section">
          <div className="form-grid">
            <div className="form-group">
              <label className="required">Match String</label>
              <input
                type="text"
                value={formData.matchString}
                onChange={(e) => setFormData((prev) => ({ ...prev, matchString: e.target.value }))}
                placeholder="e.g. 5675U"
              />
            </div>
            <div className="form-group">
              <label className="required">Display Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="e.g. AMD Ryzen 5 PRO 5675U"
              />
            </div>
            <div className="form-group">
              <label className="required">Release Year</label>
              <input
                type="number"
                value={formData.releaseYear}
                onChange={(e) => setFormData((prev) => ({ ...prev, releaseYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                min="2000"
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={resetForm}>
              <X size={18} />
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => (editingId ? handleUpdate(editingId) : handleAdd())}
            >
              <Save size={18} />
              {editingId ? 'Save Changes' : 'Add Override'}
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="equipment-table">
          <thead>
            <tr>
              <th>Match String</th>
              <th>Label</th>
              <th>Release Year</th>
              <th>Added By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {overrides.length > 0 ? (
              overrides.map((override) => (
                <tr key={override.id}>
                  <td className="serial-number">{override.matchString}</td>
                  <td>{override.label}</td>
                  <td>{override.releaseYear}</td>
                  <td>{override.createdByName}</td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn action-btn-edit" onClick={() => startEdit(override)} title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn action-btn-delete" onClick={() => handleDelete(override.id!)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-state">
                  <Cpu size={40} />
                  <h3>No Overrides Yet</h3>
                  <p>Add one when you find a processor the automatic detection can't identify.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProcessorOverridesManager;