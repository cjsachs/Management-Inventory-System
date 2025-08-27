import { Filter, Search, X } from "lucide-react";
import type { EquipmentStatus } from "../types/equipment";

interface SearchFilterProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    statusFilter: EquipmentStatus | 'all';
    onStatusFilterChange: (status: EquipmentStatus | 'all') => void;
    onClearFilters: () => void;
    resultCount: number;
    totalCount: number;
}

const SearchFilter = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange, onClearFilters, resultCount, totalCount }: SearchFilterProps) => {
    const statusOptions: Array<{ value: EquipmentStatus | 'all'; label: string; color: string }> = [
        { value: 'all', label: 'All Status', color: 'all' },
        { value: 'available', label: 'Available', color: 'available' },
        { value: 'assigned', label: 'Assigned', color: 'assigned' },
        { value: 'maintenance', label: 'Maintenance', color: 'maintenance' },
        { value: 'retired', label: 'Retired', color: 'retired' }
    ];

    const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';
  return (
    <div className="search-filter-container">
      <div className="search-filter-row">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by asset tag, serial number, brand, model, employee..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="status-filter-group">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onStatusFilterChange(option.value)}
              className={`filter-btn filter-btn-${option.color} ${
                statusFilter === option.value ? 'active' : ''
              }`}
            >
              <Filter size={14} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Results Info */}
      <div className="filter-info">
        <div className="result-count">
          {hasActiveFilters ? (
            <>
              Showing <strong>{resultCount}</strong> of <strong>{totalCount}</strong> items
              {resultCount === 0 && (
                <span className="no-results"> - No items match your filters</span>
              )}
            </>
          ) : (
            <>Total <strong>{totalCount}</strong> items</>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="clear-filters-btn"
          >
            <X size={14} />
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchFilter