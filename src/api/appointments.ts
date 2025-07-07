import axios from 'axios';
import { API_URL } from './url';

export interface CreateAppointmentDto {
  doctorId: string;
  startTime: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
  endTime: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
  status?: 'BOOKED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  availabilitySlotId: string;
}

export interface UpdateAppointmentDto {
  startTime?: string;
  endTime?: string;
  status?: 'BOOKED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  availabilitySlotId?: string;
}

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: 'BOOKED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  patient: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  doctor: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  availabilitySlot: {
    id: string;
    startTime: string;
    endTime: string;
    type: string;
  };
}

export const appointmentsApi = {
  // Patient APIs
  createAppointment: async (appointmentData: CreateAppointmentDto): Promise<Appointment> => {
    try {
      const response = await axios.post(`${API_URL}/appointments`, appointmentData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
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
  },

  getPatientAppointments: async (): Promise<Appointment[]> => {
    try {
      const response = await axios.get(`${API_URL}/appointments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching patient appointments:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login.');
      }
      throw new Error('Failed to fetch appointments.');
    }
  },

  getPatientAppointmentById: async (id: string): Promise<Appointment> => {
    try {
      const response = await axios.get(`${API_URL}/appointments/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching appointment:', error);
      if (error.response?.status === 404) {
        throw new Error('Appointment not found.');
      }
      throw new Error('Failed to fetch appointment.');
    }
  },

  updateAppointment: async (id: string, updateData: UpdateAppointmentDto): Promise<Appointment> => {
    try {
      const response = await axios.patch(`${API_URL}/appointments/${id}`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
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
  },

  cancelAppointment: async (id: string): Promise<Appointment> => {
    try {
      const response = await axios.delete(`${API_URL}/appointments/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error canceling appointment:', error);
      if (error.response?.status === 404) {
        throw new Error('Appointment not found.');
      }
      throw new Error('Failed to cancel appointment.');
    }
  },

  // Doctor APIs
  getDoctorAppointments: async (): Promise<Appointment[]> => {
    try {
      const response = await axios.get(`${API_URL}/appointments/doctor`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching doctor appointments:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login.');
      }
      throw new Error('Failed to fetch doctor appointments.');
    }
  },

  getDoctorAppointmentById: async (id: string): Promise<Appointment> => {
    try {
      const response = await axios.get(`${API_URL}/appointments/doctor/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching doctor appointment:', error);
      if (error.response?.status === 404) {
        throw new Error('Appointment not found.');
      }
      throw new Error('Failed to fetch doctor appointment.');
    }
  },
};