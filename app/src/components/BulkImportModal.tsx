// components/BulkImportModal.tsx
import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Equipment, EquipmentStatus, EquipmentType } from '../types/equipment';

interface BulkImportModalProps {
  onImport: (equipmentList: Omit<Equipment, 'id'>[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  onClose: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

// Fields that exist on your Equipment type
const EQUIPMENT_FIELDS: { key: keyof Omit<Equipment, 'id'>; label: string; required: boolean }[] = [
  { key: 'assetTag', label: 'Asset Tag', required: true },
  { key: 'type', label: 'Equipment Type', required: true },
  { key: 'brand', label: 'Brand', required: true },
  { key: 'model', label: 'Model', required: false },
  { key: 'processor', label: 'Processor', required: false },
  { key: 'serialNumber', label: 'Serial Number', required: true },
  { key: 'status', label: 'Status', required: false },
  { key: 'assignedTo', label: 'Assigned To', required: false },
  { key: 'employeeId', label: 'Employee ID', required: false },
  { key: 'department', label: 'Department', required: false },
  { key: 'location', label: 'Location', required: false },
  { key: 'purchaseCost', label: 'Purchase Cost', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

const VALID_TYPES: EquipmentType[] = ['Laptop', 'Desktop', 'Tablet', 'Phone', 'Keyboard', 'Mouse'];
const VALID_STATUSES: EquipmentStatus[] = ['available', 'assigned', 'maintenance', 'retired'];

const BulkImportModal = ({ onImport, onClose }: BulkImportModalProps) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<{ row: number; error: string }[]>([]);
  const [parsedEquipment, setParsedEquipment] = useState<Omit<Equipment, 'id'>[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
        });

        if (jsonData.length === 0) {
          alert('The file appears to be empty.');
          return;
        }

        const headers = Object.keys(jsonData[0]);
        setRawHeaders(headers);
        setRawRows(jsonData);

        // Attempt auto-mapping based on similar names
        const autoMapping: Record<string, string> = {};
        EQUIPMENT_FIELDS.forEach((field) => {
          const match = headers.find(
            (h) =>
              h.toLowerCase().replace(/[\s_-]/g, '') ===
              field.key.toLowerCase().replace(/[\s_-]/g, '')
          );
          if (match) {
            autoMapping[field.key] = match;
          }
        });
        setColumnMapping(autoMapping);
        setStep('mapping');
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please make sure it is a valid Excel or CSV file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Update column mapping
  const handleMappingChange = (fieldKey: string, columnName: string) => {
    setColumnMapping((prev) => ({ ...prev, [fieldKey]: columnName }));
  };

  // Validate and build equipment objects from mapping
  const handleProceedToPreview = () => {
    const missingRequired = EQUIPMENT_FIELDS.filter(
      (f) => f.required && !columnMapping[f.key]
    );

    if (missingRequired.length > 0) {
      alert(
        `Please map the following required fields: ${missingRequired
          .map((f) => f.label)
          .join(', ')}`
      );
      return;
    }

    const errors: { row: number; error: string }[] = [];
    const equipmentList: Omit<Equipment, 'id'>[] = [];
    const seenAssetTags = new Set<string>();

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // accounting for header row in spreadsheet
      const getVal = (key: string) => {
        const col = columnMapping[key];
        return col ? String(row[col] ?? '').trim() : '';
      };

      const assetTag = getVal('assetTag');
      const type = getVal('type');
      const brand = getVal('brand');
      const serialNumber = getVal('serialNumber');
      const statusRaw = getVal('status').toLowerCase();
      const purchaseCostRaw = getVal('purchaseCost');

      // Validation
      if (!assetTag) {
        errors.push({ row: rowNum, error: 'Missing Asset Tag' });
        return;
      }
      if (seenAssetTags.has(assetTag)) {
        errors.push({ row: rowNum, error: `Duplicate Asset Tag in file: ${assetTag}` });
        return;
      }
      if (!brand) {
        errors.push({ row: rowNum, error: 'Missing Brand' });
        return;
      }
      if (!serialNumber) {
        errors.push({ row: rowNum, error: 'Missing Serial Number' });
        return;
      }

      const matchedType = VALID_TYPES.find(
        (t) => t.toLowerCase() === type.toLowerCase()
      );
      if (type && !matchedType) {
        errors.push({
          row: rowNum,
          error: `Invalid Equipment Type "${type}". Must be one of: ${VALID_TYPES.join(', ')}`,
        });
        return;
      }

      const matchedStatus = VALID_STATUSES.find((s) => s === statusRaw);
      if (statusRaw && !matchedStatus) {
        errors.push({
          row: rowNum,
          error: `Invalid Status "${statusRaw}". Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
        return;
      }

      const purchaseCost = purchaseCostRaw ? parseFloat(purchaseCostRaw) : 0;
      if (purchaseCostRaw && isNaN(purchaseCost)) {
        errors.push({ row: rowNum, error: `Invalid Purchase Cost "${purchaseCostRaw}"` });
        return;
      }

      seenAssetTags.add(assetTag);

      equipmentList.push({
        assetTag,
        type: (matchedType || 'Laptop') as EquipmentType,
        brand,
        model: getVal('model'),
        processor: getVal('processor'),
        serialNumber,
        status: (matchedStatus || 'available') as EquipmentStatus,
        assignedTo: getVal('assignedTo'),
        employeeId: getVal('employeeId'),
        department: getVal('department'),
        location: getVal('location'),
        purchaseCost: purchaseCost || 0,
        notes: getVal('notes'),
      });
    });

    setValidationErrors(errors);
    setParsedEquipment(equipmentList);
    setStep('preview');
  };

  // Execute the import
  const handleConfirmImport = async () => {
    setStep('importing');
    const result = await onImport(parsedEquipment);
    setImportResult(result);
    setStep('complete');
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Asset Tag': 'IT-2025-001',
        'Equipment Type': 'Laptop',
        'Brand': 'Dell',
        'Model': 'Latitude 5520',
        'Processor': 'Intel Core i7-1165G7',
        'Serial Number': 'SN123456789',
        'Status': 'available',
        'Assigned To': '',
        'Employee ID': '',
        'Department': '',
        'Location': 'Dugan West',
        'Purchase Cost': '1200',
        'Notes': '',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipment');
    XLSX.writeFile(wb, 'equipment_import_template.xlsx');
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && step !== 'importing') {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>Bulk Import Equipment</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            disabled={step === 'importing'}
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Step Indicator */}
          <div className="import-steps">
            {['Upload', 'Map Columns', 'Preview', 'Complete'].map((label, idx) => {
              const stepKeys: ImportStep[] = ['upload', 'mapping', 'preview', 'complete'];
              const currentIdx = stepKeys.indexOf(step === 'importing' ? 'preview' : step);
              return (
                <div
                  key={label}
                  className={`import-step ${idx <= currentIdx ? 'active' : ''} ${idx === currentIdx ? 'current' : ''}`}
                >
                  <span className="import-step-number">{idx + 1}</span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="form-section">
              <div
                className={`dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={40} />
                <p><strong>Click to upload</strong> or drag and drop</p>
                <p className="subtitle">Excel (.xlsx, .xls) or CSV files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="template-download">
                <FileSpreadsheet size={18} />
                <span>Need a template?</span>
                <button type="button" className="link-btn" onClick={handleDownloadTemplate}>
                  Download sample template
                </button>
              </div>
            </div>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && (
            <div className="form-section">
              <p className="subtitle" style={{ marginBottom: '16px' }}>
                Match your spreadsheet columns ({fileName}) to equipment fields. {rawRows.length} rows detected.
              </p>
              <div className="mapping-grid">
                {EQUIPMENT_FIELDS.map((field) => (
                  <div key={field.key} className="form-group">
                    <label className={field.required ? 'required' : ''}>
                      {field.label}
                    </label>
                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    >
                      <option value="">-- Not Mapped --</option>
                      {rawHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="form-section">
              {validationErrors.length > 0 && (
                <div className="firebase-error" style={{ marginBottom: '16px', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertCircle size={18} />
                    <strong>{validationErrors.length} row(s) will be skipped due to errors:</strong>
                  </div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', width: '100%' }}>
                    {validationErrors.map((err, idx) => (
                      <div key={idx} style={{ fontSize: '0.8125rem', padding: '2px 0' }}>
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CheckCircle size={18} color="#48bb78" />
                <strong>{parsedEquipment.length} item(s) ready to import</strong>
              </div>

              <div className="table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="equipment-table">
                  <thead>
                    <tr>
                      <th>Asset Tag</th>
                      <th>Type</th>
                      <th>Brand/Model</th>
                      <th>Serial Number</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedEquipment.slice(0, 50).map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.assetTag}</td>
                        <td>{item.type}</td>
                        <td>{item.brand} {item.model}</td>
                        <td className="serial-number">{item.serialNumber}</td>
                        <td>
                          <span className={`status-badge status-${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedEquipment.length > 50 && (
                  <p className="subtitle" style={{ padding: '12px', textAlign: 'center' }}>
                    ...and {parsedEquipment.length - 50} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="loading-container">
              <Loader className="spinner-large" />
              <p>Importing {parsedEquipment.length} items to Firebase...</p>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && importResult && (
            <div className="form-section" style={{ textAlign: 'center' }}>
              <CheckCircle size={48} color="#48bb78" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: '8px' }}>Import Complete!</h3>
              <p className="subtitle">
                Successfully imported {importResult.success} item(s).
                {importResult.failed > 0 && ` ${importResult.failed} failed.`}
              </p>
              {importResult.errors.length > 0 && (
                <div className="firebase-error" style={{ marginTop: '16px', textAlign: 'left', flexDirection: 'column' }}>
                  {importResult.errors.map((err, idx) => (
                    <div key={idx} style={{ fontSize: '0.8125rem', padding: '2px 0' }}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'upload' && (
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          )}

          {step === 'mapping' && (
            <>
              <button onClick={() => setStep('upload')} className="btn btn-secondary">
                Back
              </button>
              <button onClick={handleProceedToPreview} className="btn btn-primary">
                Preview <ArrowRight size={18} />
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button onClick={() => setStep('mapping')} className="btn btn-secondary">
                Back
              </button>
              <button
                onClick={handleConfirmImport}
                className="btn btn-primary"
                disabled={parsedEquipment.length === 0}
              >
                Import {parsedEquipment.length} Item(s)
              </button>
            </>
          )}

          {step === 'complete' && (
            <button onClick={onClose} className="btn btn-primary">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;

