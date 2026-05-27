import React, { useState } from 'react';
import { 
  Building2, Users, AlertTriangle, ShieldCheck, HeartPulse, 
  MapPin, Phone, Edit3, Save, RotateCcw, AlertCircle, PlusCircle, CheckCircle, Flame
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { WardInfo, Household, EpidemiologicalAlert } from '../types';
import StartupStrategy from './StartupStrategy';

interface WardOverviewProps {
  wardInfo: WardInfo;
  onUpdateWardInfo: (info: WardInfo) => void;
  onResetWardInfo: () => void;
  households: Household[];
  alerts: EpidemiologicalAlert[];
  onAddAlert: (alert: EpidemiologicalAlert) => void;
  onToggleAlertStatus: (id: string) => void;
  user?: { name: string; email: string; role: 'officer' | 'admin' } | null;
}

export default function WardOverview({
  wardInfo,
  onUpdateWardInfo,
  onResetWardInfo,
  households,
  alerts,
  onAddAlert,
  onToggleAlertStatus,
  user
}: WardOverviewProps) {
  // Editing Ward Info State
  const [isEditingWard, setIsEditingWard] = useState(false);
  const [editedWard, setEditedWard] = useState<WardInfo>({ ...wardInfo });

  // Adding Alert State
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<EpidemiologicalAlert>>({
    type: 'Sốt xuất huyết',
    location: '',
    casesCount: 1,
    riskLevel: 'Trung bình',
    recommendation: '',
    active: true
  });

  // Calculate stats
  const totalHouseholds = households.length;
  const allMembers = households.reduce((acc, h) => [...acc, ...h.members], [] as any[]);
  const totalCitizens = allMembers.length;

  // Underweight (<18.5), Normal (18.5 - 22.9), Overweight (23.0 - 24.9), Obese (>=25) for Asian Standard
  let healthyCount = 0;
  let warningCount = 0;
  let dangerCount = 0;

  let bmiNormal = 0;
  let bmiOverweight = 0;
  let bmiObese = 0;
  let bmiUnderweight = 0;

  const chronicCounts: { [key: string]: number } = {};
  let totalVaccinesGiven = 0;
  let totalVaccinesRequired = totalCitizens * 10; // Simple estimate: 10 basic vaccines

  allMembers.forEach(m => {
    // Risk level count
    if (m.riskLevel === 'healthy') healthyCount++;
    else if (m.riskLevel === 'warning') warningCount++;
    else if (m.riskLevel === 'danger') dangerCount++;

    // BMI Calculation
    const weight = m.weight;
    const heightM = m.height / 100;
    const bmi = weight / (heightM * heightM);
    if (bmi < 18.5) bmiUnderweight++;
    else if (bmi < 23) bmiNormal++;
    else if (bmi < 25) bmiOverweight++;
    else bmiObese++;

    // Chronic diseases
    m.chronicConditions.forEach((c: string) => {
      chronicCounts[c] = (chronicCounts[c] || 0) + 1;
    });

    // Vaccines
    m.vaccines.forEach((v: any) => {
      if (v.status === 'fully') totalVaccinesGiven += 1;
      else if (v.status === 'partial') totalVaccinesGiven += 0.5;
    });
  });

  const vaccineCoverageRate = totalVaccinesRequired > 0 
    ? Math.round((totalVaccinesGiven / totalVaccinesRequired) * 100) 
    : 85;

  // Chart data: Health Status
  const riskChartData = [
    { name: 'Khỏe mạnh (Xanh)', value: healthyCount, color: '#10b981' },
    { name: 'Cần theo dõi (Vàng)', value: warningCount, color: '#f59e0b' },
    { name: 'Nguy cơ cao (Đỏ)', value: dangerCount, color: '#ef4444' },
  ];

  // Chart data: BMI
  const bmiChartData = [
    { name: 'Thiếu cân (<18.5)', value: bmiUnderweight },
    { name: 'Chuẩn (18.5-22.9)', value: bmiNormal },
    { name: 'Thừa cân (23-24.9)', value: bmiOverweight },
    { name: 'Béo phì (>=25)', value: bmiObese },
  ];

  // Chart data: Chronic Disease Types
  const chronicChartData = Object.keys(chronicCounts).map(key => ({
    name: key,
    count: chronicCounts[key]
  })).sort((a, b) => b.count - a.count);

  const saveWardEdit = () => {
    onUpdateWardInfo(editedWard);
    setIsEditingWard(false);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.location || !newAlert.recommendation) return;

    const alertToCreate: EpidemiologicalAlert = {
      id: `AL-${Date.now()}`,
      type: newAlert.type as any,
      location: newAlert.location,
      casesCount: Number(newAlert.casesCount || 1),
      riskLevel: newAlert.riskLevel as any,
      announcementDate: new Date().toISOString().split('T')[0],
      recommendation: newAlert.recommendation,
      active: true
    };

    onAddAlert(alertToCreate);
    setNewAlert({
      type: 'Sốt xuất huyết',
      location: '',
      casesCount: 1,
      riskLevel: 'Trung bình',
      recommendation: '',
      active: true
    });
    setIsAddingAlert(false);
  };

  // Mock-up of Tổ dân phố hotspots mapping
  const neighborhoods = [
    { code: "TDP 1", coordinates: "Zone A", status: "safe", cases: 0, checked: "95%" },
    { code: "TDP 2", coordinates: "Zone B", status: "safe", cases: 0, checked: "92%" },
    { code: "TDP 3", coordinates: "Zone C", status: "warning", cases: 1, checked: "88%" },
    { code: "TDP 4", coordinates: "Zone D", status: "danger", cases: 6, checked: "79%" },
    { code: "TDP 5", coordinates: "Zone E", status: "warning", cases: 2, checked: "84%" },
    { code: "TDP 6", coordinates: "Zone F", status: "safe", cases: 0, checked: "96%" },
    { code: "TDP 7", coordinates: "Zone G", status: "safe", cases: 0, checked: "91%" },
    { code: "TDP 8", coordinates: "Zone H", status: "warning", cases: 1, checked: "85%" },
    { code: "TDP 9", coordinates: "Zone I", status: "safe", cases: 0, checked: "98%" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Ward Info Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              {isEditingWard ? (
                <div className="space-y-2 max-w-md">
                  <input 
                    type="text" 
                    value={editedWard.name} 
                    onChange={e => setEditedWard({...editedWard, name: e.target.value})}
                    className="text-2xl font-bold font-display text-slate-800 bg-slate-50 border border-slate-200 px-2 py-1 rounded w-full focus:outline-teal-500" 
                    placeholder="Tên Phường"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={editedWard.district} 
                      onChange={e => setEditedWard({...editedWard, district: e.target.value})}
                      className="text-sm text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded w-1/2 focus:outline-teal-500" 
                      placeholder="Quận/Huyện"
                    />
                    <input 
                      type="text" 
                      value={editedWard.province} 
                      onChange={e => setEditedWard({...editedWard, province: e.target.value})}
                      className="text-sm text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded w-1/2 focus:outline-teal-500" 
                      placeholder="Tỉnh/Thành phố"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold font-display text-slate-800">
                    Bản Đồ Y Tế & Quản Lý Sức Khỏe {wardInfo.name}
                  </h1>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {wardInfo.district}, {wardInfo.province}
                  </p>
                </>
              )}
              
              {/* Health Center Details */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
                {isEditingWard ? (
                  <div className="space-y-1.5 w-full mt-2">
                    <div className="flex gap-2 items-center">
                      <span className="w-16 font-medium text-slate-500">Địa chỉ Trạm:</span>
                      <input 
                        type="text" 
                        value={editedWard.healthCenterAddress} 
                        onChange={e => setEditedWard({...editedWard, healthCenterAddress: e.target.value})}
                        className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs w-full focus:outline-teal-500"
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="w-16 font-medium text-slate-500">Hotline Trạm:</span>
                      <input 
                        type="text" 
                        value={editedWard.healthCenterPhone} 
                        onChange={e => setEditedWard({...editedWard, healthCenterPhone: e.target.value})}
                        className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs w-full focus:outline-teal-500"
                      />
                    </div>
                    <div className="flex gap-2 items-center font-bold">
                      <span className="w-16 font-medium text-slate-500">Dân số:</span>
                      <input 
                        type="number" 
                        value={editedWard.population} 
                        onChange={e => setEditedWard({...editedWard, population: Number(e.target.value)})}
                        className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs w-32 focus:outline-teal-500"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Trạm Y Tế: <strong className="text-slate-800">{wardInfo.healthCenterAddress}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Hotline y tế: <strong className="text-teal-600">{wardInfo.healthCenterPhone}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Dân số Phường: <strong className="text-slate-800">{wardInfo.population.toLocaleString('vi-VN')} người</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 self-start md:self-center">
            {isEditingWard ? (
              <>
                <button 
                  onClick={saveWardEdit}
                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu lại
                </button>
                <button 
                  onClick={() => {
                    setIsEditingWard(false);
                    setEditedWard({ ...wardInfo });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Hủy
                </button>
              </>
            ) : user ? (
              <>
                <button 
                  onClick={() => {
                    setEditedWard({ ...wardInfo });
                    setIsEditingWard(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Điều chỉnh thông tin Phường
                </button>
                <button 
                  onClick={onResetWardInfo}
                  className="flex items-center gap-1 p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg text-xs cursor-pointer transition"
                  title="Khôi phục mặc định"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Households Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hộ gia đình đã quản lý</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalHouseholds} hộ</h3>
            <p className="text-[10px] text-slate-400">Tỷ lệ bao phủ đạt ~94.8% toàn phường</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Residents Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nhân khẩu đã đồng bộ</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalCitizens} người</h3>
            <p className="text-[10px] text-emerald-600">Đã cập nhật dữ liệu sinh trắc</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Warning Indicator Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nhân khẩu nguy cơ cao</p>
            <h3 className="text-2xl font-bold text-red-600">{dangerCount} người</h3>
            <p className="text-[10px] text-red-500 font-medium">{warningCount} người đang diện cảnh báo</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-red-600">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Vaccine Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tỷ lệ Tiêm chủng cơ bản</p>
            <h3 className="text-2xl font-bold text-emerald-600">{vaccineCoverageRate}%</h3>
            <p className="text-[10px] text-slate-400">Đạt chỉ tiêu WHO y tế cơ sở</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Stats and Epidemiology Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Medical Graphics Left: 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Charts Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800 font-display">Phân Tích Chỉ Số Sức Khỏe Cộng Đồng</h3>
              <p className="text-xs text-slate-500">Thống kê theo dữ liệu hồ sơ nhân khẩu thực tế của phường</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Chronic Diseases Bar */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Mô hình bệnh tật (Bệnh nền phổ biến)</h4>
                {chronicChartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chronicChartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Số ca mắc" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs">
                    Chưa ghi nhận bệnh nền
                  </div>
                )}
              </div>

              {/* Right Column: Risk Levels Pie */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Phân vùng sức khỏe người dân</h4>
                <div className="h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legends */}
                <div className="flex justify-around text-xs mt-2 border-t border-slate-50 pt-3">
                  {riskChartData.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name.split(' ')[0]}
                      </span>
                      <span className="text-lg font-bold text-slate-800 ml-4.5">{item.value} người ({Math.round(item.value / (totalCitizens || 1) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BMI Index and vaccination and checklist */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Tình trạng dinh dưỡng (BMI Châu Á)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bmiChartData.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                    <span className="text-xs text-slate-500 block truncate">{item.name}</span>
                    <span className="text-xl font-bold text-slate-800 block mt-1">{item.value} người</span>
                    <span className="text-[10px] text-slate-400 block">
                      {totalCitizens > 0 ? Math.round((item.value / totalCitizens) * 100) : 0}% tổng cộng
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map & Community Grid representation representing household distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-display">Tổ Bản Đồ Dịch Tễ Phường</h3>
                <p className="text-xs text-slate-500">Mô phỏng 100% tình trạng dịch tễ tại các Tổ dân phố</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 animate-pulse" /> Đang theo dõi 2 TDP rủi ro
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Dưới đây là sơ đồ mật độ rủi ro sức khỏe cộng đồng. Cán bộ y tế dựa vào bản đồ để chỉ đạo phun khử khuẩn, vắc xin lưu động hoặc rà soát dịch bệnh tại chỗ.
            </p>

            {/* Dynamic visual grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-3">
              {neighborhoods.map((n, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-xl border flex flex-col justify-between min-h-[115px] h-auto cursor-help transition transform hover:scale-105 ${
                    n.status === 'danger' 
                      ? 'bg-red-50/70 border-red-200 text-red-900 shadow-sm shadow-red-100' 
                      : n.status === 'warning'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-sm shadow-amber-100'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  }`}
                  title={`Chi tiết: ${n.code} (${n.coordinates}) \nTình trạng: ${n.status === 'danger' ? 'BÁO ĐỘNG ĐỎ' : n.status === 'warning' ? 'Cảnh báo dịch' : 'Bình thường'} \nSố ca mắc: ${n.cases} \nTỷ lệ hoàn thành khám định kỳ: ${n.checked}`}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">{n.code}</span>
                      <span className="text-[9px] opacity-70 font-mono">{n.coordinates}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <span className="text-[10px] block font-semibold leading-tight">
                        {n.cases > 0 ? `${n.cases} ca ổ dịch` : 'Không có ổ dịch'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-1 border-t border-slate-200/30">
                    <div className="flex justify-between items-center text-[9px] font-medium text-slate-600 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200/40">
                      <span>Khám bệnh:</span>
                      <strong className="text-slate-800">{n.checked}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tooltip details and map markings key */}
            <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">Chú giải bản đồ dịch tễ:</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-300" /> Bình Thường (An Toàn)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-300" /> Nguy cơ nhẹ / Có ca nhiễm rải rác</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-300" /> Ổ DỊCH HOẠT ĐỘNG (Báo động số đông ca)</span>
            </div>
          </div>
        </div>

        {/* Alerts Column Right: 1 Column */}
        <div className="space-y-6">
          {/* Active Epidemiological Alerts */}
          <div id="epidemiological-alerts-panel" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 target:ring-2 target:ring-red-500 target:ring-offset-2 transition-all duration-500">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Cảnh Báo Dịch Tễ Phường
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Cập nhật trực tiếp từ giám sát viên y tế</p>
              </div>
              {user && (
                <button 
                  onClick={() => setIsAddingAlert(!isAddingAlert)}
                  className="p-1 text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                  title="Báo cáo ổ dịch mới"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Add Alert Form Container */}
            {isAddingAlert && (
              <form onSubmit={handleCreateAlert} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 text-xs">
                <p className="font-bold text-slate-700 text-[11px]">Khai báo ổ dịch / cảnh báo mới</p>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Loại dịch bệnh</label>
                  <select 
                    value={newAlert.type} 
                    onChange={e => setNewAlert({...newAlert, type: e.target.value as any})}
                    className="w-full bg-white border border-slate-200 rounded p-1.5"
                  >
                    <option value="Sốt xuất huyết">Sốt xuất huyết</option>
                    <option value="Tay chân miệng">Tay chân miệng</option>
                    <option value="Cúm mùa">Cúm mùa</option>
                    <option value="Sởi">Sởi</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Địa bàn ảnh hưởng</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Tổ 4, KP1"
                      value={newAlert.location}
                      onChange={e => setNewAlert({...newAlert, location: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded p-1.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Số ca nhiễm</label>
                    <input 
                      type="number" 
                      min="1"
                      value={newAlert.casesCount}
                      onChange={e => setNewAlert({...newAlert, casesCount: Number(e.target.value)})}
                      className="w-full bg-white border border-slate-200 rounded p-1.5"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Mức độ rủi ro</label>
                    <select 
                      value={newAlert.riskLevel} 
                      onChange={e => setNewAlert({...newAlert, riskLevel: e.target.value as any})}
                      className="w-full bg-white border border-slate-200 rounded p-1.5"
                    >
                      <option value="Cao">Cao</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Thấp">Thấp</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Khuyến cáo y tế khẩn cấp</label>
                  <textarea 
                    rows={3}
                    placeholder="Các biện pháp phòng tránh cho nhân dân..."
                    value={newAlert.recommendation}
                    onChange={e => setNewAlert({...newAlert, recommendation: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded p-1.5"
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingAlert(false)}
                    className="px-2.5 py-1 bg-slate-200 rounded hover:bg-slate-300 font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="px-2.5 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 font-medium cursor-pointer"
                  >
                    Phát hành cảnh báo
                  </button>
                </div>
              </form>
            )}

            {/* List Alerts */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-xl border text-xs space-y-2 relative transition ${
                      alert.active 
                        ? alert.riskLevel === 'Cao'
                          ? 'bg-red-50/50 border-red-100 ring-1 ring-red-200'
                          : 'bg-amber-50/50 border-amber-100'
                        : 'bg-slate-50/50 border-slate-100 opacity-60'
                    }`}
                  >
                    {/* Top line */}
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-slate-800 text-[13px] flex items-center gap-1">
                        {alert.type}
                        {alert.active && (
                          <span className={`w-2 h-2 rounded-full animate-ping ${
                            alert.riskLevel === 'Cao' ? 'bg-red-500' : 'bg-amber-500'
                          }`} />
                        )}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        alert.riskLevel === 'Cao'
                          ? 'bg-red-100 text-red-700'
                          : alert.riskLevel === 'Trung bình'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        Mức: {alert.riskLevel}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <p><span className="font-medium text-slate-500">Khu vực:</span> <strong className="text-slate-800">{alert.location}</strong></p>
                      <p><span className="font-medium text-slate-500">Số ca ghi nhận:</span> <strong className="text-slate-800">{alert.casesCount} ca</strong></p>
                      <p><span className="font-medium text-slate-500">Ngày công bố:</span> {alert.announcementDate}</p>
                    </div>

                    {/* Recommendation details */}
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-100 text-slate-700 text-[11px] leading-relaxed">
                      <strong>Khuyến nghị:</strong> {alert.recommendation}
                    </div>

                    {/* Toggle Button */}
                    {user && (
                      <div className="flex justify-end pt-1">
                        <button 
                          onClick={() => onToggleAlertStatus(alert.id)}
                          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition ${
                            alert.active 
                              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                              : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                          }`}
                        >
                          {alert.active ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-slate-400" /> Ngừng kích hoạt
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3 text-teal-600" /> Tái hoạt động
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-6 text-xs">
                  Không có cảnh báo dịch tễ nào hoạt động.
                </div>
              )}
            </div>
          </div>

          {/* Quick Guide to Startup Concept */}
          <div className="bg-gradient-to-br from-teal-800 to-emerald-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-5 translate-y-5 opacity-10">
              <Building2 className="w-40 h-40" />
            </div>
            
            <div className="space-y-3.5 relative z-10">
              <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-300">Startup Pitch Concept</h4>
              <p className="text-xs leading-relaxed opacity-90">
                Mô hình <strong>HealthHouseholds</strong> giải quyết triệt để bài toán: <strong>"Quản lý sức khỏe chủ động liên tục từ tuyến cơ sở, kết tụ Net Zero sinh thái"</strong>.
              </p>
              
              <div className="bg-black/20 p-3 rounded-lg border border-white/10 text-[11px] leading-relaxed text-slate-200">
                Lăn chuột xuống phía dưới để khám phá Ma trận <strong>SWOT</strong>, Mục tiêu <strong>SMART</strong> và Kiểm toán khí thải carbon <strong>Net Zero</strong> thời gian thực.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Strategic Ecosystem: SMART, SWOT & Net Zero Dashboard */}
      <div className="mt-8 transition-all">
        <StartupStrategy totalHouseholds={totalHouseholds} totalCitizens={totalCitizens} user={user} />
      </div>

    </div>
  );
}
