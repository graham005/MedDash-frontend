import type { CreateEmsRequestDto, EMSRequest, UpdateLocationDto, UpdateStatusDto } from '@/types/types';
import { apiClient } from './apiClient';
import { API_URL } from './url';
import { EmergencyType, EMSStatus, Priority } from '@/types/enums';



// EMS API functions
export const emsAPI = {
  // Create EMS request (Patient only)
  createRequest: async (requestData: CreateEmsRequestDto): Promise<EMSRequest> => {
    try {
      const response = await apiClient.post(`${API_URL}/ems/request`, requestData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Invalid request data. Please check your information.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. Only patients can create EMS requests.');
      }
      throw new Error('Failed to create EMS request. Please try again.');
    }
  },

  // Update paramedic location (Paramedic only)
  updateParamedicLocation: async (requestId: string, locationData: UpdateLocationDto): Promise<EMSRequest> => {
    try {
      const response = await apiClient.patch(`${API_URL}/ems/${requestId}/location`, locationData);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to update location. Please try again.');
    }
  },

  // Update EMS request status (Paramedic/Admin)
  updateStatus: async (requestId: string, statusData: UpdateStatusDto): Promise<EMSRequest> => {
    try {
      const response = await apiClient.patch(`${API_URL}/ems/${requestId}/status`, statusData);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to update status. Please try again.');
    }
  },

  // Get all active EMS requests (Admin/Paramedic)
  getActiveRequests: async (): Promise<EMSRequest[]> => {
    try {
      const response = await apiClient.get(`${API_URL}/ems/active`);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to fetch active requests.');
    }
  },

  // Get user's EMS requests (Patient/Paramedic)
  getMyRequests: async (): Promise<EMSRequest[]> => {
    try {
      const response = await apiClient.get(`${API_URL}/ems/my-requests`);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to fetch your requests.');
    }
  },

  

  // Assign paramedic to request (Admin only)
  assignParamedic: async (requestId: string, paramedicId: string): Promise<EMSRequest> => {
    console.log("=== Assign Paramedic Debug Info ===");
    console.log("Request ID:", requestId);
    console.log("Paramedic ID:", paramedicId);

    if (!paramedicId || paramedicId === 'undefined' || paramedicId === 'null') {
      throw new Error('Paramedic ID is missing or invalid. Please log in again.');
    }

    if (!requestId) {
      throw new Error('Request ID is missing.');
    }

    try {
      const response = await apiClient.post(`${API_URL}/ems/${requestId}/assign/${paramedicId}`);
      console.log("Assignment successful:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Assignment error:", error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 400) {
        throw new Error('Cannot assign paramedic. Please check if you are available and the request is valid.');
      } else if (error.response?.status === 404) {
        throw new Error('Request or paramedic not found.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to accept this request.');
      }
      throw new Error('Failed to assign paramedic. Please try again.');
    }
  },

  // New method for assignment with location
  assignParamedicWithLocation: async (
    requestId: string, 
    paramedicId: string, 
    lat: number, 
    lng: number
  ): Promise<EMSRequest> => {
    console.log("=== Assign Paramedic With Location Debug Info ===");
    console.log("Request ID:", requestId);
    console.log("Paramedic ID:", paramedicId);
    console.log("Location:", { lat, lng });

    if (!paramedicId || paramedicId === 'undefined' || paramedicId === 'null') {
      throw new Error('Paramedic ID is missing or invalid. Please log in again.');
    }

    if (!requestId) {
      throw new Error('Request ID is missing.');
    }

    if (!lat || !lng) {
      throw new Error('Location coordinates are required.');
    }

    try {
      const response = await apiClient.post(
        `${API_URL}/ems/${requestId}/assign/${paramedicId}/with-location`,
        { lat, lng }
      );
      console.log("Assignment with location successful:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Assignment with location error:", error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 400) {
        throw new Error('Cannot assign paramedic. Please check if you are available and the request is valid.');
      } else if (error.response?.status === 404) {
        throw new Error('Request or paramedic not found.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to accept this request.');
      }
      throw new Error('Failed to assign paramedic with location. Please try again.');
    }
  },

  // Get EMS request by ID
  getRequestById: async (requestId: string): Promise<EMSRequest> => {
    try {
      const response = await apiClient.get(`${API_URL}/ems/${requestId}`);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to fetch request details.');
    }
  },
};

// Emergency type labels and icons
export const EMERGENCY_TYPE_CONFIG = {
  [EmergencyType.CARDIAC]: { label: 'Cardiac Emergency', icon: '💓', color: 'text-red-600' },
  [EmergencyType.RESPIRATORY]: { label: 'Respiratory Emergency', icon: '🫁', color: 'text-blue-600' },
  [EmergencyType.TRAUMA]: { label: 'Trauma', icon: '🩹', color: 'text-orange-600' },
  [EmergencyType.STROKE]: { label: 'Stroke', icon: '🧠', color: 'text-purple-600' },
  [EmergencyType.OVERDOSE]: { label: 'Overdose', icon: '💊', color: 'text-yellow-600' },
  [EmergencyType.ALLERGIC_REACTION]: { label: 'Allergic Reaction', icon: '🤧', color: 'text-green-600' },
  [EmergencyType.MENTAL_HEALTH]: { label: 'Mental Health Crisis', icon: '🧘', color: 'text-indigo-600' },
  [EmergencyType.ACCIDENT]: { label: 'Accident', icon: '🚗', color: 'text-gray-600' },
  [EmergencyType.FALL]: { label: 'Fall Injury', icon: '🤕', color: 'text-brown-600' },
  [EmergencyType.BURN]: { label: 'Burn Injury', icon: '🔥', color: 'text-red-500' },
  [EmergencyType.OTHER]: { label: 'Other Emergency', icon: '🚨', color: 'text-gray-500' },
};

// Priority labels and colors
export const PRIORITY_CONFIG = {
  [Priority.LOW]: { label: 'Low', color: 'bg-green-100 text-green-800', badgeColor: 'bg-green-500' },
  [Priority.MEDIUM]: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', badgeColor: 'bg-yellow-500' },
  [Priority.HIGH]: { label: 'High', color: 'bg-orange-100 text-orange-800', badgeColor: 'bg-orange-500' },
  [Priority.CRITICAL]: { label: 'Critical', color: 'bg-red-100 text-red-800', badgeColor: 'bg-red-500' },
};

// Status labels and colors
export const STATUS_CONFIG = {
  [EMSStatus.PENDING]: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  [EMSStatus.ENROUTE]: { label: 'En Route', color: 'bg-blue-100 text-blue-800' },
  [EMSStatus.ARRIVED]: { label: 'Arrived', color: 'bg-green-100 text-green-800' },
  [EMSStatus.COMPLETED]: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
  [EMSStatus.CANCELLED]: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};


