import { useState } from 'react';
import { useCreatePharmacistProfile } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePharmacistProfileModal({ isOpen, onClose }: CreateProfileModalProps) {
  const [form, setForm] = useState({
    pharmacyName: '',
    licenseNumber: '',
  });
  const [error, setError] = useState('');
  const createProfile = useCreatePharmacistProfile();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createProfile.mutateAsync({
        pharmacyName: form.pharmacyName,
        licenseNumber: form.licenseNumber,
      });
      onClose(); // Close modal after successful creation
      navigate({ to: '/dashboard/pharmacist/profile' });
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    }
  };

  // Handle backdrop click to close the modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" 
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-lg shadow-xl">
        {/* Modal Header */}
        <div className="bg-[#021373] dark:bg-[#010626] px-8 py-5 flex items-center justify-between rounded-t-lg">
          <div>
            <div className="font-bold text-white text-lg">Pharmacist Profile Setup</div>
            <div className="text-sm text-[#C7D2FE] dark:text-[#8491D9]">Complete your pharmacy details</div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Pharmacy Name</label>
                <input
                  type="text"
                  name="pharmacyName"
                  value={form.pharmacyName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="Pharmacy Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="PH-2023-1234"
                />
              </div>
            </div>
            
            {/* Error */}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            
            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-[#8491D9] text-[#021373] dark:text-[#8491D9] hover:border-[#021373] hover:bg-[#e6eafd] dark:hover:bg-[#021373]/20 transition w-1/2"
                onClick={onClose}
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                className="bg-[#021373] hover:bg-[#8491D9] text-white w-1/2"
                disabled={createProfile.isPending}
              >
                {createProfile.isPending ? 'Creating...' : 'Create Profile'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}