import { useEffect, useState } from "react";
import type { Assignment } from "../types/firebase"
import { assignmentService } from "../services/firebase/assignmentService";

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

  return (
    <div>AssignmentList</div>
  )
}

export default AssignmentList