import type { NotificationType } from '../types/equipment';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface NotificationProps {
    message: string;
    type: NotificationType;
    onClose: () => void;
}

const Notification = ({ message, type, onClose }: NotificationProps) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <AlertCircle size={20} />;
            default:
                return null;
        }
    };

  return (
    <div className={`notification notification ${type}`}>
        <div className='notification-content'>
            {getIcon()}
            <span>{message}</span>
        </div>
        <button className='notification-close' onClick={onClose}>
            <X size={18} />
        </button>
    </div>
  )
}

export default Notification