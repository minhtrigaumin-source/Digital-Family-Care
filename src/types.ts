export interface WardInfo {
  name: string;
  district: string;
  province: string;
  population: number;
  healthCenterPhone: string;
  healthCenterAddress: string;
}

export interface VaccineRecord {
  name: string;
  status: 'fully' | 'partial' | 'none';
  dateAdministered?: string;
}

export interface MetricHistory {
  date: string;
  bloodPressureSys: number;
  bloodPressureDia: number;
  bloodSugar: number;
  weight: number;
}

export interface HouseholdMember {
  id: string; // CCCD / Identity Code
  fullName: string;
  relationship: string; // Quan hệ với chủ hộ
  gender: 'Nam' | 'Nữ' | 'Khác';
  dob: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  height: number; // cm
  weight: number; // kg
  bloodPressureSys: number; // Tâm thu (mmHg)
  bloodPressureDia: number; // Tâm trương (mmHg)
  bloodSugar: number; // mmol/l (fasting)
  chronicConditions: string[]; // Bệnh nền: Đái tháo đường, Tăng huyết áp, vv
  vaccines: VaccineRecord[];
  lastCheckup: string;
  nextCheckup?: string;
  notes: string;
  riskLevel: 'healthy' | 'warning' | 'danger'; // xanh, vàng, đỏ
  metricHistory: MetricHistory[];
  medications?: MedicationReminder[];
  appointments?: FollowUpAppointment[];
}

export interface MedicationReminder {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string[]; // e.g. ["Sáng", "Trưa", "Tối"]
  status: 'active' | 'completed';
  takenDates?: string[]; // YYYY-MM-DD
  notes?: string;
}

export interface FollowUpAppointment {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  facility: string; // Cơ sở khám chữa bệnh
  reason: string; // Lý do tái khám
  doctorName?: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Household {
  id: string; // Mã hộ gia đình (e.g. HGĐ-001)
  headName: string;
  address: string;
  phoneNumber: string;
  quarter: string; // Khu phố (e.g. Khu phố 1)
  neighborhoodGroup: string; // Tổ dân phố (e.g. Tổ 4)
  members: HouseholdMember[];
  createdAt: string;
}

export interface EpidemiologicalAlert {
  id: string;
  type: 'Sốt xuất huyết' | 'Tay chân miệng' | 'Cúm mùa' | 'Sởi' | 'Khác';
  location: string; // Tổ dân phố / Khu vực bị ảnh hưởng
  casesCount: number;
  riskLevel: 'Cao' | 'Trung bình' | 'Thấp';
  announcementDate: string;
  recommendation: string;
  active: boolean;
}

export interface PackageRegistration {
  id: string;
  packKey: string;
  packName: string;
  repName: string;
  repPhone: string;
  repEmail: string;
  repWardName: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  notes?: string;
}

