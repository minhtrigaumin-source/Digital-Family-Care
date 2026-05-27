import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Trash2, ChevronRight, MapPin, Phone, 
  User, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, PlusCircle
} from 'lucide-react';
import { Household, HouseholdMember } from '../types';

interface HouseholdDirectoryProps {
  households: Household[];
  onSelectHousehold: (id: string) => void;
  onAddHousehold: (household: Household) => void;
  onDeleteHousehold: (id: string) => void;
  user?: { name: string; email: string; role: 'officer' | 'admin' } | null;
}

export default function HouseholdDirectory({
  households,
  onSelectHousehold,
  onAddHousehold,
  onDeleteHousehold,
  user
}: HouseholdDirectoryProps) {
  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('Tất cả');
  const [riskFilter, setRiskFilter] = useState('Tất cả');

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [formHeadName, setFormHeadName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formQuarter, setFormQuarter] = useState('Khu phố 1');
  const [formGroup, setFormGroup] = useState('Tổ dân phố 4');

  // Member 1 (Chủ hộ) form inputs
  const [headId, setHeadId] = useState('');
  const [headDob, setHeadDob] = useState('');
  const [headGender, setHeadGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [headBloodType, setHeadBloodType] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'>('O+');
  const [headHeight, setHeadHeight] = useState(165);
  const [headWeight, setHeadWeight] = useState(60);
  const [headBPSys, setHeadBPSys] = useState(120);
  const [headBPDia, setHeadBPDia] = useState(80);
  const [headSugar, setHeadSugar] = useState(5.4);
  const [headChronic, setHeadChronic] = useState('');
  const [headNotes, setHeadNotes] = useState('');

  // Extract unique Quarters for filtering
  const quarters = ['Tất cả', ...Array.from(new Set(households.map(h => h.quarter)))];

  // Filtering Logic
  const filteredHouseholds = households.filter(h => {
    // Search match
    const searchMatch = 
      h.headName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.phoneNumber.includes(searchTerm) ||
      h.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Quarter match
    const quarterMatch = selectedQuarter === 'Tất cả' || h.quarter === selectedQuarter;

    // Risk match
    let riskMatch = true;
    if (riskFilter !== 'Tất cả') {
      const hasMemberWithRisk = h.members.some(m => m.riskLevel === riskFilter);
      riskMatch = hasMemberWithRisk;
    }

    return searchMatch && quarterMatch && riskMatch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHeadName || !formAddress || !formPhone || !headId) return;

    // Calculate initial risk level for head of household
    let riskLevel: 'healthy' | 'warning' | 'danger' = 'healthy';
    
    // Simple criteria: Blood pressure high or sugar high
    if (headBPSys >= 160 || headBPDia >= 100 || headSugar >= 7.0) {
      riskLevel = 'danger';
    } else if (headBPSys >= 140 || headBPDia >= 90 || headSugar >= 5.6 || headWeight / ((headHeight/100)*(headHeight/100)) >= 25) {
      riskLevel = 'warning';
    }

    const firstMember: HouseholdMember = {
      id: headId,
      fullName: formHeadName,
      relationship: "Chủ hộ",
      gender: headGender,
      dob: headDob || "1980-01-01",
      bloodType: headBloodType,
      height: Number(headHeight),
      weight: Number(headWeight),
      bloodPressureSys: Number(headBPSys),
      bloodPressureDia: Number(headBPDia),
      bloodSugar: Number(headSugar),
      chronicConditions: headChronic ? headChronic.split(',').map(s => s.trim()).filter(Boolean) : [],
      vaccines: [
        { name: "Lao (BCG)", status: "fully" },
        { name: "Viêm gan B", status: "fully" },
        { name: "COVID-19 (Mũi cơ bản)", status: "fully" }
      ],
      lastCheckup: new Date().toISOString().split('T')[0],
      notes: headNotes,
      riskLevel: riskLevel,
      metricHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          bloodPressureSys: Number(headBPSys),
          bloodPressureDia: Number(headBPDia),
          bloodSugar: Number(headSugar),
          weight: Number(headWeight)
        }
      ]
    };

    const newH: Household = {
      id: `HGĐ-${Math.floor(10000 + Math.random() * 90000)}`,
      headName: formHeadName,
      address: formAddress,
      phoneNumber: formPhone,
      quarter: formQuarter,
      neighborhoodGroup: formGroup,
      members: [firstMember],
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddHousehold(newH);
    
    // Clear forms
    setFormHeadName('');
    setFormAddress('');
    setFormPhone('');
    setHeadId('');
    setHeadDob('');
    setHeadChronic('');
    setHeadNotes('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo chủ hộ, địa chỉ, SĐT..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-teal-500 transition"
            />
          </div>

          {/* Quarter filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedQuarter}
              onChange={e => setSelectedQuarter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-teal-500 transition flex-1 md:flex-none"
            >
              {quarters.map((q, i) => <option key={i} value={q}>{q}</option>)}
            </select>
          </div>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-teal-500 transition w-full md:w-auto"
          >
            <option value="Tất cả">Lọc theo Chỉ số báo động (Tất cả)</option>
            <option value="healthy">Xanh (Khỏe mạnh)</option>
            <option value="warning">Vàng (Cần lưu ý)</option>
            <option value="danger">Đỏ (Nguy cơ cao - Cần kiểm soát)</option>
          </select>
        </div>

        {user && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Khởi tạo Hộ gia đình mới
          </button>
        )}
      </div>

      {/* Creation Block */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-brand-100 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" /> Khai báo Hộ sức khỏe gia đình mới và Chủ hộ
            </h3>
            <p className="text-xs text-slate-500">Mã hộ gia đình sẽ được hệ thống cấp tự động.</p>
          </div>

          {/* Step 1: Household General Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Thông tin Hộ khẩu & Vị Trí</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Họ tên Chủ hộ <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Nguyễn Văn Hùng"
                  value={formHeadName}
                  onChange={e => setFormHeadName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Số điện thoại liên lạc <span className="text-red-500">*</span></label>
                <input 
                  type="tel" 
                  placeholder="e.g. 0908123456"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Vị trí hành chính</label>
                <div className="flex gap-2">
                  <select 
                    value={formQuarter} 
                    onChange={e => setFormQuarter(e.target.value)}
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-xs"
                  >
                    <option value="Khu phố 1">Khu phố 1</option>
                    <option value="Khu phố 2">Khu phố 2</option>
                    <option value="Khu phố 3">Khu phố 3</option>
                    <option value="Khu phố 4">Khu phố 4</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Tổ dân phố"
                    value={formGroup}
                    onChange={e => setFormGroup(e.target.value)}
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-xs focus:outline-teal-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-slate-600 mb-1">Địa chỉ (Số nhà, Tên đường) <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. 52 Nguyễn Du"
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-teal-500"
                required
              />
            </div>
          </div>

          {/* Step 2: Main Member (Owner) Health profile */}
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Thông số sức khỏe Chủ hộ</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">CCCD / Mã định danh công dân <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="Nhập 12 số định danh"
                  value={headId}
                  onChange={e => setHeadId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-teal-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-600 mb-1">Ngày sinh</label>
                <input 
                  type="date" 
                  value={headDob}
                  onChange={e => setHeadDob(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Giới tính</label>
                <select 
                  value={headGender}
                  onChange={e => setHeadGender(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Nhóm máu</label>
                <select 
                  value={headBloodType}
                  onChange={e => setHeadBloodType(e.target.value as any)}
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
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Chiều cao (cm)</label>
                <input 
                  type="number" 
                  value={headHeight}
                  onChange={e => setHeadHeight(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Cân nặng (kg)</label>
                <input 
                  type="number" 
                  value={headWeight}
                  onChange={e => setHeadWeight(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Huyết áp Tâm thu (mmHg)</label>
                <input 
                  type="number" 
                  value={headBPSys}
                  onChange={e => setHeadBPSys(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-teal-500"
                  placeholder="e.g. 120"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Huyết áp Tâm trương (mmHg)</label>
                <input 
                  type="number" 
                  value={headBPDia}
                  onChange={e => setHeadBPDia(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-teal-500"
                  placeholder="e.g. 80"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs text-slate-600 mb-1">Đường huyết fasting (mmol/L)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={headSugar}
                  onChange={e => setHeadSugar(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-teal-500"
                  placeholder="e.g. 5.6"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Bệnh nền (Nếu có, cách nhau bằng dấu phẩy)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Tăng huyết áp, Đái tháo đường Tuýp 2"
                  value={headChronic}
                  onChange={e => setHeadChronic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Ghi chú tiền sử bệnh án</label>
                <input 
                  type="text" 
                  placeholder="Các lưu ý đặc biệt đối với sức khỏe..."
                  value={headNotes}
                  onChange={e => setHeadNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow"
            >
              Đồng ý thiết lập hộ khẩu
            </button>
          </div>
        </form>
      )}

      {/* Directory Cards Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHouseholds.length > 0 ? (
          filteredHouseholds.map((h) => {
            // Calculate critical states of members
            const dangerMembers = h.members.filter(m => m.riskLevel === 'danger');
            const warningMembers = h.members.filter(m => m.riskLevel === 'warning');

            return (
              <div 
                key={h.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition duration-300"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded">
                      Mã hộ: {h.id}
                    </span>
                    <div className="flex gap-1.5">
                      {dangerMembers.length > 0 && (
                        <span className="flex items-center gap-1 bg-red-50 text-red-600 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-red-100">
                          <AlertCircle className="w-2.5 h-2.5" /> {dangerMembers.length} Nguy cơ đỏ
                        </span>
                      )}
                      {warningMembers.length > 0 && dangerMembers.length === 0 && (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-amber-100">
                          <AlertTriangle className="w-2.5 h-2.5" /> {warningMembers.length} Bị cảnh báo
                        </span>
                      )}
                      {dangerMembers.length === 0 && warningMembers.length === 0 && (
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Khỏe mạnh
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core detail */}
                  <div className="space-y-2 mt-2">
                    <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1">
                      <User className="w-4 h-4 text-slate-400" />
                      {h.headName}
                    </h3>
                    <div className="text-xs text-slate-600 space-y-1.5 pl-5">
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{h.address}, {h.quarter}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {h.phoneNumber}
                      </p>
                    </div>
                  </div>

                  {/* Members line summaries */}
                  <div className="mt-4 border-t border-slate-50 pt-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Nhân khẩu gia đình ({h.members.length})</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {h.members.map((m, idx) => (
                        <div 
                          key={idx} 
                          className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            m.riskLevel === 'danger'
                              ? 'bg-red-50 border-red-100 text-red-700'
                              : m.riskLevel === 'warning'
                              ? 'bg-amber-50 border-amber-100 text-amber-700'
                              : 'bg-slate-50 border-slate-100 text-slate-600'
                          }`}
                          title={`${m.fullName} (${m.relationship}) - BMI: ${(m.weight / ((m.height/100)*(m.height/100))).toFixed(1)}, Huyết áp: ${m.bloodPressureSys}/${m.bloodPressureDia}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            m.riskLevel === 'danger' ? 'bg-red-500' : m.riskLevel === 'warning' ? 'bg-amber-505' : 'bg-green-500'
                          }`} />
                          <span className="font-semibold">{m.fullName}</span>
                          <span className="opacity-60 text-[9px] font-normal">({m.relationship})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {user ? (
                    <button
                      onClick={() => onDeleteHousehold(h.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0 cursor-pointer"
                      title="Xóa Hộ khẩu sức khỏe này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : <div />}
                  
                  <button
                    onClick={() => onSelectHousehold(h.id)}
                    className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Theo dõi Hồ sơ <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Không tìm thấy hộ gia đình phù hợp</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng điều chỉnh từ khóa tìm kiếm hoặc các cấp độ lọc</p>
          </div>
        )}
      </div>

    </div>
  );
}
