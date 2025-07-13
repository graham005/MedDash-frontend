import { useState, useEffect } from 'react';
import { useCurrentUser, useUpdatePatientProfile } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import type { TPatientProfile } from '@/types/types';

export default function EditPatientProfile() {
    const { data: user, isLoading } = useCurrentUser();
    const updateProfile = useUpdatePatientProfile();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        dateOfBirth: '',
        bloodType: '',
        medicalDocuments: [] as File[],
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.profile && user.userRole === "patient") {
            const patientProfile = user.profile as TPatientProfile
            setForm({
                dateOfBirth: patientProfile.dateOfBirth || '',
                bloodType: patientProfile.bloodType || '',
                medicalDocuments: [],
            });
        }
    }, [user]);

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
            if (!user?.profile?.id) {
                setError('Patient profile ID is missing.');
                return;
            }
            await updateProfile.mutateAsync({
                id: user.profile.id,
                profileData: {
                    dateOfBirth: form.dateOfBirth,
                    bloodType: form.bloodType,
                    medicalDocuments: form.medicalDocuments,
                },
            });
            navigate({ to: '/dashboard/patient/profile' });
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        }
    };

    if (isLoading) {
        return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading profile...</div>;
    }

    return (
        <div className="min-h-screen bg-[#F5F7FD] dark:bg-slate-950 py-10 px-2 flex flex-col items-center">
            {/* Top Bar */}
            <div className="w-full max-w-3xl bg-[#021373] dark:bg-[#010626] px-8 py-5 flex items-center justify-between rounded-t-lg shadow">
                <div>
                    <div className="font-bold text-white text-lg">Patient Profile Editor</div>
                    <div className="text-sm text-[#C7D2FE] dark:text-[#8491D9]">Manage your personal health profile</div>
                </div>
            </div>
            {/* Main Card */}
            <Card className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-b-lg shadow-[0_4px_12px_0_rgba(2,15,89,0.10)] border-2 border-transparent mt-0">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-[#021373] dark:text-white">Edit Profile</CardTitle>
                    <div className="text-sm text-[#8491D9] dark:text-[#C7D2FE]">Update your personal health information</div>
                </CardHeader>
                <CardContent>
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
                                onClick={() => navigate({ to: '/dashboard/patient/profile' })}
                            >
                                Save as Draft
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#021373] hover:bg-[#8491D9] text-white w-1/2"
                                disabled={updateProfile.isPending}
                            >
                                {updateProfile.isPending ? 'Publishing...' : 'Publish Profile'}
                            </Button>
                        </div>
                        <div className="text-right text-xs text-gray-400 mt-2">Last saved: 2 minutes ago</div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
