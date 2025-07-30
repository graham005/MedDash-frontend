import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Send, X, Check, ChevronDown, ArrowLeft, Users, RefreshCw } from 'lucide-react';
import { useCreatePrescription } from '@/hooks/usePrescriptions';
import { useMedicines } from '@/hooks/usePharmacy';
import { useDoctorPatients } from '@/hooks/useAppointments';
import { type CreatePrescriptionDto, type MedicationDto } from '@/api/prescription';
import { type Medicine } from '@/api/medicine';
import { toast } from 'sonner';

interface Patient {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
    };
    dateOfBirth: string;
}

interface NewPrescriptionProps {
    patient?: Patient;
    onClose: () => void;
    onSuccess?: () => void;
}

interface MedicationFormData extends Omit<MedicationDto, 'medicineId'> {
    medicine?: Medicine;
    medicineId: string;
}

const NewPrescription: React.FC<NewPrescriptionProps> = ({
    patient,
    onClose,
    onSuccess
}) => {
    const [prescriptionName, setPrescriptionName] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patient || null);
    const [refillsAllowed, setRefillsAllowed] = useState<number>(0);
    const [medications, setMedications] = useState<MedicationFormData[]>([
        { medicineId: '', dosage: '', frequency: '', duration: '', quantity: 0 }
    ]);
    const [searchResults, setSearchResults] = useState<Medicine[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
    const [medicineSearchTerms, setMedicineSearchTerms] = useState<Record<number, string>>({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [validityDate, setValidityDate] = useState('');

    // Patient selection states
    const [showPatientSearch, setShowPatientSearch] = useState(false);
    const [patientSearchQuery, setPatientSearchQuery] = useState('');

    // Get doctor's patients from confirmed/completed appointments
    const { data: doctorPatients = [], isLoading: patientsLoading } = useDoctorPatients();

    // Get all medicines for search
    const { data: allMedicines = [] } = useMedicines();

    // Create prescription mutation
    const createPrescriptionMutation = useCreatePrescription();

    // Filter patients based on search query
    const filteredPatients = doctorPatients.filter((patient: Patient) =>
        `${patient.user.firstName} ${patient.user.lastName}`
            .toLowerCase()
            .includes(patientSearchQuery.toLowerCase()) ||
        patient.user.email?.toLowerCase().includes(patientSearchQuery.toLowerCase())
    );

    // Calculate patient age
    const calculateAge = (dateOfBirth: string): number => {
        if (!dateOfBirth) return 0;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Search medicines
    useEffect(() => {
        if (activeSearchIndex !== null) {
            const searchTerm = medicineSearchTerms[activeSearchIndex] || '';
            if (searchTerm.trim()) {
                const filtered = allMedicines.filter(medicine =>
                    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setSearchResults(filtered);
            } else {
                setSearchResults(allMedicines);
            }
            setShowDropdown(true);
        } else {
            setShowDropdown(false);
        }
    }, [medicineSearchTerms, allMedicines, activeSearchIndex]);

    // Add medication
    const addMedication = () => {
        setMedications([
            ...medications,
            {
                medicineId: '',
                dosage: '',
                frequency: '',
                duration: '',
                quantity: 0
            }]);
    };

    // Remove medication
    const removeMedication = (index: number) => {
        if (medications.length > 1) {
            setMedications(medications.filter((_, i) => i !== index));
        }
    };

    // Update medication
    const updateMedication = (index: number, field: keyof MedicationFormData, value: any) => {
        const updated = [...medications];
        updated[index] = { ...updated[index], [field]: value };
        setMedications(updated);
    };

    // Select medicine from dropdown
    const selectMedicine = (medicine: Medicine, index: number) => {
        updateMedication(index, 'medicine', medicine);
        updateMedication(index, 'medicineId', medicine.id);
        setMedicineSearchTerms(prev => ({ ...prev, [index]: medicine.name }));
        setShowDropdown(false);
        setActiveSearchIndex(null);
    };

    // Select patient
    const selectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setShowPatientSearch(false);
        setPatientSearchQuery('');
        // Clear patient error if it exists
        const newErrors = { ...errors };
        delete newErrors.patient;
        setErrors(newErrors);
    };

    // Close patient search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showPatientSearch && !(event.target as Element).closest('.patient-search-container')) {
                setShowPatientSearch(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPatientSearch]);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!prescriptionName.trim()) {
            newErrors.prescriptionName = 'Prescription name is required';
        }

        if (!selectedPatient) {
            newErrors.patient = 'Patient selection is required';
        }

        if (!validityDate) {
            newErrors.validityDate = 'Validity date is required';
        }

        if (refillsAllowed < 0 || refillsAllowed > 12) {
            newErrors.refillsAllowed = 'Refills allowed must be between 0 and 12';
        }

        medications.forEach((med, index) => {
            if (!med.medicineId) {
                newErrors[`medication-${index}-medicine`] = 'Medicine selection is required';
            }
            if (!med.dosage.trim()) {
                newErrors[`medication-${index}-dosage`] = 'Dosage is required';
            }
            if (!med.frequency.trim()) {
                newErrors[`medication-${index}-frequency`] = 'Frequency is required';
            }
            if (!med.duration.trim()) {
                newErrors[`medication-${index}-duration`] = 'Duration is required';
            }
            if (!med.quantity) {
                newErrors[`medication-${index}-quantity`] = 'Quantity is required';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (_isDraft: boolean = false) => {
        if (!validateForm() || !selectedPatient) return;

        const prescriptionData: CreatePrescriptionDto = {
            name: prescriptionName,
            patientId: selectedPatient.id,
            date: new Date().toISOString(),
            validityDate: new Date(validityDate).toISOString(),
            refillsAllowed: refillsAllowed,
            medications: medications.map(med => ({
                medicineId: med.medicineId,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration,
                quantity: med.quantity,
            })),
        };

        createPrescriptionMutation.mutate(prescriptionData, {
            onSuccess: () => {
                setShowConfirmation(true);
                toast.success('Prescription created successfully!');
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to create prescription');
            },
        });
    };

    // Handle confirmation close
    const handleConfirmationClose = () => {
        setShowConfirmation(false);
        onSuccess?.();
        onClose();
    };

    // Render patient selection section
    const renderPatientSelection = () => {
        if (selectedPatient) {
            return (
                <div className="mb-6 mx-auto max-w-3xl">
                    <label className="block text-[#010626] dark:text-white font-medium mb-2 mx-auto max-w-3xl">
                        Selected Patient
                    </label>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#8491D9] rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-medium text-[#010626] dark:text-white">
                                    {selectedPatient.user.firstName} {selectedPatient.user.lastName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {selectedPatient.dateOfBirth ? `Age: ${calculateAge(selectedPatient.dateOfBirth)}` : 'Age: Unknown'} • {selectedPatient.user.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedPatient(null)}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="mb-6">
                <label className="block text-[#010626] dark:text-white font-medium mb-2">
                    Select Patient *
                </label>
                <div className="relative patient-search-container">
                    <input
                        type="text"
                        value={patientSearchQuery}
                        onChange={(e) => {
                            setPatientSearchQuery(e.target.value);
                            setShowPatientSearch(true);
                        }}
                        onFocus={() => setShowPatientSearch(true)}
                        placeholder="Search for a patient..."
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8491D9] transition-colors dark:bg-slate-700 dark:text-white pr-10 ${errors.patient ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                            }`}
                    />
                    <Search className="w-5 h-5 text-[#8491D9] absolute right-3 top-1/2 transform -translate-y-1/2" />

                    {showPatientSearch && (
                        <div className="absolute z-10 w-full bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                            {patientsLoading ? (
                                <div className="p-4 text-center">
                                    <div className="w-6 h-6 border-2 border-[#8491D9] border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="text-sm text-gray-500 mt-2">Loading patients...</p>
                                </div>
                            ) : filteredPatients.length > 0 ? (
                                filteredPatients.map((patient) => (
                                    <button
                                        key={patient.id}
                                        onClick={() => selectPatient(patient)}
                                        className="w-full text-left p-3 hover:bg-[#8491D9] hover:text-white transition-colors border-b last:border-b-0 dark:border-slate-500"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-200 dark:bg-slate-500 rounded-full flex items-center justify-center">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {patient.user.firstName} {patient.user.lastName}
                                                </div>
                                                <div className="text-sm opacity-75">
                                                    {patient.dateOfBirth ? `Age: ${calculateAge(patient.dateOfBirth)}` : 'Age: Unknown'} • {patient.user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    {patientSearchQuery ? 'No patients found matching your search.' : 'No patients found. Only patients with confirmed or completed appointments are shown.'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {errors.patient && (
                    <p className="text-red-500 text-sm mt-1">{errors.patient}</p>
                )}
            </div>
        );
    };

    const frequencyOptions = [
        'Once daily',
        'Twice daily',
        'Three times daily',
        'Four times daily',
        'Every 4 hours',
        'Every 6 hours',
        'Every 8 hours',
        'Every 12 hours',
        'As needed',
        'Before meals',
        'After meals',
        'At bedtime'
    ];

    return (
        <div className="min-h-screen mx-auto bg-gray-50 dark:bg-gray-900 max-w-2xl">
            <div className=" p-6">
                {/* Header */}
                <div className="bg-[#021373] rounded-lg p-6 text-white mb-6 shadow-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold">New Prescription</h1>
                                {selectedPatient && (
                                    <p className="text-white/90 mt-1">
                                        {selectedPatient.user.firstName} {selectedPatient.user.lastName} • {selectedPatient.dateOfBirth ? `Age: ${calculateAge(selectedPatient.dateOfBirth)}` : 'Age: Unknown'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Card - Centered */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden mx-auto">
                    <div className="p-8">
                        {/* Patient Selection - Centered */}
                        <div className="max-w-2xl mx-auto">
                            {renderPatientSelection()}
                        </div>

                        {/* Prescription Name - Centered */}
                        <div className="mb-6 max-w-2xl mx-auto">
                            <label className="block text-[#010626] dark:text-white font-medium mb-2">
                                Prescription Name *
                            </label>
                            <input
                                type="text"
                                value={prescriptionName}
                                onChange={(e) => setPrescriptionName(e.target.value)}
                                placeholder="Enter prescription name"
                                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8491D9] transition-colors dark:bg-slate-700 dark:text-white ${errors.prescriptionName ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                    }`}
                            />
                            {errors.prescriptionName && (
                                <p className="text-red-500 text-sm mt-1">{errors.prescriptionName}</p>
                            )}
                        </div>

                        {/* Prescription Details Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 max-w-4xl mx-auto">
                            {/* Validity Date */}
                            <div>
                                <label className="block text-[#010626] dark:text-white font-medium mb-2">
                                    Validity Date *
                                </label>
                                <input
                                    type="date"
                                    value={validityDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setValidityDate(e.target.value)}
                                    className={`w-full p-3 border rounded-lg dark:bg-slate-700 dark:text-white ${errors.validityDate ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                                />
                                {errors.validityDate && (
                                    <p className="text-red-500 text-sm mt-1">{errors.validityDate}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Select the date until which this prescription is valid.
                                </p>
                            </div>

                            {/* Refills Allowed */}
                            <div>
                                <label className="block text-[#010626] dark:text-white font-medium mb-2">
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4" />
                                        Refills Allowed
                                    </div>
                                </label>
                                <div className="relative">
                                    <select
                                        value={refillsAllowed}
                                        onChange={(e) => setRefillsAllowed(Number(e.target.value))}
                                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8491D9] transition-colors appearance-none pr-10 dark:bg-slate-700 dark:text-white ${errors.refillsAllowed ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                    >
                                        <option value={0}>No refills (0)</option>
                                        <option value={1}>1 refill</option>
                                        <option value={2}>2 refills</option>
                                        <option value={3}>3 refills</option>
                                        <option value={4}>4 refills</option>
                                        <option value={5}>5 refills</option>
                                        <option value={6}>6 refills</option>
                                        <option value={7}>7 refills</option>
                                        <option value={8}>8 refills</option>
                                        <option value={9}>9 refills</option>
                                        <option value={10}>10 refills</option>
                                        <option value={11}>11 refills</option>
                                        <option value={12}>12 refills (Maximum)</option>
                                    </select>
                                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                </div>
                                {errors.refillsAllowed && (
                                    <p className="text-red-500 text-sm mt-1">{errors.refillsAllowed}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Number of times patient can request refills before needing a new prescription.
                                </p>
                            </div>
                        </div>

                        {/* Refill Information Card */}
                        {refillsAllowed > 0 && (
                            <div className="mb-6 max-w-4xl mx-auto">
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                            <RefreshCw className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                Refill Authorization
                                            </h4>
                                            <p className="text-sm text-blue-700 dark:text-blue-200 mb-2">
                                                You are authorizing <strong>{refillsAllowed}</strong> refill{refillsAllowed !== 1 ? 's' : ''} for this prescription.
                                            </p>
                                            <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                                                <li>• Patient can request refills through the platform</li>
                                                <li>• Each refill request will require your approval</li>
                                                <li>• You can grant additional refills during approval if needed</li>
                                                <li>• Refills reset the prescription status to active</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Medications Section - Centered */}
                        {selectedPatient && (
                            <div className="mb-6 max-w-4xl mx-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-[#010626] dark:text-white">Medications</h3>
                                    <button
                                        onClick={addMedication}
                                        className="bg-[#8491D9] text-white px-4 py-2 rounded-lg hover:bg-[#7380C8] transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Medication
                                    </button>
                                </div>

                                {medications.map((medication, index) => (
                                    <div key={index} className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg mb-4 border dark:border-slate-600">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-medium text-[#020F59] dark:text-white">Medication {index + 1}</h4>
                                            {medications.length > 1 && (
                                                <button
                                                    onClick={() => removeMedication(index)}
                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Medicine Search */}
                                            <div className="relative lg:col-span-2">
                                                <label className="block text-[#010626] dark:text-white font-medium mb-2">
                                                    Medicine *
                                                </label>
                                                {medication.medicine ? (
                                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-slate-600 dark:border-slate-500">
                                                        <div>
                                                            <p className="font-medium text-[#010626] dark:text-white">{medication.medicine.name}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">{medication.medicine.dosage} • {medication.medicine.manufacturer}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                updateMedication(index, 'medicine', undefined);
                                                                updateMedication(index, 'medicineId', '');
                                                            }}
                                                            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={medicineSearchTerms[index] || ''}
                                                            onChange={(e) => {
                                                                setMedicineSearchTerms(prev => ({ ...prev, [index]: e.target.value }));
                                                                setActiveSearchIndex(index);
                                                            }}
                                                            onFocus={() => {
                                                                setActiveSearchIndex(index);
                                                                setShowDropdown(true);
                                                                // Show all medicines when focused and input is empty
                                                                if (!medicineSearchTerms[index]?.trim()) setSearchResults(allMedicines);
                                                            }}
                                                            onBlur={() => {
                                                                setTimeout(() => {
                                                                    if (activeSearchIndex === index && !medication.medicine) {
                                                                        //setActiveSearchIndex(null);
                                                                        setShowDropdown(false);
                                                                    }
                                                                }, 200);
                                                            }}
                                                            placeholder="Search medications..."
                                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8491D9] transition-colors pr-10 dark:bg-slate-600 dark:text-white ${errors[`medication-${index}-medicine`] ? 'border-red-500' : 'border-gray-300 dark:border-slate-500'
                                                                }`}
                                                        />
                                                        <Search className="w-5 h-5 text-[#8491D9] absolute right-3 top-1/2 transform -translate-y-1/2" />

                                                        {showDropdown && activeSearchIndex === index && searchResults.length > 0 && (
                                                            <div className="absolute z-10 w-full bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                                                                {searchResults.map((medicine) => (
                                                                    <button
                                                                        key={medicine.id}
                                                                        onClick={() => selectMedicine(medicine, index)}
                                                                        className="w-full text-left p-3 hover:bg-[#8491D9] hover:text-white transition-colors border-b last:border-b-0 dark:border-slate-500"
                                                                    >
                                                                        <div className="font-medium">{medicine.name}</div>
                                                                        <div className="text-sm opacity-75">{medicine.dosage} • {medicine.manufacturer}</div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {errors[`medication-${index}-medicine`] && (
                                                    <p className="text-red-500 text-sm mt-1">{errors[`medication-${index}-medicine`]}</p>
                                                )}
                                            </div>

                                            {/* Dosage */}
                                            <div>
                                                <label className="block text-[#010626] dark:text-white font-medium mb-2">
                                                    Dosage *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={medication.dosage}
                                                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                                    placeholder="e.g., 500mg, 1 tablet"
                                                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8491D9] transition-colors dark:bg-slate-600 dark:text-white ${errors[`medication-${index}-dosage`] ? 'border-red-500' : 'border-gray-300 dark:border-slate-500'
                                                        }`}
                                                />
                                                {errors[`medication-${index}-dosage`] && (
                                                    <p className="text-red-500 text-sm mt-1">{errors[`medication-${index}-dosage`]}</p>
                                                )}
                                            </div>

                                            {/* Frequency */}
                                            <div>
                                                <label className="block text-[#010626] dark:text-white font-medium mb-2">
                                                    Frequency *
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={medication.frequency}
                                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8491D9] transition-colors appearance-none pr-10 dark:bg-slate-600 dark:text-white ${errors[`medication-${index}-frequency`] ? 'border-red-500' : 'border-gray-300 dark:border-slate-500'
                                                            }`}
                                                    >
                                                        <option value="">Select frequency</option>
                                                        {frequencyOptions.map((option) => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                                </div>
                                                {errors[`medication-${index}-frequency`] && (
                                                    <p className="text-red-500 text-sm mt-1">{errors[`medication-${index}-frequency`]}</p>
                                                )}
                                            </div>
                                            {/* Quantity */}
                                            <div>
                                                <label className="block text-[#010626] dark:text-white font-medium mb-2">
                                                    Quantity *
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={medication.quantity}
                                                    onChange={(e) => updateMedication(index, 'quantity', Number(e.target.value))}
                                                    placeholder="Enter quantity"
                                                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8491D9] transition-colors dark:bg-slate-600 dark:text-white ${errors[`medication-${index}-quantity`] ? 'border-red-500' : 'border-gray-300 dark:border-slate-500'
                                                        }`}
                                                />
                                                {errors[`medication-${index}-quantity`] && (
                                                    <p className="text-red-500 text-sm mt-1">{errors[`medication-${index}-quantity`]}</p>
                                                )}
                                            </div>
                                            {/* Duration */}
                                            <div className="lg:col-span-2">
                                                <label className="block text-[#010626] dark:text-white font-medium mb-2">
                                                    Duration *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={medication.duration}
                                                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                                    placeholder="e.g., 7 days, 2 weeks"
                                                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8491D9] transition-colors dark:bg-slate-600 dark:text-white ${errors[`medication-${index}-duration`] ? 'border-red-500' : 'border-gray-300 dark:border-slate-500'
                                                        }`}
                                                />
                                                {errors[`medication-${index}-duration`] && (
                                                    <p className="text-red-500 text-sm mt-1">{errors[`medication-${index}-duration`]}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Show message if no patient selected - Centered */}
                        {!selectedPatient && (
                            <div className="text-center py-12 max-w-lg mx-auto">
                                <Users className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                                <p className="text-gray-500 dark:text-gray-400 text-xl mb-2">
                                    Please select a patient to continue with the prescription.
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                    Only patients with confirmed or completed appointments are available for selection.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons - Centered */}
                    {selectedPatient && (
                        <div className="bg-[#010626] p-6">
                            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-center gap-4">
                                <button
                                    onClick={onClose}
                                    className="text-white hover:text-gray-300 transition-colors px-6 py-2 order-3 sm:order-1"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => handleSubmit(true)}
                                    disabled={createPrescriptionMutation.isPending}
                                    className="bg-[#8491D9] text-white hover:bg-[#7380C8] transition-colors px-6 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-3"
                                >
                                    {createPrescriptionMutation.isPending ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Sign & Send
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
                        <div className="bg-[#021373] p-4 rounded-lg mb-6 text-center">
                            <Check className="w-12 h-12 text-white mx-auto mb-2" />
                            <h3 className="text-xl font-bold text-white">Prescription Sent!</h3>
                        </div>
                        <div className="text-center mb-6">
                            <p className="text-[#010626] dark:text-white mb-4">
                                The prescription has been successfully created and is now available for pharmacy processing.
                            </p>
                            {refillsAllowed > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                    <p className="text-sm text-blue-700 dark:text-blue-200">
                                        <RefreshCw className="w-4 h-4 inline mr-1" />
                                        <strong>{refillsAllowed}</strong> refill{refillsAllowed !== 1 ? 's' : ''} authorized for this prescription.
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleConfirmationClose}
                            className="bg-[#8491D9] text-white px-6 py-2 rounded-lg hover:bg-[#7380C8] transition-colors w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewPrescription;