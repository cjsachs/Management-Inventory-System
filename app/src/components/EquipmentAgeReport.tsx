// components/EquipmentAgeReport.tsx
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Download, Cpu, AlertCircle, Settings } from 'lucide-react';
import type { Equipment } from '../types/equipment';
import type { ProcessorOverride } from '../types/firebase';
import { analyzeEquipmentAge } from '../utils/processorAgeEstimator';
import { processorOverrideService } from '../services/firebase/processorOverrideService';
import ProcessorOverridesManager from './ProcessorOverridesManager';
import { auth } from '../config/firebase';
import * as XLSX from 'xlsx';

interface EquipmentAgeReportProps {
  equipment: Equipment[];
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const getCategoryClass = (category: string) => {
  if (category === 'Legacy') return 'status-badge status-retired';
  if (category === 'Aging') return 'status-badge status-maintenance';
  return 'status-badge status-available';
};

const EquipmentAgeReport = ({ equipment, onNotify }: EquipmentAgeReportProps) => {
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [overrides, setOverrides] = useState<ProcessorOverride[]>([]);
  const [showOverrides, setShowOverrides] = useState(false);

  useEffect(() => {
    console.log('Firebase Auth currentUser at subscribe time:', auth.currentUser);
    const unsubscribe = processorOverrideService.subscribeToOverrides(
      (list) => setOverrides(list),
      (error) => console.error('Error loading overrides:', error)
    );
    return () => unsubscribe();
  }, []);

  const overrideEntries = useMemo(
    () => overrides.map((o) => ({ matchString: o.matchString, label: o.label, releaseYear: o.releaseYear })),
    [overrides]
  );

  const results = useMemo(
    () => analyzeEquipmentAge(equipment, overrideEntries),
    [equipment, overrideEntries]
  );

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) =>
      sortDir === 'asc' ? a.estimate.year - b.estimate.year : b.estimate.year - a.estimate.year
    );
  }, [results, sortDir]);

  const legacyCount = results.filter((r) => r.category === 'Legacy').length;
  const agingCount = results.filter((r) => r.category === 'Aging').length;
  const currentCount = results.filter((r) => r.category === 'Current').length;
  const guessedCount = results.filter((r) => r.estimate.confidence === 'guessed').length;
  const avgAge =
    results.length > 0
      ? (results.reduce((sum, r) => sum + r.age, 0) / results.length).toFixed(1)
      : '0';

  const handleDownload = () => {
    const headers = ['Asset Tag', 'Type', 'Brand', 'Model', 'Processor', 'Estimated Generation', 'Estimated Release Year', 'Estimated Age (years)', 'Category', 'Confidence'];

    let html = `<html><head><meta charset="UTF-8"></head><body><table border="1" cellspacing="0" cellpadding="4">
      <thead><tr style="background-color:#141e30;color:#ffffff;font-weight:bold;">
        ${headers.map((h) => `<th>${h}</th>`).join('')}
      </tr></thead><tbody>`;

    sortedResults.forEach((r) => {
      const hex = r.category === 'Legacy' ? 'FFC9C9' : r.category === 'Aging' ? 'FFE0A3' : 'C6F6D5';
      html += `<tr style="background-color:#${hex};">
        <td>${r.equipment.assetTag}</td>
        <td>${r.equipment.type}</td>
        <td>${r.equipment.brand}</td>
        <td>${r.equipment.model}</td>
        <td>${r.equipment.processor}</td>
        <td>${r.estimate.generation}</td>
        <td>${r.estimate.year}</td>
        <td>${r.age}</td>
        <td>${r.category}</td>
        <td>${r.estimate.confidence}</td>
      </tr>`;
    });

    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `equipment_age_report_${dateStr}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="content-header">
        <div>
          <h2>Equipment Age Report</h2>
          <p className="subtitle">Estimated age based on processor generation</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-import"
            onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            <ArrowUpDown size={18} />
            {sortDir === 'asc' ? 'Oldest First' : 'Newest First'}
          </button>
          <button className="btn btn-primary" onClick={handleDownload}>
            <Download size={18} />
            Export Report
          </button>
          <button className="btn btn-import" onClick={() => setShowOverrides((prev) => !prev)}>
            <Settings size={18} />
            {showOverrides ? 'Hide' : 'Manage'} Overrides
          </button>
        </div>
      </div>

      {showOverrides && (
        <ProcessorOverridesManager overrides={overrides} onNotify={onNotify} />
      )}

      {/* Disclaimer */}
      <div className="firebase-error" style={{ background: '#fffaf0', borderColor: '#fbd38d', color: '#7c2d12' }}>
        <AlertCircle size={18} />
        <span>
          Age is estimated from when the processor was released, not necessarily purchase date.
          Treat this as a directional guide, not exact hardware age.
        </span>
      </div>

      {/* Summary Stats */}
      <div className="stats-container" style={{ margin: '20px 0' }}>
        <div className="stat-card" style={{ background: 'rgba(0,0,0,0.03)' }}>
          <div className="stat-icon-container blue"><Cpu size={24} /></div>
          <div className="stat-details">
            <div className="stat-value" style={{ color: '#1a202c' }}>{avgAge}</div>
            <div className="stat-label" style={{ color: '#4a5568' }}>Avg. Age (yrs)</div>
          </div>
        </div>
        <div className="stat-card" style={{ background: '#c6f6d5' }}>
          <div className="stat-details">
            <div className="stat-value" style={{ color: '#22543d' }}>{currentCount}</div>
            <div className="stat-label" style={{ color: '#276749' }}>Current</div>
          </div>
        </div>
        <div className="stat-card" style={{ background: '#feebc8' }}>
          <div className="stat-details">
            <div className="stat-value" style={{ color: '#7c2d12' }}>{agingCount}</div>
            <div className="stat-label" style={{ color: '#7c2d12' }}>Aging</div>
          </div>
        </div>
        <div className="stat-card" style={{ background: '#fed7d7' }}>
          <div className="stat-details">
            <div className="stat-value" style={{ color: '#742a2a' }}>{legacyCount}</div>
            <div className="stat-label" style={{ color: '#742a2a' }}>Legacy</div>
          </div>
        </div>
      </div>

      {guessedCount > 0 && (
        <p className="subtitle" style={{ marginBottom: '12px' }}>
          {guessedCount} item(s) use a best-guess estimate (unrecognized processor string). Check the Confidence column below.
        </p>
      )}

      {/* Table */}
      <div className="equipment-list-container">
        <div className="table-wrapper">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Brand & Model</th>
                <th>Processor</th>
                <th>Est. Gen</th>
                <th>Est. Year</th>
                <th>Age</th>
                <th>Category</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((r) => (
                <tr key={r.equipment.id}>
                  <td>
                    <div className="asset-tag">
                      <span>{r.equipment.assetTag}</span>
                    </div>
                  </td>
                  <td>
                    <div className="brand-model">
                      <span className="brand">{r.equipment.brand}</span>
                      <span className="model">{r.equipment.model}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#718096' }}>{r.equipment.processor || '-'}</td>
                  <td>{r.estimate.generation}</td>
                  <td>{r.estimate.year}</td>
                  <td>{r.age}yr</td>
                  <td>
                    <span className={getCategoryClass(r.category)}>{r.category}</span>
                  </td>
                  <td style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: r.estimate.confidence === 'guessed' ? '#dd6b20' : '#38a169' }}>
                    {r.estimate.confidence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EquipmentAgeReport;