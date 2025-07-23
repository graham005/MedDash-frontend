export enum UserRole{
    ADMIN = 'admin',
    PATIENT = 'patient',
    DOCTOR = 'doctor',
    PHARMACIST = 'pharmacist',
    PARAMEDIC = "PARAMEDIC",
}

export enum UserStatus {
    ACTIVE = 'active',
    PENDING = 'pending',
    SUSPENDED = 'suspended'
}

export enum EMSStatus {
  PENDING = 'pending',
  ENROUTE = 'enroute',
  ARRIVED = 'arrived',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum EmergencyType {
  CARDIAC = 'cardiac',
  RESPIRATORY = 'respiratory',
  TRAUMA = 'trauma',
  STROKE = 'stroke',
  OVERDOSE = 'overdose',
  ALLERGIC_REACTION = 'allergic_reaction',
  MENTAL_HEALTH = 'mental_health',
  ACCIDENT = 'accident',
  FALL = 'fall',
  BURN = 'burn',
  OTHER = 'other'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
