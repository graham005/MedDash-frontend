import { useState, useEffect } from 'react';
import { useCreateDoctorProfile } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/useAuth'; // Add this import
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

export default function CreateDoctorProfile() {
    const { data: currentUser } = useCurrentUser(); // Get current user
    const [form, setForm] = useState({
        fullName: '',
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

	console.log(currentUser)
    // Autofill fullName from logged in user
    useEffect(() => {
        if (currentUser) {
            setForm((prev) => ({
                ...prev,
                fullName: `${currentUser.firstName} ${currentUser.lastName}`,
				
            }));
        }
    }, [currentUser]);

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

    const handleCertificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setForm({
                ...form,
                certifications: Array.from(e.target.files),
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            // Prepare payload (adjust as needed for your backend)
            await createProfile.mutateAsync({
                licenseNumber: form.licenseNumber,
                yearsOfExperience: form.yearsOfExperience,
                hospitalAffiliation: form.hospitalAffiliation,
                specializations: form.specializations,
                consultationFee: form.consultationFee,
                availableDays: form.availableDays,
                workingHours: form.workingHours,
                professionalBio: form.professionalBio,
                availabilityStatus,
                certifications: form.certifications,
            });
            navigate({ to: '/dashboard/doctor/profile' });
        } catch (err: any) {
            setError(err.message || 'Failed to create profile');
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FD] dark:bg-slate-950 py-10 px-2 flex flex-col items-center">
            {/* Top Bar */}
            <div className="w-full max-w-3xl bg-[#021373] dark:bg-[#010626] px-8 py-5 flex items-center justify-between rounded-t-lg shadow">
                <div>
                    <div className="font-bold text-white text-lg">
                        Manage your medical practice profile
                    </div>
                </div>
            </div>
            {/* Main Card */}
            <Card className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-b-lg shadow-[0_4px_12px_0_rgba(2,15,89,0.10)] border-2 border-transparent mt-0">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-[#021373] dark:text-white">
                        Create Profile
                    </CardTitle>
                    <div className="text-sm text-[#8491D9] dark:text-[#C7D2FE]">
                        Update your professional information and availability
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={form.fullName}
                                    disabled
                                    className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white opacity-60 cursor-not-allowed"
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
                                        className={`px-3 py-1 rounded-full text-xs font-semibold bg-[#8491D9] text-white flex items-center gap-1`}
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
                        {/* Availability Status */}
                        <div className="flex items-center gap-4">
                            <label className="block text-sm font-medium mb-1">Availability Status</label>
                            <button
                                type="button"
                                className={`w-10 h-6 rounded-full transition-colors ${
                                    availabilityStatus ? 'bg-[#8491D9]' : 'bg-gray-300 dark:bg-slate-700'
                                }`}
                                onClick={() => setAvailabilityStatus(!availabilityStatus)}
                                aria-label="Toggle availability"
                            >
                                <span
                                    className={`block w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow transform transition-transform ${
                                        availabilityStatus ? 'translate-x-4' : ''
                                    }`}
                                />
                            </button>
                            <span className="text-xs text-[#8491D9]">
                                {availabilityStatus ? 'Accepting new patients' : 'Not accepting'}
                            </span>
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
                        {/* Certifications & Documents */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Certifications & Documents</label>
                            <div className="border-2 border-dashed border-[#8491D9] rounded-lg p-6 mb-2 bg-[#F5F7FD] dark:bg-slate-900 flex flex-col items-center">
                                <span className="text-[#021373] dark:text-[#8491D9] font-semibold mb-2">
                                    Upload Medical Certifications
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleCertificationsChange}
                                    className="hidden"
                                    id="cert-upload"
                                />
                                <label htmlFor="cert-upload">
                                    <Button
                                        type="button"
                                        className="bg-[#8491D9] hover:bg-[#021373] text-white px-4"
                                    >
                                        Choose Files
                                    </Button>
                                </label>
                                <div className="mt-2 w-full">
                                    {form.certifications.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between bg-white dark:bg-slate-800 border rounded px-3 py-2 mt-2"
                                        >
                                            <span className="text-[#021373] dark:text-[#8491D9] text-xs">
                                                {file.name}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="text-red-500"
                                                onClick={() =>
                                                    setForm({
                                                        ...form,
                                                        certifications: form.certifications.filter((_, idx) => idx !== i),
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
                                onClick={() => navigate({ to: '/dashboard/doctor/profile' })}
                            >
                                Save as Draft
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#021373] hover:bg-[#8491D9] text-white w-1/2"
                                disabled={createProfile.isPending}
                            >
                                {createProfile.isPending ? 'Publishing...' : 'Publish Profile'}
                            </Button>
                        </div>
                        <div className="text-right text-xs text-gray-400 mt-2">Last saved: 2 minutes ago</div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}