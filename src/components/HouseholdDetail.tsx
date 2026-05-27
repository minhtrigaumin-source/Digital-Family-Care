import React, { useState } from 'react';
import { 
  ArrowLeft, MapPin, Phone, Building2, UserPlus, FileText, CheckCircle, 
  AlertTriangle, AlertCircle, Edit3, Trash2, Calendar, Droplets, LineChart, Activity, HelpCircle, Dumbbell, GlassWater, Apple, ChevronDown, Check, Circle,
  Pill, Bell, Clock, Plus, X
} from 'lucide-react';
import { 
  LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Household, HouseholdMember, VaccineRecord, MedicationReminder, FollowUpAppointment } from '../types';
import { defaultVaccineList } from '../initialData';

interface HouseholdDetailProps {
  household: Household;
  onBack: () => void;
  onAddMember: (householdId: string, member: HouseholdMember) => void;
  onUpdateMember: (householdId: string, memberId: string, updatedMember: HouseholdMember) => void;
  onDeleteMember: (householdId: string, memberId: string) => void;
  onAskAIAboutMember: (member: HouseholdMember) => void;
  user?: { name: string; email: string; role: 'officer' | 'admin' } | null;
}

export default function HouseholdDetail({
  household,
  onBack,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onAskAIAboutMember,
  user
}: HouseholdDetailProps) {
  // Selected member inside the household for stats chart and updates
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    household.members[0]?.id || ''
  );

  const [activeMedicalTab, setActiveMedicalTab] = useState<'vaccines' | 'medications' | 'appointments'>('vaccines');

  // Medication Reminder Form states
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('1 viên');
  const [medFrequency, setMedFrequency] = useState('1 lần/ngày');
  const [medTimeOfDay, setMedTimeOfDay] = useState<string[]>(['Sáng']);
  const [medNotes, setMedNotes] = useState('');

  // Clinical Appointment Form states
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [appDate, setAppDate] = useState('');
  const [appTime, setAppTime] = useState('08:00');
  const [appFacility, setAppFacility] = useState('Trạm Y tế Phường Tân Hưng');
  const [appReason, setAppReason] = useState('');
  const [appDoctor, setAppDoctor] = useState('');
  const [appNotes, setAppNotes] = useState('');

  // Adding Member form state
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [mName, setMName] = useState('');
  const [mRelation, setMRelation] = useState('Con');
  const [mGender, setMGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [mDob, setMDob] = useState('');
  const [mBloodType, setMBloodType] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'>('O+');
  const [mHeight, setMHeight] = useState(160);
  const [mWeight, setMWeight] = useState(55);
  const [mBPSys, setMBPSys] = useState(115);
  const [mBPDia, setMBPDia] = useState(75);
  const [mSugar, setMSugar] = useState(5.0);
  const [mChronic, setMChronic] = useState('');
  const [mNotes, setMNotes] = useState('');

  // Editing Health Metrics State
  const [isEditingMetrics, setIsEditingMetrics] = useState<string | null>(null);
  const [editHeight, setEditHeight] = useState(160);
  const [editWeight, setEditWeight] = useState(55);
  const [editBPSys, setEditBPSys] = useState(120);
  const [editBPDia, setEditBPDia] = useState(80);
  const [editSugar, setEditSugar] = useState(5.2);
  const [editNotes, setEditNotes] = useState('');

  // Selected member details
  const selectedMember = household.members.find(m => m.id === selectedMemberId);

  // Risk recalculation function based on criteria
  const calculateRisk = (sys: number, dia: number, sugar: number, weight: number, heightCm: number): 'healthy' | 'warning' | 'danger' => {
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    // Blood pressure
    const isDangerBP = sys >= 150 || dia >= 95;
    const isWarningBP = sys >= 135 || dia >= 85;
    // Sugar
    const isDangerSugar = sugar >= 7.5;
    const isWarningSugar = sugar >= 5.6;
    // Obesity
    const isObese = bmi >= 25;

    if (isDangerBP || isDangerSugar) return 'danger';
    if (isWarningBP || isWarningSugar || isObese) return 'warning';
    return 'healthy';
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName) return;

    const risk = calculateRisk(mBPSys, mBPDia, mSugar, mWeight, mHeight);

    // Initial vaccine list filled empty
    const initialVaccines: VaccineRecord[] = defaultVaccineList.map(name => ({
      name,
      status: 'none'
    }));

    const newMember: HouseholdMember = {
      id: `MB-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: mName,
      relationship: mRelation,
      gender: mGender,
      dob: mDob || "1990-01-01",
      bloodType: mBloodType,
      height: Number(mHeight),
      weight: Number(mWeight),
      bloodPressureSys: Number(mBPSys),
      bloodPressureDia: Number(mBPDia),
      bloodSugar: Number(mSugar),
      chronicConditions: mChronic ? mChronic.split(',').map(s => s.trim()).filter(Boolean) : [],
      vaccines: initialVaccines,
      lastCheckup: new Date().toISOString().split('T')[0],
      notes: mNotes,
      riskLevel: risk,
      metricHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          bloodPressureSys: Number(mBPSys),
          bloodPressureDia: Number(mBPDia),
          bloodSugar: Number(mSugar),
          weight: Number(mWeight)
        }
      ]
    };

    onAddMember(household.id, newMember);
    setSelectedMemberId(newMember.id);
    
    // reset form
    setMName('');
    setMDob('');
    setMChronic('');
    setMNotes('');
    setIsAddingMember(false);
  };

  // Turn on edit mode for single member metrics
  const triggerEditMetrics = (m: HouseholdMember) => {
    setIsEditingMetrics(m.id);
    setEditHeight(m.height);
    setEditWeight(m.weight);
    setEditBPSys(m.bloodPressureSys);
    setEditBPDia(m.bloodPressureDia);
    setEditSugar(m.bloodSugar);
    setEditNotes(m.notes);
  };

  const handleSaveMetrics = (m: HouseholdMember) => {
    const risk = calculateRisk(editBPSys, editBPDia, editSugar, editWeight, editHeight);

    // Create entry in checking history
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedHistory = [...m.metricHistory];
    
    // Check if we already have a record for today, update it, otherwise push new one
    const existingIndex = updatedHistory.findIndex(h => h.date === todayStr);
    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = {
        date: todayStr,
        bloodPressureSys: Number(editBPSys),
        bloodPressureDia: Number(editBPDia),
        bloodSugar: Number(editSugar),
        weight: Number(editWeight)
      };
    } else {
      updatedHistory.push({
        date: todayStr,
        bloodPressureSys: Number(editBPSys),
        bloodPressureDia: Number(editBPDia),
        bloodSugar: Number(editSugar),
        weight: Number(editWeight)
      });
    }

    const updatedM: HouseholdMember = {
      ...m,
      height: Number(editHeight),
      weight: Number(editWeight),
      bloodPressureSys: Number(editBPSys),
      bloodPressureDia: Number(editBPDia),
      bloodSugar: Number(editSugar),
      riskLevel: risk,
      notes: editNotes,
      lastCheckup: todayStr,
      metricHistory: updatedHistory
    };

    onUpdateMember(household.id, m.id, updatedM);
    setIsEditingMetrics(null);
  };

  // HANDLERS FOR MEDICATION REMINDERS
  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !medName) return;

    const currentMeds = selectedMember.medications ? [...selectedMember.medications] : [];
    const newMed: MedicationReminder = {
      id: `MED-${Math.floor(1000 + Math.random() * 9000)}`,
      name: medName,
      dosage: medDosage || "1 viên",
      frequency: medFrequency,
      timeOfDay: medTimeOfDay.length > 0 ? medTimeOfDay : ["Sáng"],
      status: 'active',
      takenDates: [],
      notes: medNotes
    };

    const updatedM: HouseholdMember = {
      ...selectedMember,
      medications: [...currentMeds, newMed]
    };

    onUpdateMember(household.id, selectedMember.id, updatedM);
    setIsAddingMed(false);
    
    // reset form
    setMedName('');
    setMedDosage('1 viên');
    setMedFrequency('1 lần/ngày');
    setMedTimeOfDay(['Sáng']);
    setMedNotes('');
  };

  const handleToggleMedTakenStatus = (medId: string) => {
    if (!selectedMember || !selectedMember.medications) return;

    const todayStr = "2026-05-22"; // Simulated current date
    const updatedMeds = selectedMember.medications.map(med => {
      if (med.id === medId) {
        const takenDates = med.takenDates ? [...med.takenDates] : [];
        if (takenDates.includes(todayStr)) {
          return {
            ...med,
            takenDates: takenDates.filter(d => d !== todayStr)
          };
        } else {
          return {
            ...med,
            takenDates: [...takenDates, todayStr]
          };
        }
      }
      return med;
    });

    const updatedM: HouseholdMember = {
      ...selectedMember,
      medications: updatedMeds
    };

    onUpdateMember(household.id, selectedMember.id, updatedM);
  };

  const handleDeleteMedication = (medId: string) => {
    if (!selectedMember || !selectedMember.medications) return;

    const updatedMeds = selectedMember.medications.filter(med => med.id !== medId);
    
    const updatedM: HouseholdMember = {
      ...selectedMember,
      medications: updatedMeds
    };

    onUpdateMember(household.id, selectedMember.id, updatedM);
  };

  // HANDLERS FOR CLINICAL APPOINTMENTS
  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !appDate || !appReason) return;

    const currentApps = selectedMember.appointments ? [...selectedMember.appointments] : [];
    const newApp: FollowUpAppointment = {
      id: `APP-${Math.floor(1000 + Math.random() * 9000)}`,
      date: appDate,
      time: appTime || "08:00",
      facility: appFacility || "Trạm Y tế Phường Tân Hưng",
      reason: appReason,
      doctorName: appDoctor,
      status: 'pending',
      notes: appNotes
    };

    const sortedApps = [...currentApps, newApp].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Dynamic next checkup updates
    const pendingApps = sortedApps.filter(a => a.status === 'pending');
    let nextCheckDate = selectedMember.nextCheckup;
    if (pendingApps.length > 0) {
      nextCheckDate = pendingApps[0].date;
    }

    const updatedM: HouseholdMember = {
      ...selectedMember,
      appointments: sortedApps,
      nextCheckup: nextCheckDate
    };

    onUpdateMember(household.id, selectedMember.id, updatedM);
    setIsAddingApp(false);

    // reset form
    setAppDate('');
    setAppTime('08:00');
    setAppFacility('Trạm Y tế Phường Tân Hưng');
    setAppReason('');
    setAppDoctor('');
    setAppNotes('');
  };

  const handleToggleAppStatus = (appId: string, nextStatus: 'pending' | 'completed' | 'cancelled') => {
    if (!selectedMember || !selectedMember.appointments) return;

    const updatedApps = selectedMember.appointments.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          status: nextStatus
        };
      }
      return app;
    });

    const pendingApps = updatedApps
      .filter(a => a.status === 'pending')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    let nextCheckDate = selectedMember.nextCheckup;
    if (pendingApps.length > 0) {
      nextCheckDate = pendingApps[0].date;
    } else {
      nextCheckDate = undefined;
    }

    let lastCheckDate = selectedMember.lastCheckup;
    if (nextStatus === 'completed') {
      const completedApp = updatedApps.find(a => a.id === appId);
      if (completedApp) {
        lastCheckDate = completedApp.date;
      }
    }

    const updatedM: HouseholdMember = {
      ...selectedMember,
      appointments: updatedApps,
      nextCheckup: nextCheckDate,
      lastCheckup: lastCheckDate
    };

    onUpdateMember(household.id, selectedMember.id, updatedM);
  };

  const handleDeleteAppointment = (appId: string) => {
    if (!selectedMember || !selectedMember.appointments) return;

    const updatedApps = selectedMember.appointments.filter(app => app.id !== appId);

    const pendingApps = updatedApps
      .filter(a => a.status === 'pending')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let nextCheckDate = selectedMember.nextCheckup;
    if (pendingApps.length > 0) {
      nextCheckDate = pendingApps[0].date;
    } else {
      nextCheckDate = undefined;
    }

    const updatedM: HouseholdMember = {
      ...selectedMember,
      appointments: updatedApps,
      nextCheckup: nextCheckDate
    };

    onUpdateMember(household.id, selectedMember.id, updatedM);
  };

  // Helper checking status of a vaccine inside member's records
  const getVaccineStatusAndDate = (m: HouseholdMember, name: string) => {
    const existing = m.vaccines?.find(v => v.name === name);
    if (existing) {
      return { status: existing.status, dateAdministered: existing.dateAdministered };
    }
    return { status: 'none' as const, dateAdministered: undefined };
  };

  // Computes which vaccines are due, urgent, or unvaccinated based on age and history
  const analyzeVaccines = (m: HouseholdMember) => {
    const dobDate = new Date(m.dob);
    // Use simulated date 2026-05-22 or current date
    const curDate = new Date("2026-05-22");
    
    // Calculate precise age
    let ageInMonths = (curDate.getFullYear() - dobDate.getFullYear()) * 12 + (curDate.getMonth() - dobDate.getMonth());
    if (curDate.getDate() < dobDate.getDate()) {
      ageInMonths--;
    }
    const ageInYears = ageInMonths / 12;

    const dueList: { name: string; reason: string; priority: 'high' | 'medium' | 'low'; type: 'due' }[] = [];
    const missingList: { name: string; reason: string; type: 'unvaccinated' }[] = [];

    defaultVaccineList.forEach(vName => {
      const { status, dateAdministered } = getVaccineStatusAndDate(m, vName);

      if (status === 'fully') {
        // Cúm mùa is annual. If administered over a year ago, it is due again
        if (vName === "Cúm mùa (Hàng năm)" && dateAdministered) {
          const lastDate = new Date(dateAdministered);
          const diffYears = (curDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
          if (diffYears >= 1.0) {
            dueList.push({
              name: vName,
              reason: `Mũi cúm mùa cuối tiêm ngày ${dateAdministered}. Cần tái chủng ngừa hàng năm để duy trì miễn dịch.`,
              priority: m.chronicConditions.length > 0 || ageInYears >= 60 || ageInYears <= 5 ? 'high' : 'medium',
              type: 'due'
            });
          }
        }
        return;
      }

      // Vaccine is partial, none, or missing entirely from their record
      if (vName === "Lao (BCG)") {
        if (status === 'partial') {
          dueList.push({
            name: vName,
            reason: "Cần tiêm đủ liều bổ sung Lao theo chỉ định của Trạm y tế.",
            priority: 'high',
            type: 'due'
          });
        } else {
          if (ageInYears <= 1/12) {
            dueList.push({
              name: vName,
              reason: "Trẻ sơ sinh dưới 1 tháng tuổi đến kỳ tiêm chủng Lao (BCG) bắt buộc.",
              priority: 'high',
              type: 'due'
            });
          } else {
            missingList.push({
              name: vName,
              reason: "Chưa ghi nhận mũi tiêm ngừa Lao từ lúc sinh cơ bản. Cần khám sàng lọc bổ sung gấp.",
              type: 'unvaccinated'
            });
          }
        }
      }

      else if (vName === "Viêm gan B") {
        if (status === 'partial') {
          dueList.push({
            name: vName,
            reason: "Đến hạn tiêm mũi nhắc bổ sung vắc-xin Viêm gan B phác đồ dồn.",
            priority: 'high',
            type: 'due'
          });
        } else {
          if (ageInYears <= 1.0) {
            dueList.push({
              name: vName,
              reason: "Sơ sinh đến hạn hoàn thành phác đồ 3 mũi Viêm gan B cơ bản.",
              priority: 'high',
              type: 'due'
            });
          } else {
            missingList.push({
              name: vName,
              reason: "Chưa ghi nhận tiền sử tiêm vắc-xin bảo vệ tế bào gan (Viêm gan B) phòng chống ung thư gan.",
              type: 'unvaccinated'
            });
          }
        }
      }

      else if (vName === "Bạch hầu - Ho gà - Uốn ván") {
        if (status === 'partial') {
          dueList.push({
            name: vName,
            reason: "Đến lịch tiêm nhắc mũi tiếp theo của phác đồ Bạch hầu - Ho gà - Uốn ván (DPT/5-trong-1).",
            priority: 'high',
            type: 'due'
          });
        } else {
          if (ageInYears <= 6.0) {
            dueList.push({
              name: vName,
              reason: "Trẻ nhỏ đạt độ tuổi vàng bắt buộc tiêm phòng Bạch hầu, Ho gà, Uốn ván để đi học mẫu giáo.",
              priority: 'high',
              type: 'due'
            });
          } else {
            missingList.push({
              name: vName,
              reason: "Mất dấu lịch sử tiêm phòng DPT hoặc chưa được tiêm nhắc uốn ván người lớn định kỳ (khuyên tiêm mỗi 10 năm).",
              type: 'unvaccinated'
            });
          }
        }
      }

      else if (vName === "Sởi - Quai bị - Rubella") {
        if (status === 'partial') {
          dueList.push({
            name: vName,
            reason: "Cần tiêm mũi sởi - quai bị thứ 2 để đạt miễn dịch tối đa chống dịch lây lan.",
            priority: 'high',
            type: 'due'
          });
        } else {
          if (ageInMonths >= 9 && ageInYears <= 6.0) {
            dueList.push({
              name: vName,
              reason: "Trẻ từ 9 tháng trở lên cần tiêm ngay vaccine Sởi cơ bản phòng ngừa tàn phế biến chứng sởi.",
              priority: 'high',
              type: 'due'
            });
          } else if (ageInMonths >= 9) {
            missingList.push({
              name: vName,
              reason: "Chưa có hồ sơ chủng ngừa vắc-xin MMR phối hợp. Nguy cơ lây nhiễm chéo cao.",
              type: 'unvaccinated'
            });
          }
        }
      }

      else if (vName === "Viêm não Nhật Bản") {
        if (status === 'partial') {
          dueList.push({
            name: vName,
            reason: "Chưa đủ số mũi khuyến cáo phòng ngừa viêm màng não cấp.",
            priority: 'high',
            type: 'due'
          });
        } else {
          if (ageInYears >= 1.0 && ageInYears <= 15) {
            dueList.push({
              name: vName,
              reason: "Trẻ trên 1 tuổi đến hạn tiêm phòng chủng Nhật Bản (Mũi 1 hoặc mũi 2 dịch vụ/mở rộng).",
              priority: 'medium',
              type: 'due'
            });
          } else if (ageInYears >= 1.0) {
            missingList.push({
              name: vName,
              reason: "Chưa tiêm vaccine phòng virus Viêm não Nhật Bản nguy hiểm.",
              type: 'unvaccinated'
            });
          }
        }
      }

      else if (vName === "Thủy đậu (Varicella)") {
        if (status === 'partial') {
          dueList.push({
            name: vName,
            reason: "Đến hạn tiêm mũi 2 nhắc thủy đậu (sau mũi 1 tối thiểu 3 tháng).",
            priority: 'medium',
            type: 'due'
          });
        } else {
          if (ageInYears >= 1.0 && ageInYears <= 18) {
            dueList.push({
              name: vName,
              reason: "Học sinh sinh viên có nguy cơ bùng dịch thủy đậu cao, khuyên dùng tiêm phòng dịch vụ.",
              priority: 'medium',
              type: 'due'
            });
          } else if (ageInYears >= 1.0) {
            missingList.push({
              name: vName,
              reason: "Không tìm thấy hồ sơ chủng ngừa vắc-xin thủy đậu.",
              type: 'unvaccinated'
            });
          }
        }
      }

      else if (vName === "Phế cầu khuẩn") {
        if (status === 'partial') {
          dueList.push({
            name: vName,
            reason: "Đến hạn tiêm nhắc mũi phế cầu (Synflorix/Prevenar 13) bảo dưỡng đề kháng.",
            priority: 'medium',
            type: 'due'
          });
        } else {
          if ((ageInMonths >= 2 && ageInYears <= 5) || ageInYears >= 60) {
            dueList.push({
              name: vName,
              reason: ageInYears >= 60 
                ? "Người già trên 60 là nhóm nguy cơ hàng đầu viêm phổi phế cầu. Cần chủ động bảo vệ phế nang."
                : "Trẻ em dưới 5 tuổi đến hạn tiêm mũi phế cầu bảo vệ đường thở hô hấp.",
              priority: 'high',
              type: 'due'
            });
          } else if (ageInMonths >= 2) {
            missingList.push({
              name: vName,
              reason: "Chưa khởi động chương trình chủng ngừa phế cầu phòng bệnh viêm phổi mãn.",
              type: 'unvaccinated'
            });
          }
        }
      }

      else if (vName === "Cúm mùa (Hàng năm)") {
        dueList.push({
          name: vName,
          reason: m.chronicConditions.length > 0
            ? "Bệnh nhân có bệnh nền hô hấp/mãn tính đặc biệt dễ suy hô hấp khi cúm. Cần tiêm khẩn cấp."
            : ageInYears >= 60
            ? "Người cao tuổi cần tái kích hoạt kháng thể cúm mỗi 12 tháng tránh biến chứng phổi."
            : "Vắc-xin cúm cần lặp lại hàng năm do biến chủng kháng kháng nguyên liên tục.",
          priority: m.chronicConditions.length > 0 || ageInYears >= 60 || ageInYears <= 5 ? 'high' : 'medium',
          type: 'due'
        });
      }

      else if (vName === "COVID-19 (Mũi cơ bản)") {
        if (status === 'partial') {
          dueList.push({
            name: vName,
            reason: "Cần hoàn thành nốt liều cơ bản mũi 2 để tạo màng bảo hộ tối thiểu.",
            priority: 'high',
            type: 'due'
          });
        } else {
          if (ageInYears >= 5.0) {
            dueList.push({
              name: vName,
              reason: "Chưa ghi nhận mũi cơ bản COVID-19 nào. Khuyên tiêm chủ động.",
              priority: 'high',
              type: 'due'
            });
          }
        }
      }

      else if (vName === "COVID-19 (Mũi nhắc lại)") {
        if (status === 'partial') {
          dueList.push({
            name: vName,
            reason: "Đến lịch tiêm mũi bổ sung tăng cường (mũi nhắc 1 hoặc mũi nhắc 2).",
            priority: 'medium',
            type: 'due'
          });
        } else {
          if (ageInYears >= 12.0) {
            const basicStatus = getVaccineStatusAndDate(m, "COVID-19 (Mũi cơ bản)").status;
            if (basicStatus === 'fully') {
              dueList.push({
                name: vName,
                reason: "Đến thời điểm tiêm liều tăng cường (Booster) định kỳ phòng chống suy giảm miễn dịch tự nhiên.",
                priority: 'medium',
                type: 'due'
              });
            } else {
              missingList.push({
                name: vName,
                reason: "Chưa hoàn thành liệu trình vắc-xin COVID-19 cơ bản nên chưa chỉ định tiêm mũi nhắc lại.",
                type: 'unvaccinated'
              });
            }
          }
        }
      }
    });

    return { dueList, missingList };
  };

  // Toggle Vaccine record by vaccine name
  const handleToggleVaccine = (m: HouseholdMember, vaccineName: string) => {
    const currentVaccines = m.vaccines ? [...m.vaccines] : [];
    const foundIndex = currentVaccines.findIndex(v => v.name === vaccineName);
    
    let currentStatus: 'fully' | 'partial' | 'none' = 'none';
    if (foundIndex >= 0) {
      currentStatus = currentVaccines[foundIndex].status;
    }

    let nextStatus: 'fully' | 'partial' | 'none' = 'none';
    if (currentStatus === 'none') nextStatus = 'partial';
    else if (currentStatus === 'partial') nextStatus = 'fully';
    else nextStatus = 'none';

    const updatedRecord: VaccineRecord = {
      name: vaccineName,
      status: nextStatus,
      dateAdministered: nextStatus !== 'none' ? new Date().toISOString().split('T')[0] : undefined
    };

    if (foundIndex >= 0) {
      currentVaccines[foundIndex] = updatedRecord;
    } else {
      currentVaccines.push(updatedRecord);
    }

    const updatedM = {
      ...m,
      vaccines: currentVaccines
    };

    onUpdateMember(household.id, m.id, updatedM);
  };

  // Helper calculating BMI dynamically
  const getBmiDetails = (weight: number, heightCm: number) => {
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    
    let classification = '';
    let color = '';
    // Asian standards (IDI&WPRO)
    if (bmi < 18.5) {
      classification = 'Thiếu cân / Gầy';
      color = 'text-amber-500';
    } else if (bmi < 23) {
      classification = 'Bình thường';
      color = 'text-emerald-500';
    } else if (bmi < 25) {
      classification = 'Thừa cân';
      color = 'text-orange-500';
    } else {
      classification = 'Béo phì';
      color = 'text-red-500 font-bold';
    }

    return { bmi: bmi.toFixed(1), classification, color };
  };

  return (
    <div className="space-y-6">
      
      {/* Detail header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-teal-50 text-teal-600 px-2 py-0.5 rounded uppercase">
                {household.id}
              </span>
              <span className="text-xs text-slate-400">Phân vùng quản lý: {household.quarter} - {household.neighborhoodGroup}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 font-display mt-0.5">
              Hộ sức khỏe chủ hộ: {household.headName}
            </h1>
          </div>
        </div>

        {user && (
          <div className="flex gap-2 self-stretch md:self-auto">
            <button
              onClick={() => setIsAddingMember(!isAddingMember)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 border border-teal-200 text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Khai sinh nhân khẩu mới
            </button>
          </div>
        )}
      </div>

      {/* Adding Member Block Form */}
      {isAddingMember && (
        <form onSubmit={handleAddMemberSubmit} className="bg-white rounded-2xl shadow-sm border border-brand-100 p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800">
              Đồng bộ thêm nhân khẩu thuộc Hộ {household.id}
            </h3>
            <span className="text-xs text-slate-400">Chủ hộ hiện tại: {household.headName}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Họ tên nhân khẩu <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="Nguyễn Thị Kim Thư"
                value={mName}
                onChange={e => setMName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Quan hệ với chủ hộ</label>
              <select 
                value={mRelation}
                onChange={e => setMRelation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs"
              >
                <option value="Bản thân">Bản thân (Chủ hộ tiếp quản)</option>
                <option value="Vợ">Vợ</option>
                <option value="Chồng">Chồng</option>
                <option value="Con">Con</option>
                <option value="Bố">Bố</option>
                <option value="Mẹ">Mẹ</option>
                <option value="Anh/Em">Anh / Chị / Em</option>
                <option value="Ông/Bà">Ông / Bà</option>
                <option value="Khác">Quan hệ Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Giới tính</label>
              <select 
                value={mGender}
                onChange={e => setMGender(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Ngày sinh</label>
              <input 
                type="date"
                value={mDob}
                onChange={e => setMDob(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Nhóm máu</label>
              <select 
                value={mBloodType}
                onChange={e => setMBloodType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Chiều cao (cm)</label>
              <input 
                type="number" 
                value={mHeight}
                onChange={e => setMHeight(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Cân nặng (kg)</label>
              <input 
                type="number" 
                value={mWeight}
                onChange={e => setMWeight(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Huyết áp Tâm thu</label>
              <input 
                type="number" 
                value={mBPSys}
                onChange={e => setMBPSys(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-teal-500"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs text-slate-600 mb-1">Huyết áp Tâm trương</label>
              <input 
                type="number" 
                value={mBPDia}
                onChange={e => setMBPDia(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Đường huyết lúc đói (mmol/L)</label>
              <input 
                type="number" 
                step="0.1"
                value={mSugar}
                onChange={e => setMSugar(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Bệnh nền khác (ngăn cách bằng dấu phẩy)</label>
              <input 
                type="text" 
                placeholder="Hen phế quản suyễn, Dị ứng tôm cua..."
                value={mChronic}
                onChange={e => setMChronic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Một số dặn dò lâm sàng / tóm tắt bệnh án cơ sở</label>
            <input 
              type="text" 
              placeholder="Có mang kính cận lực nhẹ, đang điều trị thuốc dự phòng đái tháo đường..."
              value={mNotes}
              onChange={e => setMNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-xs focus:outline-teal-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 text-xs cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 text-xs font-bold cursor-pointer"
            >
              Xác nhận lưu Member mới
            </button>
          </div>
        </form>
      )}

      {/* Main Panel Content: Split into Member Roster (Left) and Medical Tracker Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Member Roster list */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 px-1">
              Thành viên trong Hộ ({household.members.length})
            </h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {household.members.map((member) => {
                const isSelected = member.id === selectedMemberId;
                const age = new Date().getFullYear() - new Date(member.dob).getFullYear();

                return (
                  <div 
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected 
                        ? 'border-teal-500 bg-teal-50/20 shadow-sm' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${
                        member.riskLevel === 'danger' 
                          ? 'bg-red-500' 
                          : member.riskLevel === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`} />
                      
                      <div>
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          {member.fullName}
                          <span className="text-[9px] px-1.5 py-0.2 ml-0.5 bg-slate-100 rounded text-slate-500 font-medium">
                            {member.relationship}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{member.gender}, {age} tuổi - Nhóm máu {member.bloodType}</span>
                      </div>
                    </div>

                    {user && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Bạn chắc chắn muốn xóa nhân khẩu ${member.fullName} ra khỏi sổ quản lý?`)) {
                            onDeleteMember(household.id, member.id);
                            if (selectedMemberId === member.id) {
                              setSelectedMemberId(household.members.find(m => m.id !== member.id)?.id || '');
                            }
                          }
                        }}
                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition duration-200 cursor-pointer"
                        title="Xóa nhân khẩu này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ward Health Station Hotline Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow space-y-3 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-5 translate-y-5 text-slate-800 opacity-20">
              <Activity className="w-24 h-24" />
            </div>
            
            <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-widest">Đường dây nóng Phường</h4>
            <p className="text-xs leading-relaxed opacity-85">
              Để thông báo các trường hợp bệnh nhân nguy kịch, báo dịch sốt xuất huyết hoặc đăng ký lịch hẹn khám tại Trạm y tế.
            </p>
            <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
              <span className="font-medium">Số điện thoại khẩn:</span>
              <strong className="text-emerald-400 font-mono text-sm">028.3829.1352</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Active Member Metric Progress & Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedMember ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
              
              {/* Member detail header summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800 font-display">
                      {selectedMember.fullName}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedMember.riskLevel === 'danger'
                        ? 'bg-red-100 text-red-700'
                        : selectedMember.riskLevel === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      Mức: {selectedMember.riskLevel === 'danger' ? 'Nguy cơ cao' : selectedMember.riskLevel === 'warning' ? 'Cần lưu ý' : 'Khỏe mạnh'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Định danh y tế: {selectedMember.id} • Cập nhật y bạ ngày: {selectedMember.lastCheckup}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onAskAIAboutMember(selectedMember)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 shrink-0" /> Phân tích bởi Trợ lý AI
                  </button>

                  {user && (
                    <button
                      onClick={() => triggerEditMetrics(selectedMember)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-3.5 py-1.5 text-xs font-semibold scroll-py-1 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Ghi nhận chỉ số mới
                    </button>
                  )}
                </div>
              </div>

              {/* Editing Indicators Panel Option */}
              {isEditingMetrics === selectedMember.id && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <p className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-teal-600" /> Nhập chỉ số thăm khám định kỳ (Hôm nay)
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Chiều cao (cm)</label>
                      <input 
                        type="number"
                        value={editHeight}
                        onChange={e => setEditHeight(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Cân nặng (kg)</label>
                      <input 
                        type="number"
                        value={editWeight}
                        onChange={e => setEditWeight(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Huyết áp thu (Sys)</label>
                      <input 
                        type="number"
                        value={editBPSys}
                        onChange={e => setEditBPSys(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Huyết áp trương (Dia)</label>
                      <input 
                        type="number"
                        value={editBPDia}
                        onChange={e => setEditBPDia(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-teal-500"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[11px] text-slate-500 mb-1">Đường huyết lúc đói</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={editSugar}
                        onChange={e => setEditSugar(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-medium">Bệnh sử / Dặn dò lâm sàng</label>
                    <input 
                      type="text"
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-teal-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingMetrics(null)}
                      className="px-3 py-1.5 bg-slate-200 rounded hover:bg-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveMetrics(selectedMember)}
                      className="px-4 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 text-xs font-bold cursor-pointer"
                    >
                      Xác nhận đồng bộ hồ sơ
                    </button>
                  </div>
                </div>
              )}

              {/* Grid of basic parameters cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* BMI Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">BMI châu á</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-slate-800">
                      {getBmiDetails(selectedMember.weight, selectedMember.height).bmi}
                    </span>
                    <span className="text-[10px] text-slate-400">kg/m²</span>
                  </div>
                  <span className={`text-[10px] font-semibold block ${getBmiDetails(selectedMember.weight, selectedMember.height).color}`}>
                    {getBmiDetails(selectedMember.weight, selectedMember.height).classification}
                  </span>
                  <span className="text-[9px] text-slate-400 block pt-1 border-t border-slate-100/50">
                    Cao {selectedMember.height}cm / Nặng {selectedMember.weight}kg
                  </span>
                </div>

                {/* Blood Pressure Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">HUYẾT ÁP</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-slate-800">
                      {selectedMember.bloodPressureSys}/{selectedMember.bloodPressureDia}
                    </span>
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </div>
                  <span className={`text-[10px] font-semibold block ${
                    selectedMember.bloodPressureSys >= 140 || selectedMember.bloodPressureDia >= 90
                      ? 'text-red-500 font-bold'
                      : selectedMember.bloodPressureSys >= 130 || selectedMember.bloodPressureDia >= 80
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}>
                    {selectedMember.bloodPressureSys >= 140 || selectedMember.bloodPressureDia >= 90
                      ? 'Tăng Huyết Áp'
                      : selectedMember.bloodPressureSys >= 130 || selectedMember.bloodPressureDia >= 80
                      ? 'Huyết áp tiền cao'
                      : 'Huyết áp lý tưởng'}
                  </span>
                  <span className="text-[9px] text-slate-400 block pt-1 border-t border-slate-100/50">
                    Chuẩn phòng chống đột quỵ
                  </span>
                </div>

                {/* Blood Sugar Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ĐƯỜNG HUYẾT ĐÓI</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-slate-800">
                      {selectedMember.bloodSugar}
                    </span>
                    <span className="text-[10px] text-slate-400">mmol/L</span>
                  </div>
                  <span className={`text-[10px] font-semibold block ${
                    selectedMember.bloodSugar >= 7.0
                      ? 'text-red-500 font-bold'
                      : selectedMember.bloodSugar >= 5.6
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}>
                    {selectedMember.bloodSugar >= 7.0
                      ? 'Đái Tháo Đường'
                      : selectedMember.bloodSugar >= 5.6
                      ? 'Tiền Đái Tháo Đường'
                      : 'Đường huyết an toàn'}
                  </span>
                  <span className="text-[9px] text-slate-400 block pt-1 border-t border-slate-100/50">
                    Sàng lọc khám định kỳ lúc đói
                  </span>
                </div>

                {/* Chronic Disease and Blood Info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">NHÓM MÁU & HỆ BỆNH</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Droplets className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="text-xl font-bold text-slate-800">{selectedMember.bloodType}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 truncate block">
                    {selectedMember.chronicConditions.join(', ') || 'Không bệnh mãn tính'}
                  </span>
                  <span className="text-[9px] text-slate-400 block pt-1 border-t border-slate-100/50 truncate">
                    Tiền sử: {selectedMember.chronicConditions.length} bệnh nền
                  </span>
                </div>
              </div>

              {/* Historical indicators Progress Tracker Chart */}
              {selectedMember.metricHistory.length > 0 && (
                <div className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <LineChart className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Lịch Sử Kiểm Tra Chỉ Số Huyết Áp & Đường Huyết
                    </h3>
                  </div>

                  <div className="h-60 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLine data={selectedMember.metricHistory} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend tick={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="bloodPressureSys" stroke="#ef4444" strokeWidth={2.5} name="HA Tâm Thu (mmHg)" activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="bloodPressureDia" stroke="#3b82f6" strokeWidth={2} name="HA Tâm Trương (mmHg)" />
                        <Line type="monotone" dataKey="bloodSugar" stroke="#eab308" strokeWidth={2} name="Đường Huyết (mmol/L)" />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Multi-Tab Medical & Clinical Engine */}
              <div className="space-y-5">
                {/* Tab Header Selectors */}
                <div className="flex border-b border-slate-100 gap-1 pb-px overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveMedicalTab('vaccines')}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 cursor-pointer transition shrink-0 ${
                      activeMedicalTab === 'vaccines'
                        ? 'border-teal-600 text-teal-600 bg-teal-50/5'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Sổ Tiêm Chủng ({selectedMember.vaccines?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMedicalTab('medications')}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 cursor-pointer transition shrink-0 ${
                      activeMedicalTab === 'medications'
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/5'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Pill className="w-4 h-4 shrink-0" />
                    Nhắc Nhở Uống Thuốc ({selectedMember.medications?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMedicalTab('appointments')}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 cursor-pointer transition shrink-0 ${
                      activeMedicalTab === 'appointments'
                        ? 'border-sky-600 text-sky-600 bg-sky-50/5'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    Lịch Tái Khám ({selectedMember.appointments?.length || 0})
                  </button>
                </div>

                {/* Tab Content 1: Sổ Tiêm Chủng */}
                {activeMedicalTab === 'vaccines' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="pb-1">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
                        Sổ tiêm chủng y tế & Phân tích miễn dịch
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Hệ thống đồng bộ tự động dựa trên độ tuổi, lịch sử tiêm chủng lâm sàng từ Bộ Y Tế và Trạm y tế Phường</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Left Column: Sổ tiêm chủng hiện tại */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hồ sơ tiêm đã đăng ký</span>
                          {user && <span className="text-[9px] text-slate-400">Click để cập nhật nhanh</span>}
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {selectedMember.vaccines && selectedMember.vaccines.length > 0 ? (
                            selectedMember.vaccines.map((v, index) => (
                              <div 
                                key={index}
                                onClick={() => user && handleToggleVaccine(selectedMember, v.name)}
                                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                                  v.status === 'fully'
                                    ? 'bg-emerald-50/60 border-emerald-100 text-slate-800 hover:bg-emerald-50'
                                    : v.status === 'partial'
                                    ? 'bg-amber-50/60 border-amber-100 text-slate-800 hover:bg-amber-50'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                              >
                                <div>
                                  <p className="font-semibold text-slate-700">{v.name}</p>
                                  <span className="text-[9px] text-slate-400">
                                    {v.status === 'fully' 
                                      ? `Đã tiêm ngày: ${v.dateAdministered || 'Lịch định kỳ'}` 
                                      : v.status === 'partial' 
                                      ? 'Chưa hoàn thành đủ mũi nhắc' 
                                      : 'Chưa khởi động tiêm chủng'}
                                  </span>
                                </div>

                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                                  v.status === 'fully'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : v.status === 'partial'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                  {v.status === 'fully' ? 'Đầy đủ' : v.status === 'partial' ? 'Mũi lẻ' : 'Chưa tiêm'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-slate-400 p-6">
                              Sổ tiêm chủng trống. Vui lòng thiết lập hồ sơ để tự động lên lịch tiêm quốc gia.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Bản đồ khuyến nghị (Đến hạn & Chưa tiêm) */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Khuyến cáo tự động</span>
                          <span className="text-[9px] text-teal-600 font-bold bg-teal-50 px-1.5 py-0.2 rounded">Trực quan thông minh</span>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {(() => {
                            const { dueList, missingList } = analyzeVaccines(selectedMember);
                            
                            return (
                              <>
                                {/* Section: Đến hạn */}
                                {dueList.length > 0 && (
                                  <div className="space-y-1.5">
                                    <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-1">
                                      🚩 CẦN TIÊM NGAY / ĐẾN HẠN ({dueList.length})
                                    </h4>
                                    <div className="space-y-1.5">
                                      {dueList.map((v, i) => (
                                        <div 
                                          key={`due-${i}`}
                                          onClick={() => handleToggleVaccine(selectedMember, v.name)}
                                          className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between cursor-pointer transition ${
                                            v.priority === 'high'
                                              ? 'bg-rose-50/90 border-rose-150 hover:bg-rose-100/40 text-slate-800'
                                              : 'bg-amber-50/90 border-amber-150 hover:bg-amber-100/40 text-slate-800'
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-1">
                                            <span className="font-bold text-slate-800">{v.name}</span>
                                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase shrink-0 ${
                                              v.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                              {v.priority === 'high' ? 'Khẩn cấp' : 'Đến hạn'}
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-slate-500 font-normal leading-relaxed mt-1">{v.reason}</p>
                                          <span className="text-[9px] text-teal-600 font-semibold mt-1 flex items-center gap-0.5 justify-end">
                                            ➔ Click để cập nhật nhanh
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Section: Chưa tiêm */}
                                {missingList.length > 0 && (
                                  <div className="space-y-1.5">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                      ⚠️ CHƯA KHỞI ĐỘNG CHỦNG NGỪA ({missingList.length})
                                    </h4>
                                    <div className="space-y-1.5">
                                      {missingList.map((v, i) => (
                                        <div 
                                          key={`missing-${i}`}
                                          onClick={() => handleToggleVaccine(selectedMember, v.name)}
                                          className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs flex flex-col justify-between cursor-pointer transition text-slate-800"
                                        >
                                          <div className="flex items-start justify-between gap-1">
                                            <span className="font-semibold text-slate-700">{v.name}</span>
                                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase shrink-0 bg-slate-100 text-slate-500 border border-slate-200">
                                              Chưa tiêm
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-slate-500 font-normal leading-relaxed mt-1">{v.reason}</p>
                                          <span className="text-[9px] text-teal-600 font-semibold mt-1 flex items-center gap-0.5 justify-end">
                                            ➔ Click để cập nhật nhanh
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {dueList.length === 0 && missingList.length === 0 && (
                                  <div className="text-center text-emerald-600 bg-emerald-50/40 p-6 rounded-lg border border-emerald-100/50 flex flex-col items-center gap-1.5 py-10">
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-700">Miễn dịch chuẩn bảo vệ</span>
                                    <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                                      Nhân khẩu đã tiêm chủng đầy đủ 100% danh mục vắc-xin cốt lõi theo mốc khuyến nghị!
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content 2: Nhắc Nhở Uống Thuốc */}
                {activeMedicalTab === 'medications' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="border-b border-slate-100/60 pb-2 flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
                          Nhắc nhở dùng thuốc hằng ngày
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">Giúp thành viên theo dõi lịch uống thuốc cá nhân, tự ghi sổ trạng thái báo cáo thuận lợi</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingMed(!isAddingMed)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer border border-indigo-200"
                      >
                        {isAddingMed ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {isAddingMed ? "Đóng Form" : "Thêm toa thuốc mới"}
                      </button>
                    </div>

                    {/* Form: Add New Medication Reminder */}
                    {isAddingMed && (
                      <form onSubmit={handleAddMedication} className="bg-slate-50 p-4 rounded-xl border border-dashed border-indigo-200 space-y-4 animate-slideDown">
                        <div className="flex justify-between items-center pb-2 border-b border-indigo-100/50">
                          <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                            <Pill className="w-4 h-4 text-indigo-600" /> Nhập Toa Thuốc / Chỉ Định Bác Sĩ
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">* Bắt buộc nhập</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tên thuốc đặc dụng <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="VD: Metformin 500mg, Panadol..."
                              value={medName}
                              onChange={e => setMedName(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 text-slate-850 font-bold"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Liều dùng / Đơn vị <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="VD: 1 viên, 2 nhát xịt, 10ml"
                              value={medDosage}
                              onChange={e => setMedDosage(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 text-slate-800"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tần suất sử dụng <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="VD: 2 lần/ngày, Khi nổi mẩn..."
                              value={medFrequency}
                              onChange={e => setMedFrequency(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 text-slate-800"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Mốc thời gian dùng trong ngày (chọn nhiều)</label>
                          <div className="flex flex-wrap gap-4 bg-white p-2.5 border border-slate-200/60 rounded-xl">
                            {['Sáng', 'Trưa', 'Chiều', 'Tối', 'Trước khi ngủ', 'Khi cần thiết'].map(time => {
                              const checked = medTimeOfDay.includes(time);
                              return (
                                <button
                                  type="button"
                                  key={time}
                                  onClick={() => {
                                    if (checked) {
                                      setMedTimeOfDay(medTimeOfDay.filter(t => t !== time));
                                    } else {
                                      setMedTimeOfDay([...medTimeOfDay, time]);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition flex items-center gap-1.5 ${
                                    checked
                                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${checked ? 'bg-indigo-500' : 'bg-slate-450'}`} />
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Dặn dò bổ sung (ví dụ thời gian ăn uống tốt nhất)</label>
                          <input
                            type="text"
                            placeholder="VD: Uống sau bữa ăn sáng 15 phút, nhớ uống nhiều nước lọc."
                            value={medNotes}
                            onChange={e => setMedNotes(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 text-slate-800"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1.5">
                          <button
                            type="button"
                            onClick={() => setIsAddingMed(false)}
                            className="px-3 py-1.5 bg-slate-200 rounded hover:bg-slate-300 text-xs font-semibold cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-bold cursor-pointer transition"
                          >
                            Xác Nhận Đặt Nhắc Nhở
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Medications List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMember.medications && selectedMember.medications.length > 0 ? (
                        selectedMember.medications.map(med => {
                          const todayStr = "2026-05-22"; // Simulated Date
                          const isTakenToday = med.takenDates?.includes(todayStr);

                          return (
                            <div
                              key={med.id}
                              className={`p-4 rounded-xl border flex flex-col justify-between transition relative ${
                                isTakenToday
                                  ? "bg-emerald-50/10 border-emerald-200 text-slate-800"
                                  : "bg-white border-slate-150 hover:border-slate-250 text-slate-800 shadow-sm"
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="flex items-start gap-2.5">
                                    <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${isTakenToday ? "bg-emerald-100 text-emerald-700" : "bg-[#eff6ff] text-indigo-600"}`}>
                                      <Pill className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-xs text-slate-800 font-display">
                                        {med.name}
                                      </h4>
                                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Liều: {med.dosage} • Tần suất: {med.frequency}</p>
                                    </div>
                                  </div>

                                  <span className={`px-2 py-0.5 rounded text-[8px] tracking-wider uppercase font-extrabold shrink-0 border ${
                                    isTakenToday 
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 animate-pulse" 
                                      : "bg-amber-50 border-amber-200 text-amber-700"
                                  }`}>
                                    {isTakenToday ? "Đã Uống" : "Chưa Uống"}
                                  </span>
                                </div>

                                {/* Custom checklist for schedule */}
                                <div className="flex flex-wrap gap-1 mt-3.5">
                                  {med.timeOfDay.map(time => (
                                    <span key={time} className="px-2 py-0.5 rounded bg-slate-50/80 text-[9px] text-slate-500 font-bold border border-slate-200 flex items-center gap-1.5">
                                      <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {time}
                                    </span>
                                  ))}
                                </div>

                                {med.notes && (
                                  <p className="text-[10px] text-slate-500 mt-3 p-2.5 bg-slate-50/60 rounded-lg leading-relaxed italic border border-slate-100 flex items-start gap-1">
                                    <span className="shrink-0 text-slate-400 font-sans">💡</span>
                                    <span>HD: {med.notes}</span>
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3.5 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMedTakenStatus(med.id)}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.8 rounded-lg text-[10px] font-bold tracking-wider uppercase cursor-pointer border transition duration-150 active:scale-95 ${
                                    isTakenToday
                                      ? "bg-emerald-600 border-transparent hover:bg-emerald-700 text-white"
                                      : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                  }`}
                                >
                                  {isTakenToday ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" /> Khôi phục báo lại
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Báo Cáo ĐÃ UỐNG
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteMedication(med.id)}
                                  className="p-1.8 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg hover:border-red-200 text-slate-400 transition cursor-pointer"
                                  title="Xóa nhắc nhở này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 text-center text-slate-400 py-12 md:py-16 bg-slate-50/30 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                          <Pill className="w-8 h-8 text-indigo-400 shrink-0 opacity-70" />
                          <span className="font-bold text-xs uppercase text-slate-600">Hộp thuốc bổ trợ trống</span>
                          <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                            Nhân khẩu này chưa được thêm toa thuốc. Bấm "Thêm toa thuốc mới" ở góc trên để tạo báo nhắc nhở tiện ích.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content 3: Lịch Tái Khám */}
                {activeMedicalTab === 'appointments' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="border-b border-slate-100/60 pb-2 flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
                          Lịch hẹn lâm sảng & Tái khám định kỳ
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1 font-sans">Quản lý và ghi nhận thời khóa biểu và dặn dò lâm y khoa của tuyến chăm sóc cơ sở</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingApp(!isAddingApp)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        {isAddingApp ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {isAddingApp ? "Đóng Form" : "Lên lịch khám"}
                      </button>
                    </div>

                    {/* Form: Add New Clinical Appointment */}
                    {isAddingApp && (
                      <form onSubmit={handleAddAppointment} className="bg-slate-50 p-4 rounded-xl border border-dashed border-sky-200 space-y-4 animate-slideDown">
                        <div className="flex justify-between items-center pb-2 border-b border-sky-100">
                          <h4 className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-sky-600" /> Bổ Sung Lịch Hẹn Với Bác Sĩ
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">* Bắt buộc</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Ngày hẹn khám <span className="text-red-500">*</span></label>
                            <input
                              type="date"
                              value={appDate}
                              onChange={e => setAppDate(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-sky-500 text-slate-800"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Giờ hẹn cụ thể</label>
                            <input
                              type="time"
                              value={appTime}
                              onChange={e => setAppTime(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-sky-500 text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cơ sở khám chữa bệnh <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="VD: Trạm Y tế Phường Tân Hưng"
                              value={appFacility}
                              onChange={e => setAppFacility(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-sky-500 text-slate-850 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mục đích lâm sàng / Lý do <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="VD: Đo mắt, Đo điện tim, Lĩnh thuốc"
                              value={appReason}
                              onChange={e => setAppReason(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-sky-500 text-slate-800"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Bác sĩ hẹn tái khám</label>
                            <input
                              type="text"
                              placeholder="VD: ThS. BS. Nguyễn Minh Thư"
                              value={appDoctor}
                              onChange={e => setAppDoctor(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-sky-500 text-slate-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Dặn dò của y bác sĩ trước thăm khám</label>
                          <input
                            type="text"
                            placeholder="VD: Nhịn ăn trước khi lấy máu thử huyết tương vào buổi sáng."
                            value={appNotes}
                            onChange={e => setAppNotes(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-sky-500 text-slate-800"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1.5">
                          <button
                            type="button"
                            onClick={() => setIsAddingApp(false)}
                            className="px-3 py-1.5 bg-slate-200 rounded hover:bg-slate-300 text-xs font-semibold cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-sky-600 text-white rounded hover:bg-sky-700 text-xs font-bold cursor-pointer transition"
                          >
                            Lưu Lịch Lên Lịch Tái Khám
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Appointments list representation */}
                    <div className="space-y-3">
                      {selectedMember.appointments && selectedMember.appointments.length > 0 ? (
                        selectedMember.appointments.map(app => {
                          const isPending = app.status === 'pending';
                          const isCompleted = app.status === 'completed';
                          const isCancelled = app.status === 'cancelled';

                          let countdownText = '';
                          if (isPending) {
                            const today = new Date("2026-05-22");
                            const target = new Date(app.date);
                            const diffTime = target.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays === 0) countdownText = "🚨 Hôm nay khám!";
                            else if (diffDays === 1) countdownText = "📅 Ngày mai khám!";
                            else if (diffDays < 0) countdownText = `⚠️ Quá hạn ${Math.abs(diffDays)} ngày`;
                            else countdownText = `⏳ Còn ${diffDays} ngày`;
                          }

                          return (
                            <div
                              key={app.id}
                              className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${
                                isPending
                                  ? "bg-sky-50/20 border-sky-100 text-slate-800 shadow-sm"
                                  : isCompleted
                                  ? "bg-slate-50/70 border-slate-200/50 text-slate-500"
                                  : "bg-red-50/10 border-red-100/50 text-slate-400"
                              }`}
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-bold bg-[#e0f2fe] text-sky-800 px-2 py-0.5 rounded">
                                    {app.date} {app.time && `@ ${app.time}`}
                                  </span>

                                  {isPending && countdownText && (
                                    <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold animate-pulse font-mono">
                                      {countdownText}
                                    </span>
                                  )}

                                  <span className={`px-2 py-0.5 rounded text-[9px] border font-extrabold uppercase shrink-0 ${
                                    isCompleted
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      : isCancelled
                                      ? "bg-red-50 text-red-600 border-red-100"
                                      : "bg-sky-50 text-sky-700 border-sky-100"
                                  }`}>
                                    {isCompleted ? "Đã Khám" : isCancelled ? "Đã Hủy" : "Đang Hẹn"}
                                  </span>
                                </div>

                                <h4 className={`text-sm font-bold mt-1.5 ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                  {app.reason}
                                </h4>

                                <p className="text-xs font-semibold text-slate-500">
                                  🏥 {app.facility} • Bác sĩ: <span className="text-slate-700">{app.doctorName || "Bác sĩ trực trạm"}</span>
                                </p>

                                {app.notes && (
                                  <p className="text-[10px] text-slate-500 leading-relaxed italic bg-white/60 p-2 border border-slate-100 rounded-lg mt-2 flex items-start gap-1">
                                    <span className="shrink-0 text-slate-400">📝</span>
                                    <span>HD chuẩn bị: {app.notes}</span>
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-100/70 pt-3 md:pt-0 justify-end">
                                {isPending ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAppStatus(app.id, 'completed')}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase px-3 py-1.8 rounded-lg flex items-center gap-1 cursor-pointer transition duration-150 shadow-sm active:scale-95"
                                    >
                                      <Check className="w-3.5 h-3.5 shrink-0" /> Hoàn thành
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAppStatus(app.id, 'cancelled')}
                                      className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg text-[10px] uppercase px-2.5 py-1.8 flex items-center gap-1 cursor-pointer transition duration-150 active:scale-95"
                                    >
                                      <X className="w-3.5 h-3.5 shrink-0" /> Hủy lịch
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAppStatus(app.id, 'pending')}
                                    className="p-1 px-2 text-slate-400 hover:text-slate-600 bg-slate-100 border border-slate-200 rounded text-[9px] cursor-pointer transition"
                                  >
                                    Thu hồi đặt lại
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAppointment(app.id)}
                                  className="p-1.8 text-slate-450 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-lg transition cursor-pointer"
                                  title="Xóa lịch hẹn"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center text-slate-400 py-12 md:py-16 bg-slate-50/30 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                          <Calendar className="w-8 h-8 text-sky-450 shrink-0 opacity-70" />
                          <span className="font-bold text-xs uppercase text-slate-600">Thời khắc biểu trống</span>
                          <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                            Nhân khẩu chưa ghi nhận lịch tái khám định kỳ. Bấm "Lên lịch khám" ở góc trên để bổ sung.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Special clinical notes */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-1 text-xs">
                <span className="font-bold text-slate-700 block">Dặn dò của Trạm y tế / Bác sĩ gia đình:</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {selectedMember.notes || "Gia đình chưa có ghi chú thêm từ Trạm y tế cơ sở. Vui lòng hỏi bệnh hoặc đồng bộ chỉ số để nhận tóm tắt từ Trợ lý AI và Bác sĩ."}
                </p>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <p className="text-sm text-slate-500">Hộ gia đình trống. Vui lòng thêm nhân khẩu ở nút bên trên để theo dõi hồ sơ liên tục.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
