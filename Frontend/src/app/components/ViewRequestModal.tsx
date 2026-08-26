import { FaTimes } from 'react-icons/fa';

interface DemoRequest {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string | null;
  created_at: string;
}

interface ViewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: DemoRequest | null;
}

export default function ViewRequestModal({ isOpen, onClose, request }: ViewRequestModalProps) {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gray-900 rounded-xl p-8 max-w-2xl w-full mx-4 border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-white">Demo Request Details</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Name</h3>
              <p className="text-white">{request.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Email</h3>
              <p className="text-white">{request.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Company</h3>
              <p className="text-white">{request.company || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Phone</h3>
              <p className="text-white">{request.phone || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Submitted On</h3>
              <p className="text-white">
                {new Date(request.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Message</h3>
            <div className="bg-white/5 rounded-lg p-4 text-white whitespace-pre-wrap">
              {request.message || 'No message provided'}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 