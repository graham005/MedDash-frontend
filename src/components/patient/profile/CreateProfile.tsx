import { useState } from 'react';
import { useCreatePatientProfile } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePatientProfileModal({ isOpen, onClose }: CreateProfileModalProps) {
    const [form, setForm] = useState({
        dateOfBirth: '',
        bloodType: '',
        medicalDocuments: [] as File[],
    });
    const [error, setError] = useState('');
    const createProfile = useCreatePatientProfile();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setForm({
                ...form,
                medicalDocuments: Array.from(e.target.files),
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await createProfile.mutateAsync({
                dateOfBirth: form.dateOfBirth,
                bloodType: form.bloodType,
                medicalDocuments: form.medicalDocuments,
            });
            onClose(); // Close modal after successful creation
            navigate({ to: '/dashboard/patient/profile' });
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
                <div className="bg-[#021373] dark:bg-[#010626] px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <div>
                        <div className="font-bold text-white text-lg">Patient Profile Setup</div>
                        <div className="text-sm text-[#C7D2FE] dark:text-[#8491D9]">Manage your personal health profile</div>
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
                                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Blood Type</label>
                                <select
                                    name="bloodType"
                                    value={form.bloodType}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="">Select</option>
                                    <option>A+</option>
                                    <option>A-</option>
                                    <option>B+</option>
                                    <option>B-</option>
                                    <option>AB+</option>
                                    <option>AB-</option>
                                    <option>O+</option>
                                    <option>O-</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Medical Documents */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Medical Documents</label>
                            <div className="border-2 border-dashed border-[#8491D9] rounded-lg p-6 mb-2 bg-[#F5F7FD] dark:bg-slate-900 flex flex-col items-center">
                                <span className="text-[#021373] dark:text-[#8491D9] font-semibold mb-2">Upload Medical Documents</span>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleDocumentsChange}
                                    className="hidden"
                                    id="doc-upload"
                                />
                                <label htmlFor="doc-upload">
                                    <Button type="button" className="bg-[#8491D9] hover:bg-[#021373] text-white px-4">Choose Files</Button>
                                </label>
                                <div className="mt-2 w-full">
                                    {form.medicalDocuments.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 border rounded px-3 py-2 mt-2">
                                            <span className="text-[#021373] dark:text-[#8491D9] text-xs">{file.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="text-red-500"
                                                onClick={() =>
                                                    setForm({
                                                        ...form,
                                                        medicalDocuments: form.medicalDocuments.filter((_, idx) => idx !== i),
                                                    })
                                                }
                                            >
                                                &times;
                                            </Button>
                                        </div>
                                    ))}
                                </div>
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
