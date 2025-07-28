import React, { useState } from 'react';
import { Search, Pill, User, Calendar, AlertTriangle, Info, Clock, LogIn, X } from 'lucide-react';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  manufacturer?: string;
  price?: number;
}

export interface Prescription {
  id: string;
  name: string;
  prescribedBy: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  prescribedDate: Date;
  medicines: Medicine[];
}

interface PrescriptionCardProps {
  prescription: Prescription;
  onGetInfo: (medicineName: string) => void;
  onGetSideEffects: (medicineName: string) => void;
  onGetUsage: (medicineName: string) => void;
  onViewPrescription: (prescriptionName: string) => void;
  isLoading: boolean;
}

interface MedicineCardProps {
  medicine: Medicine;
  prescriptionName: string;
  onGetInfo: (medicineName: string) => void;
  onGetSideEffects: (medicineName: string) => void;
  onGetUsage: (medicineName: string) => void;
  isLoading: boolean;
}

interface QuickActionButtonsProps {
  onMyPrescriptions: () => void;
  onMyMedicines: () => void;
  onMedicineSearch: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface MedicineSearchProps {
  onSearch: (query: string) => void;
  suggestions: Medicine[];
  onSuggestionSelect: (medicine: Medicine) => void;
  isLoading: boolean;
}

interface LoginPromptProps {
  onLogin: () => void;
  onClose: () => void;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ 
  prescription, 
  onGetInfo, 
  onGetSideEffects, 
  onGetUsage,
  onViewPrescription,
  isLoading 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const doctorName = `Dr. ${prescription.prescribedBy.user.firstName} ${prescription.prescribedBy.user.lastName}`;
  const prescribedDate = new Date(prescription.prescribedDate).toLocaleDateString();

  return (
    <div className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h5 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Pill className="w-4 h-4 mr-2 text-blue-600" />
            {prescription.name}
          </h5>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              {doctorName}
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {prescribedDate}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {isExpanded ? 'Collapse' : `View ${prescription.medicines.length} Medicine(s)`}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => onViewPrescription(prescription.name)}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Info className="w-3 h-3 mr-1 inline" />
          Details
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-slate-600 pt-3 space-y-3">
          {prescription.medicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              prescriptionName={prescription.name}
              onGetInfo={onGetInfo}
              onGetSideEffects={onGetSideEffects}
              onGetUsage={onGetUsage}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const MedicineCard: React.FC<MedicineCardProps> = ({ 
  medicine, 
  prescriptionName,
  onGetInfo, 
  onGetSideEffects, 
  onGetUsage,
  isLoading 
}) => {
  return (
    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 border-l-4 border-green-500">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h6 className="font-medium text-gray-900 dark:text-gray-100">{medicine.name}</h6>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {medicine.dosage} • {medicine.frequency}
              </span>
              {medicine.duration && (
                <span>Duration: {medicine.duration}</span>
              )}
            </div>
            {medicine.manufacturer && (
              <div className="text-xs mt-1">By {medicine.manufacturer}</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onGetUsage(medicine.name)}
          disabled={isLoading}
          className="px-2 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded text-xs font-medium transition-colors disabled:opacity-50"
        >
          What it does
        </button>
        <button
          onClick={() => onGetSideEffects(medicine.name)}
          disabled={isLoading}
          className="px-2 py-1 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-700 dark:text-orange-300 rounded text-xs font-medium transition-colors disabled:opacity-50"
        >
          Side effects
        </button>
        <button
          onClick={() => onGetInfo(medicine.name)}
          disabled={isLoading}
          className="px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-xs font-medium transition-colors disabled:opacity-50"
        >
          More info
        </button>
      </div>
    </div>
  );
};

export const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({ 
  onMyPrescriptions, 
  onMyMedicines, 
  onMedicineSearch,
  isAuthenticated,
  isLoading 
}) => {
  if (!isAuthenticated) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
          🔒 Log in to access your medicine information
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">💊 Quick Actions:</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onMyPrescriptions}
          disabled={isLoading}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
        >
          <Pill className="w-3 h-3 mr-1" />
          My Prescriptions
        </button>
        <button
          onClick={onMyMedicines}
          disabled={isLoading}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
        >
          <Pill className="w-3 h-3 mr-1" />
          My Medicines
        </button>
        <button
          onClick={onMedicineSearch}
          disabled={isLoading}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
        >
          <Search className="w-3 h-3 mr-1" />
          Search Medicine
        </button>
      </div>
    </div>
  );
};

export const MedicineSearch: React.FC<MedicineSearchProps> = ({ 
  onSearch, 
  suggestions, 
  onSuggestionSelect,
  isLoading 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
        <Search className="w-4 h-4 mr-2" />
        Search Medicine Information
      </h4>

      <form onSubmit={handleSearch} className="mb-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter medicine name..."
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Suggestions from your medicines:</p>
          {suggestions.map((medicine) => (
            <button
              key={medicine.id}
              onClick={() => onSuggestionSelect(medicine)}
              className="w-full text-left p-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded border border-gray-200 dark:border-slate-600 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">{medicine.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{medicine.dosage} • {medicine.frequency}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const LoginPrompt: React.FC<LoginPromptProps> = ({ onLogin, onClose }) => {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
          <h4 className="font-semibold text-blue-800 dark:text-blue-300">Login Required</h4>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
        Access your personalized medicine information and prescription details.
      </p>
      
      <button
        onClick={onLogin}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Log In Now
      </button>
    </div>
  );
};