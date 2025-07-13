export interface TSignIn {
    email: string;
    password: string;
}

export interface TSignUp {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
}

export interface TPatientProfile {
    id?: string;
    dateOfBirth: string;
    bloodType: string;
    medicalDocuments: File[];
    user?: User;

}

export interface TDoctorProfile {
    id?: string;
    licenseNumber: string;
    yearsOfExperience: number;
    hospitalAffiliation: string;
    specializations: string[];
    consultationFee: number;
    availableDays: string[];
    workingHours: string;
    professionalBio: string;
    availabilityStatus: boolean;
    certifications: File[];
    user?: User;


}

export interface TPharmacistProfile {
    id?: string;
    pharmacyName: string;
    licenceNumber: string;
    user?: User;


}

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    userRole: string;
}