import { useState, useEffect } from 'react';
import { useCurrentUser, useUpdateDoctorProfile } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import type { TDoctorProfile } from '@/types/types';
import { X } from 'lucide-react'; // Import X icon for close button

interface EditDoctorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditDoctorProfileModal({ isOpen, onClose }: EditDoctorProfileModalProps) {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateDoctorProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    licenseNumber: '',
    yearsOfExperience: 0,
    hospitalAffiliation: '',
    specializations: [] as string[],
    specializationInput: '',
    consultationFee: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.profile && user.userRole === 'doctor') {
      const doctorProfile = user.profile as TDoctorProfile;
      setForm({
        fullName: `${user.firstName} ${user.lastName}`,
        licenseNumber: doctorProfile.licenseNumber || '',
        yearsOfExperience: Number(doctorProfile.yearsOfExperience) || 0,
        hospitalAffiliation: doctorProfile.hospitalAffiliation || '',
        specializations: doctorProfile.specializations || [],
        specializationInput: '',
        consultationFee: Number(doctorProfile.consultationFee) || 0,
      });
    }
  }, [user]);

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
      if (!user?.profile?.id) {
        setError('Doctor profile ID is missing.');
        return;
      }
      await updateProfile.mutateAsync({
        id: user.profile.id,
        profileData: {
          licenseNumber: form.licenseNumber,
          yearsOfExperience: form.yearsOfExperience,
          hospitalAffiliation: form.hospitalAffiliation,
          specializations: form.specializations,
          consultationFee: form.consultationFee,
        },
      });
      onClose(); // Close the modal after successful update
      navigate({ to: '/dashboard/doctor/profile' });
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  // Handle backdrop click to close the modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-lg p-6">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-lg shadow-xl">
        {/* Modal Header */}
        <div className="bg-[#021373] dark:bg-[#010626] px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <div className="font-bold text-white text-lg">MD Profile Editor</div>
            <div className="text-sm text-[#C7D2FE] dark:text-[#8491D9]">Manage your medical practice profile</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold">{form.fullName || 'Doctor'}</span>
            <div className="w-10 h-10 rounded-full bg-[#8491D9] flex items-center justify-center text-white font-bold text-lg">
              {form.fullName ? form.fullName.split(' ').map(n => n[0]).join('') : 'DR'}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 ml-4"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="Dr. Alice Muriuki"
                />
              </div>
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

            {/* Consultation Fee */}
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
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#021373] hover:bg-[#8491D9] text-white w-1/2"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>

            <div className="text-right text-xs text-gray-400 mt-2">
              Last saved: 2 minutes ago
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}