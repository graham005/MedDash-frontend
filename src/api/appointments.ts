import { apiClient } from './apiClient';
import { API_URL } from './url';

export interface CreateAppointmentDto {
  doctorId: string;
  patientId: string;
  startTime: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
  endTime: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
  status?: 'booked' | 'confirmed' | 'cancelled' | 'completed';
  availabilitySlotId: string;
  reasonForVisit: string;
  meetingUrl?: string;
}

export interface UpdateAppointmentDto {
  startTime?: string;
  endTime?: string;
  status?: 'booked' | 'confirmed' | 'cancelled' | 'completed';
  availabilitySlotId?: string;
  reasonForVisit?: string;
  meetingUrl?: string;
}

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status?: 'booked' | 'confirmed' | 'cancelled' | 'completed';
  reasonForVisit: string;
  meetingUrl?: string;
  patient: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
    };
    dateOfBirth: string;
  };
  doctor: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    specialization: string;
    qualification: string;
    licenseNumber: string;
    consultationFee: number;
  };
  availabilitySlot: {
    id: string;
    startTime: string;
    endTime: string;
    type: string;
  };
}

// Patient APIs
export const createAppointment = async (appointmentData: CreateAppointmentDto): Promise<Appointment> => {
  try {
    const response = await apiClient.post(`${API_URL}/appointments`, appointmentData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    if (error.response?.status === 400) {
      throw new Error('Invalid appointment data. Please check your information.');
    } else if (error.response?.status === 409) {
      throw new Error('Appointment slot is no longer available.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error('Failed to create appointment. Please try again.');
  }
};

export const getPatientAppointments = async (): Promise<Appointment[]> => {
  try {
    const response = await apiClient.get(`${API_URL}/appointments/patient`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching patient appointments:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login.');
    }
    throw new Error('Failed to fetch appointments.');
  }
};

export const getPatientAppointmentById = async (id: string): Promise<Appointment> => {
  try {
    const response = await apiClient.get(`${API_URL}/appointments/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    if (error.response?.status === 404) {
      throw new Error('Appointment not found.');
    }
    throw new Error('Failed to fetch appointment.');
  }
};

export const updateAppointmentStatus = async (
  id: string,
  status: 'booked' | 'confirmed' | 'cancelled' | 'completed'
): Promise<Appointment> => {
  try {
    const response = await apiClient.patch(`${API_URL}/appointments/doctor/${id}/status`, { status });
    return response.data;
  } catch (error: any) {
    console.error('Error updating appointment status:', error);
    if (error.response?.status === 400) {
      throw new Error('Invalid status value.');
    } else if (error.response?.status === 404) {
      throw new Error('Appointment not found or you do not have permission to update it.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login.');
    }
    throw new Error('Failed to update appointment status.');
  }
};

export const updateAppointment = async (id: string, updateData: UpdateAppointmentDto): Promise<Appointment> => {
  try {
    const response = await apiClient.patch(`${API_URL}/appointments/${id}`, updateData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    if (error.response?.status === 400) {
      throw new Error('Invalid appointment data.');
    } else if (error.response?.status === 404) {
      throw new Error('Appointment not found.');
    }
    throw new Error('Failed to update appointment.');
  }
};

export const cancelAppointment = async (id: string): Promise<Appointment> => {
  try {
    const response = await apiClient.delete(`${API_URL}/appointments/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error canceling appointment:', error);
    if (error.response?.status === 404) {
      throw new Error('Appointment not found.');
    }
    throw new Error('Failed to cancel appointment.');
  }
};

// Doctor APIs
export const getDoctorAppointments = async (): Promise<Appointment[]> => {
  try {
    const response = await apiClient.get(`${API_URL}/appointments/doctor`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching doctor appointments:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login.');
    }
    throw new Error('Failed to fetch doctor appointments.');
  }
};

export const getDoctorAppointmentById = async (id: string): Promise<Appointment> => {
  try {
    const response = await apiClient.get(`${API_URL}/appointments/doctor/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching doctor appointment:', error);
    if (error.response?.status === 404) {
      throw new Error('Appointment not found.');
    }
    throw new Error('Failed to fetch doctor appointment.');
  }
}