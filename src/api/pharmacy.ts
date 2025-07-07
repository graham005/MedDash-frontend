// Main pharmacy API exports
export * from './medicine';
export * from './prescription';
export * from './pharmacy-order';

// Re-export commonly used types
export type { 
  Medicine, 
  CreateMedicineDto, 
  UpdateMedicineDto 
} from './medicine';

export type { 
  Prescription, 
  CreatePrescriptionDto, 
  UpdatePrescriptionDto,
  MedicationDto
} from './prescription';

export type { 
  PharmacyOrder, 
  CreatePharmacyOrderDto, 
  UpdatePharmacyOrderDto,
  OrderStatus
} from './pharmacy-order';

// Utility functions for pharmacy operations
export const pharmacyUtils = {
  // Format medication display text
  formatMedication: (medication: any): string => {
    return `${medication.dosage} - ${medication.frequency} for ${medication.duration}`;
  },

  // Calculate total order value (if needed for future features)
  calculateOrderValue: (medications: any[], medicines: any[]): number => {
    return medications.reduce((total, med) => {
      const medicine = medicines.find(m => m.id === med.medicineId);
      return total + (medicine?.price || 0);
    }, 0);
  },

  // Check if prescription is expired
  isPrescriptionExpired: (prescriptionDate: string, daysValid: number = 30): boolean => {
    const prescDate = new Date(prescriptionDate);
    const expiryDate = new Date(prescDate.getTime() + (daysValid * 24 * 60 * 60 * 1000));
    return new Date() > expiryDate;
  },

  // Format order status for display
  formatOrderStatus: (status: string): string => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  },
};