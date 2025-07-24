import type { EmergencyType, EMSStatus, Priority } from "./enums";

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
    user?: User;

}

export interface TDoctorProfile {
    id?: string;
    licenseNumber: string;
    yearsOfExperience: number;
    hospitalAffiliation: string;
    specializations: string[];
    consultationFee: number;
    user?: User;


}

export interface TPharmacistProfile {
    id?: string;
    pharmacyName: string;
    licenseNumber: string;
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

export interface CreateEmsRequestDto {
  lat: number;
  lng: number;
  emergencyType: EmergencyType;
  priority: Priority;
  description?: string;
  contactNumber?: string;
}

export interface UpdateLocationDto {
  lat: number;
  lng: number;
}

export interface UpdateStatusDto {
  status: EMSStatus;
  notes?: string;
}

export interface EMSRequest {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  paramedic?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  patientLat: number;
  patientLng: number;
  paramedicLat?: number;
  paramedicLng?: number;
  status: EMSStatus;
  emergencyType: EmergencyType;
  priority: Priority;
  description?: string;
  contactNumber?: string;
  notes?: string;
  dispatchTime?: string;
  arrivalTime?: string;
  completionTime?: string;
  createdAt: string;
  updatedAt: string;
}

