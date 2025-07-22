import { useState, useEffect } from 'react';
import { useCreateDoctorProfile } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateDoctorProfileModal({ isOpen, onClose }: CreateProfileModalProps) {
  const { data: currentUser } = useCurrentUser();
  const [form, setForm] = useState({
    licenseNumber: '',
    yearsOfExperience: 0,
    hospitalAffiliation: '',
    specializations: [] as string[],
    specializationInput: '',
    consultationFee: 0,
    availableDays: ['Monday - Friday'],
    workingHours: '9:00 AM - 6:00 PM',
    professionalBio: '',
    certifications: [] as File[],
  });
  const [error, setError] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(true);
  const createProfile = useCreateDoctorProfile();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSpecialization = () => {
    if (form.specializationInput.trim()) {
      setForm({
        ...form,
        specializations: [...form.specializations, form.specializationInput.trim()],
        specializationInput: '',
      });
    }
  };

  const handleRemoveSpecialization = (index: number) => {
    setForm({
      ...form,
      specializations: form.specializations.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createProfile.mutateAsync({
        licenseNumber: form.licenseNumber,
        yearsOfExperience: form.yearsOfExperience,
        hospitalAffiliation: form.hospitalAffiliation,
        specializations: form.specializations,
        consultationFee: form.consultationFee,
      });
      onClose();
      navigate({ to: '/dashboard/doctor/profile' });
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
            <div className="font-bold text-white text-lg">Create Profile</div>
            <div className="text-sm text-[#C7D2FE] dark:text-[#8491D9]">Complete your medical profile</div>
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
                <label className="block text-sm font-medium mb-1">Medical License</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="MD-2023-8491"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Years of Experience</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={form.yearsOfExperience}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="12"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hospital Affiliation</label>
                <input
                  type="text"
                  name="hospitalAffiliation"
                  value={form.hospitalAffiliation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="General Hospital"
                />
              </div>
            </div>
            
            {/* Specializations */}
            <div>
              <label className="block text-sm font-medium mb-1">Specializations</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.specializations.map((spec, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-[#8491D9] text-white flex items-center gap-1"
                  >
                    {spec}
                    <button
                      type="button"
                      className="ml-1 text-white hover:text-red-400"
                      onClick={() => handleRemoveSpecialization(i)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="specializationInput"
                  value={form.specializationInput}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="Add specialization"
                />
                <Button
                  type="button"
                  className="bg-[#8491D9] hover:bg-[#021373] text-white px-4"
                  onClick={handleAddSpecialization}
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Consultation Fee, Available Days, Working Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Consultation Fee</label>
                <input
                  type="number"
                  name="consultationFee"
                  value={form.consultationFee}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="150"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Available Days</label>
                <select
                  name="availableDays"
                  value={form.availableDays[0]}
                  onChange={(e) =>
                    setForm({ ...form, availableDays: [e.target.value] })
                  }
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                >
                  <option>Monday - Friday</option>
                  <option>Monday - Saturday</option>
                  <option>Weekends Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Working Hours</label>
                <input
                  type="text"
                  name="workingHours"
                  value={form.workingHours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="9:00 AM - 6:00 PM"
                />
              </div>
            </div>
            
            {/* Professional Bio */}
            <div>
              <label className="block text-sm font-medium mb-1">Professional Bio</label>
              <textarea
                name="professionalBio"
                value={form.professionalBio}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                placeholder="Write a short bio..."
              />
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