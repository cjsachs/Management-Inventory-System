import type { Equipment } from "../types/equipment";

interface EquipmentListProps {
  equipment: Equipment[];
}

const EquipmentList = ({ equipment }: EquipmentListProps) => {
  return (
    <div>
      EquipmentList
    </div>
  )
}

export default EquipmentList