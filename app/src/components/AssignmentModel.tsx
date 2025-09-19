import type { Equipment } from "../types/equipment"

interface AssignmentModelProps {
    equipment: Equipment;
    onAssign: (assignmentData: {
        userId: string;
        userName: string;
        employeeId: string;
        department: string;
        expectedReturnDate: string;
        notes?: string;
    }) => Promise<void>;
    onClose: () => void;
}

const AssignmentModel = ({ equipment, onAssign, onClose }: AssignmentModelProps) => {
  return (
    <div>AssignmentModel</div>
  )
}

export default AssignmentModel