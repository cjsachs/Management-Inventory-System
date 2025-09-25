import { useEffect, useState } from "react";
import type { Assignment } from "../types/firebase"
import { assignmentService } from "../services/firebase/assignmentService";
import { useAuth } from "../contexts/AuthContext";
import type { Timestamp } from "firebase/firestore";
import { AlertCircle, CheckCircle, Clock, Package, User } from "lucide-react";

interface AssignmentListProps {
  onReturn: (assignment: Assignment) => void;
  onViewDetails: (assignment: Assignment) => void;
}

const AssignmentList = ({ onReturn, onViewDetails }: AssignmentListProps) => {
  const { user } = useAuth();
  const [ assignments, setAssignments ] = useState<Assignment[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('active');

  useEffect(() => {
    if (!user) return;

    const unsubscribe = assignmentService.subscribeToAllAssignments((assignmentList) => {
      setAssignments(assignmentList);
      setLoading(false);
    }, () => {
      console.error("Failed to subscribe to assignments");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // helper function to format date
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // helper function to calculate days until return
  const getDaysUntilReturn = (assignment: Assignment) => {
    if (!assignment.expectedReturnDate) return null;
    const today = new Date();
    const returnDate = assignment.expectedReturnDate.toDate();
    const diffTime = returnDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // filter assignments based on selected filter
  const filteredAssignments = assignments.filter(assignment => {
    switch (filter) {
      case 'active':
        return assignment.status === 'active';
      case 'returned':
        return assignment.status === 'returned';
      case 'overdue':
        return isOverdue(assignment);
      default:
        return true;
    }
  });

  // helper function to check if assignment is overdue
  const isOverdue = (assignment: Assignment) => {
    if (assignment.status === 'returned') return false;
    if (!assignment.expectedReturnDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const returnDate = assignment.expectedReturnDate.toDate();
    returnDate.setHours(0, 0, 0, 0);
    return returnDate < today;
  }

  // get status badge class
  const getStatusBadgeClass = (assignment: Assignment) => {
    if (assignment.status === 'returned')
      return 'status-badge status-available';
    if (isOverdue(assignment))
      return 'status-badge status-retired';
    return 'status-badge status-assigned';
  };

  // get status text
  const getStatusText = (assignment: Assignment) => {
    if (assignment.status === 'returned') {
      return 'Returned';
    }
    if (isOverdue(assignment)) {
      return 'Overdue';
    }
    const daysLeft = getDaysUntilReturn(assignment);
    if (daysLeft !== null && daysLeft <= 7 && daysLeft >= 0) {
      return `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
    }
    return 'Active';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="assignment-list-container">
      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({assignments.length})
        </button>
        <button
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          <CheckCircle size={16} />
          Active ({assignments.filter(a => a.status === 'active').length})
        </button>
        <button
          className={`filter-tab ${filter === 'overdue' ? 'active' : ''}`}
          onClick={() => setFilter('overdue')}
        >
          <AlertCircle size={16} />
          Overdue ({assignments.filter(a => isOverdue(a)).length})
        </button>
        <button
          className={`filter-tab ${filter === 'returned' ? 'active' : ''}`}
          onClick={() => setFilter('returned')}
        >
          Returned ({assignments.filter(a => a.status === 'returned').length})
        </button>
      </div>

      {/* Assignments Table */}
      <div className="equipment-list-container">
        <div className="table-wrapper">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Assigned To</th>
                <th>Department</th>
                <th>Assigned Date</th>
                <th>Expected Return</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>
                      <div className="asset-tag">
                        <Package size={18} />
                        <span>{assignment.equipmentAssetTag}</span>
                      </div>
                    </td>
                    <td>
                      <div className="assigned-info">
                        <span className="employee-name">{assignment.userName}</span>
                        <span className="department">ID: {assignment.employeeId}</span>
                      </div>
                    </td>
                    <td>{assignment.department}</td>
                    <td>{formatDate(assignment.assignedDate)}</td>
                    <td>
                      {assignment.expectedReturnDate ? (
                        <div className="date-info">
                          <span>{formatDate(assignment.expectedReturnDate)}</span>
                          {assignment.status === 'active' && (
                            <span className={`days-badge ${isOverdue(assignment) ? 'overdue' : ''}`}>
                              {isOverdue(assignment) ? (
                                <AlertCircle size={14} />
                              ) : (
                                <Clock size={14} />
                              )}
                            </span>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(assignment)}>
                        {getStatusText(assignment)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {assignment.status === 'active' && (
                          <button
                            onClick={() => onReturn(assignment)}
                            className="action-btn action-btn-return"
                            title="Mark as returned"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => onViewDetails(assignment)}
                          className="action-btn"
                          title="View details"
                        >
                          <User size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <Package size={48} />
                    <h3>No Assignments Found</h3>
                    <p>
                      {filter === 'all' 
                        ? 'No equipment assignments have been made yet.'
                        : `No ${filter} assignments found.`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {filteredAssignments.length > 0 && (
          <div className="table-footer">
            <div className="summary-info">
              Showing {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
            </div>
            {filter === 'active' && (
              <div className="summary-info">
                {filteredAssignments.filter(a => isOverdue(a)).length} overdue
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AssignmentList