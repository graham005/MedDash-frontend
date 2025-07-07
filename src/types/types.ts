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
    dateOfBirth: string;
    bloodType: string;
    
}

export interface TDoctorProfile {
    specialization: string;
    qualification: string;
    licenceNumber: string;
    
}

export interface TPharmacistProfile {
    pharmacyName: string;
    licenceNumber: string;
    
}