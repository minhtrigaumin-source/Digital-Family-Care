import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Smartphone, CheckCircle2, History, Users, 
  Briefcase, ShieldAlert, Sparkles, Filter, Trash2, AlertCircle, 
  Inbox, ChevronRight, Check, X, PhoneCall, CheckCircle, BellRing
} from 'lucide-react';
import { Household, HouseholdMember } from '../types';

interface SentMessage {
  id: string;
  title: string;
  content: string;
  recipientType: 'all' | 'single' | 'risk' | 'chronic';
  recipientLabel: string;
  senderName: string;
  sentAt: string;
  channel: 'Zalo' | 'SMS' | 'App';
  status: 'Thành công' | 'Đại diện đã đọc';
}

// Predefined professional templates
const PRESET_TEMPLATES = [
  {
    title: "Tiêm chủng Sởi & Cúm mùa",
    channel: "Zalo" as const,
    subject: "LỊCH TIÊM CHỦNG QUỐC GIA ĐỊNH KỲ",
    content: "Trạm Y tế thông báo: Kính mời đại diện hộ gia đình đưa trẻ em và người cao tuổi đến Trạm Y tế Phường vào sáng thứ Bảy tuần này (8h00 - 11h30) để được khám sàng lọc và tiêm nhắc vắc-xin Sởi & Cúm mùa phòng ngừa dịch bệnh. Vui lòng mang theo Sổ tiêm chủng xanh."
  },
  {
    title: "Diệt lăng quăng, phòng dịch SXH",
    channel: "SMS" as const,
    subject: "CẢNH BÁO DỊCH SỐT XUẤT HUYẾT",
    content: "TYT PHUONG CANH BAO: Hiện tại khu vực có dấu hiệu gia tăng ca bệnh Sốt xuất huyết. Đề nghị chủ hộ chỉ đạo các thành viên dọn dẹp lu khạp, lật úp vật dụng đọng nước, thả cá diệt lăng quăng vào mỗi buổi tối cuối tuần. Cùng chung tay đẩy lùi nguy cơ bùng phát dịch."
  },
  {
    title: "Hẹn tái khám người bệnh nền",
    channel: "App" as const,
    subject: "HẸN TÁI KHÁM ĐỊNH KỲ TUYẾN CƠ SỞ",
    content: "Hệ thống Quản lý Sức khỏe Phường nhắc lịch: Chào bạn, theo hồ sơ y tế bệnh nền (Tăng huyết áp / Đái tháo đường), thành viên hộ gia đình của bạn đã đến lịch tái khám và lĩnh thuốc định kỳ tháng này. Vui lòng nhịn ăn sáng để xét nghiệm chỉ số đường máu chính xác nhất."
  },
  {
    title: "Cảnh báo chỉ số đo nguy cơ",
    channel: "Zalo" as const,
    subject: "KHUYẾN CÁO CẬP NHẬT CHỈ SỐ HUYẾT ÁP",
    content: "Bác sĩ Phường cảnh báo: Qua khảo sát chỉ số đo gần nhất, chúng tôi nhận thấy thành viên gia đình đang ở ngưỡng cảnh báo đỏ. Đề nghị gia đình tiến hành đo lại huyết áp/đường huyết hôm nay và báo cáo ngay lên phần mềm để được bác sĩ theo dõi hỗ trợ từ xa kịp thời."
  }
];

interface HouseholdMessagingProps {
  households: Household[];
  user: { name: string; email: string; role: 'officer' | 'admin' } | null;
}

export default function HouseholdMessaging({ households, user }: HouseholdMessagingProps) {
  const [sentLogs, setSentLogs] = useState<SentMessage[]>([]);
  
  // Tab/Filter operations
  const [recipientType, setRecipientType] = useState<'all' | 'single' | 'risk' | 'chronic'>('all');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'healthy' | 'warning' | 'danger'>('danger');
  const [selectedChronic, setSelectedChronic] = useState<string>('Tăng huyết áp');
  
  const [selectedChannel, setSelectedChannel] = useState<'Zalo' | 'SMS' | 'App'>('Zalo');
  const [msgTitle, setMsgTitle] = useState<string>('THÔNG BÁO TIÊM CHỦNG QUỐC GIA');
  const [msgContent, setMsgContent] = useState<string>('Trạm y tế xin thông báo đến gia đình lịch tiêm nhắc sởi và cúm mùa sắp diễn ra vào cuối tuần này.');
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // All chronic list extracted dynamically
  const allChronicConditions = Array.from(
    new Set(
      households.flatMap(h => h.members.flatMap(m => m.chronicConditions || []))
    )
  ).filter(Boolean);

  // Load sent logs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ward_sent_messages');
    if (saved) {
      setSentLogs(JSON.parse(saved));
    } else {
      const defaultLogs: SentMessage[] = [
        {
          id: "MSG-8901",
          title: "Tuyên truyền vệ sinh dịch tễ",
          content: "Khu phố 4 đề nghị bà con phát quang bụi rậm quanh nhà và đổ nước đọng ở các vỏ xe cũ để triệt tiêu nơi đẻ trứng của muỗi vằn truyền bệnh.",
          recipientType: "all",
          recipientLabel: "Tất cả hộ dân (12 hộ)",
          senderName: "BS. Nguyễn Hoàng Long",
          sentAt: "2026-05-20 09:15",
          channel: "Zalo",
          status: "Đại diện đã đọc"
        },
        {
          id: "MSG-8902",
          title: "Nhắc nhở cập nhật đo đường huyết",
          content: "Bác sĩ Trạm Y Tế nhắc nhở bệnh nhân Nguyễn Văn Nam hạn đợt đo định kỳ 2 tuần. Vui lòng tự đo tại nhà và cập nhật kết quả.",
          recipientType: "single",
          recipientLabel: "Hộ ông Nguyễn Văn Nam",
          senderName: "Điều dưỡng Tô Minh Tâm",
          sentAt: "2026-05-21 14:30",
          channel: "SMS",
          status: "Thành công"
        }
      ];
      setSentLogs(defaultLogs);
      localStorage.setItem('ward_sent_messages', JSON.stringify(defaultLogs));
    }
  }, []);

  const saveLogs = (logs: SentMessage[]) => {
    setSentLogs(logs);
    localStorage.setItem('ward_sent_messages', JSON.stringify(logs));
  };

  const handleApplyTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    setMsgTitle(tpl.subject);
    setMsgContent(tpl.content);
    setSelectedChannel(tpl.channel);
  };

  // Smart AI assistant helps draft message
  const handleAIEnhance = () => {
    if (!msgContent.trim()) {
      showToast("Vui lòng nhập nội dung cơ bản trước để Bác sĩ AI tối ưu.");
      return;
    }
    
    // Simple mock simulation of smart medical formatting enhancement rule
    let enhanced = msgContent.trim();
    if (!enhanced.startsWith("[ỨNG DỤNG Y TẾ PHƯỜNG]")) {
      enhanced = `[HỘ GIA ĐÌNH KHỎE] 🌟 KHUYẾN NGHỊ BÁC SĨ: Chào hộ gia đình, ${enhanced.charAt(0).toLowerCase() + enhanced.slice(1)}`;
    }
    if (!enhanced.endsWith("Kính chúc gia đình dồi dào sức khỏe!")) {
      enhanced += " Kính đề nghị đại diện hộ lưu tâm và thực hiện đầy đủ quy trình an toàn của Bộ Y tế. Trân trọng cảm ơn. Chúc bà con luôn mạnh khỏe!";
    }
    setMsgContent(enhanced);
    showToast("Đã dùng Trợ lý AI nâng cấp văn phong y khoa chuyên nghiệp!");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgContent.trim()) return;

    setIsSending(true);

    // Dynamic recipient counting
    let label = '';
    let targetHouseholdsCount = 0;

    if (recipientType === 'all') {
      label = `Tất cả các hộ thuộc quản lý của Phường (${households.length} hộ)`;
      targetHouseholdsCount = households.length;
    } else if (recipientType === 'single') {
      const h = households.find(x => x.id === selectedHouseholdId);
      label = h ? `Hộ đại diện: ${h.headName} (${h.address})` : 'Hộ chọn lọc';
      targetHouseholdsCount = 1;
    } else if (recipientType === 'risk') {
      const matches = households.filter(h => 
        h.members.some(m => m.riskLevel === selectedRiskLevel)
      );
      const levelVn = selectedRiskLevel === 'danger' ? 'Nguy cơ cao (Đỏ)' : selectedRiskLevel === 'warning' ? 'Cần theo dõi (Vàng)' : 'Bình thường (Xanh)';
      label = `Hộ có thành viên nhóm ${levelVn} (${matches.length} hộ)`;
      targetHouseholdsCount = matches.length;
    } else if (recipientType === 'chronic') {
      const matches = households.filter(h => 
        h.members.some(m => m.chronicConditions.includes(selectedChronic))
      );
      label = `Hộ có người bệnh nền (${selectedChronic}) (${matches.length} hộ)`;
      targetHouseholdsCount = matches.length;
    }

    setTimeout(() => {
      const now = new Date();
      const timeStr = now.getFullYear() + '-' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(now.getDate()).padStart(2, '0') + ' ' + 
                      String(now.getHours()).padStart(2, '0') + ':' + 
                      String(now.getMinutes()).padStart(2, '0');

      const newMessage: SentMessage = {
        id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
        title: msgTitle.toUpperCase(),
        content: msgContent,
        recipientType,
        recipientLabel: label,
        senderName: user ? user.name : "Cán bộ trực trạm",
        sentAt: timeStr,
        channel: selectedChannel,
        status: selectedChannel === 'Zalo' ? 'Đại diện đã đọc' : 'Thành công'
      };

      const updatedLogs = [newMessage, ...sentLogs];
      saveLogs(updatedLogs);
      setIsSending(false);
      showToast(`Đã phát thông báo thành công đến ${targetHouseholdsCount} hộ dân qua kênh ${selectedChannel}!`);
      
      // Optionally reset form variables
      // setMsgTitle('');
      // setMsgContent('');
    }, 1200);
  };

  const handleDeleteLog = (id: string) => {
    if (confirm("Xóa lịch sử gửi tin này khỏi danh mục lưu trữ?")) {
      const updated = sentLogs.filter(l => l.id !== id);
      saveLogs(updated);
      showToast("Đã xóa vĩnh viễn nhật ký tin nhắn.");
    }
  };

  // Filter list logs
  const filteredLogs = sentLogs.filter(log => {
    const term = searchTerm.toLowerCase();
    return log.title.toLowerCase().includes(term) || 
           log.content.toLowerCase().includes(term) || 
           log.recipientLabel.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      
      {/* Visual Toast Notification message */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 border border-emerald-500 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 max-w-md animate-slideIn z-50">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <p className="text-xs font-semibold leading-relaxed">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-auto cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] bg-indigo-50 border border-indigo-200/50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Trung Tâm Truyền Thông Y Tế Gia Đình
            </span>
            <h2 className="text-lg font-bold text-slate-800 font-display mt-1">
              Phát Thông Báo / Gửi Tin Nhắn Phường
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Mã hóa tích hợp SMS Brandname và Zalo OA giúp liên lạc, nhắc nhở định kỳ và cảnh báo khẩn cấp bệnh dịch trực tiếp tới từng chủ hộ dân.
            </p>
          </div>
        </div>

        {/* Short info rate badge */}
        <div className="hidden lg:flex items-center gap-6 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <div className="text-center">
            <p className="text-slate-400 font-medium">Tỷ lệ mở xem tin</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">94.8%</p>
          </div>
          <div className="h-8 border-r border-slate-200" />
          <div className="text-center">
            <p className="text-slate-400 font-medium">Báo cáo lỗi truyền</p>
            <p className="text-sm font-bold text-emerald-600 mt-0.5">0.0% (Ổn định)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Message Composer Inputs (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
          
          {/* Quick template triggers */}
          <div className="space-y-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/10" /> Chọn mẫu tin y khoa soạn sẵn (Tiết kiệm thời gian)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_TEMPLATES.map((tpl, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-3 text-left bg-slate-50 hover:bg-indigo-50/40 border border-slate-205 rounded-xl cursor-pointer hover:border-indigo-200 transition text-slate-850 flex items-start gap-2.5 active:scale-98 group"
                >
                  <span className="p-1 rounded-lg bg-indigo-50 group-hover:bg-white text-indigo-600 shrink-0 text-xs">📝</span>
                  <div>
                    <p className="font-bold text-[11px] text-slate-700 leading-tight">{tpl.title}</p>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{tpl.channel} Channel</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4 pt-2 border-t border-slate-100">
            
            {/* 1. Recipient configuration options */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                1. Phạm vi Người nhận tin nhắn hỏa tốc
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecipientType('all');
                    setSelectedHouseholdId(households[0]?.id || '');
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition text-center ${
                    recipientType === 'all'
                      ? "bg-slate-900 border-transparent text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Tất cả Phường
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientType('single');
                    if (households.length > 0 && !selectedHouseholdId) {
                      setSelectedHouseholdId(households[0].id);
                    }
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition text-center ${
                    recipientType === 'single'
                      ? "bg-slate-900 border-transparent text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Chọn Hộ Gia Đình
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('risk')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition text-center ${
                    recipientType === 'risk'
                      ? "bg-slate-900 border-transparent text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Lọc Theo Nguy Cơ
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('chronic')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition text-center ${
                    recipientType === 'chronic'
                      ? "bg-slate-900 border-transparent text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Nhóm Bệnh Nền
                </button>
              </div>

              {/* Dynamic Child Dropdowns corresponding to choice */}
              {recipientType === 'single' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 animate-fadeIn">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Chọn chủ hộ đại diện liên lạc:
                  </label>
                  <select
                    value={selectedHouseholdId}
                    onChange={(e) => setSelectedHouseholdId(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.8 bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 text-slate-800"
                    required={recipientType === 'single'}
                  >
                    <option value="" disabled>--- Vui lòng ấn chọn chủ hộ ---</option>
                    {households.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.headName} • Hộ: {h.id} • Địa chỉ: {h.address}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientType === 'risk' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 animate-fadeIn flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Chọn mức chỉ số dịch tễ cảnh báo:
                    </label>
                    <div className="flex gap-2">
                      {[
                        { key: 'danger', lab: 'Nguy cơ cao (Đỏ)', bg: 'bg-rose-500' },
                        { key: 'warning', lab: 'Cần theo dõi (Vàng)', bg: 'bg-amber-500' },
                        { key: 'healthy', lab: 'Khỏe mạnh (Xanh)', bg: 'bg-emerald-500' }
                      ].map(item => (
                        <button
                          type="button"
                          key={item.key}
                          onClick={() => setSelectedRiskLevel(item.key as any)}
                          className={`flex-1 py-1 px-3 text-[10px] rounded-lg border font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                            selectedRiskLevel === item.key 
                              ? "bg-white border-slate-900 shadow-sm text-slate-900 font-bold" 
                              : "bg-slate-100 border-transparent text-slate-500"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.bg}`} />
                          {item.lab}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {recipientType === 'chronic' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 animate-fadeIn">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Chọn nhóm có bệnh lý nền cụ thể:
                  </label>
                  <select
                    value={selectedChronic}
                    onChange={(e) => setSelectedChronic(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.8 bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 text-slate-800"
                  >
                    {allChronicConditions.length > 0 ? (
                      allChronicConditions.map(chr => (
                        <option key={chr} value={chr}>{chr}</option>
                      ))
                    ) : (
                      <>
                        <option value="Tăng huyết áp">Tăng huyết áp</option>
                        <option value="Đái tháo đường">Đái tháo đường</option>
                        <option value="Hen phế quản">Hen phế quản</option>
                        <option value="Tim mạch">Tim mạch</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Choose communication channel */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                2. Kênh phát thông báo điện tử
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChannel('Zalo')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition duration-150 ${
                    selectedChannel === 'Zalo'
                      ? "bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-sm"
                      : "bg-white border-slate-205 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs bg-blue-105 px-1.5 py-0.5 rounded text-blue-600 font-extrabold tracking-wide mb-1">Zalo OA</span>
                  <span className="text-[9px] text-slate-400">Giao dịch 0đ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel('SMS')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition duration-150 ${
                    selectedChannel === 'SMS'
                      ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold shadow-sm"
                      : "bg-white border-slate-205 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs bg-emerald-105 px-1.5 py-0.5 rounded text-emerald-600 font-extrabold tracking-wide mb-1">SMS Brand</span>
                  <span className="text-[9px] text-slate-400">Trạm y tế bao phí</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel('App')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition duration-150 ${
                    selectedChannel === 'App'
                      ? "bg-slate-900 border-slate-800 text-white font-bold shadow-sm"
                      : "bg-white border-slate-205 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs bg-slate-105 px-1.5 py-0.5 rounded text-slate-700 font-extrabold tracking-wide mb-1">App In-box</span>
                  <span className="text-[9px] text-slate-400">Hộp thư gia đình</span>
                </button>
              </div>
            </div>

            {/* 3. Title & Content text compose */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  3. Tiêu đề / Mục đích tin nhắn (viết hoa)
                </label>
                <input
                  type="text"
                  placeholder="VD: KHUYẾN CÁO PHÒNG DỊCH SỐT XUẤT HUYẾT KHẨN CẤP"
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-indigo-500 text-slate-800 font-bold placeholder-slate-405 uppercase"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Nội dung thông tin truyền thông
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold">{msgContent.length} ký tự</span>
                </div>
                
                <textarea
                  placeholder="Nhập nội dung chi tiết thông điệp sức khỏe gửi tới bà con cư dân..."
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  className="w-full h-24 text-xs p-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-indigo-500 text-slate-800 font-medium leading-relaxed resize-none"
                  required
                />
              </div>
            </div>

            {/* Smart Action line */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100/50">
              <span className="text-[10px] text-indigo-800 font-medium leading-normal flex-1 max-w-sm">
                💡 Bạn muốn tin nhắn có giọng văn chuẩn Bộ Y tế, thân mật và kêu gọi hành động cao hơn?
              </span>
              <button
                type="button"
                onClick={handleAIEnhance}
                className="px-3.5 py-1.8 bg-indigo-600 hover:bg-slate-900 text-white font-bold text-[10px] tracking-wider uppercase rounded-lg flex items-center gap-1 transition duration-150 cursor-pointer self-start shadow-sm border-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" /> Bác sĩ AI tối ưu hóa
              </button>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className={`w-full py-3 bg-slate-900 border-0 hover:bg-teal-600 active:scale-98 text-white rounded-xl text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer transition shadow-lg ${
                isSending ? 'opacity-80 cursor-wait' : ''
              }`}
            >
              <Send className="w-4 h-4 text-teal-400" />
              {isSending ? "ĐANG THỰC HIỆN TẢI PHÁT KHẨN..." : "TIẾN HÀNH PHÁT LOA - GỬI TIN"}
            </button>

          </form>

        </div>

        {/* RIGHT COLUMN: Mobile Previewer & History (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* A. Dynamic Interactive Phone Preview Emulator */}
          <div className="bg-slate-900 rounded-[2.5rem] border-[10px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col h-[380px] max-w-[310px] mx-auto select-none">
            
            {/* Phone speaker top notch element */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 w-28 h-5 rounded-b-xl flex items-center justify-center px-4 gap-2 z-25">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              <span className="w-10 h-1 bg-slate-900 rounded-md" />
            </div>

            {/* Carrier Info bar */}
            <div className="bg-slate-950 text-[8px] text-slate-400 px-5 pt-6 pb-2 flex justify-between items-center z-10 shrink-0 font-mono">
              <span>Mobifone-TYT</span>
              <div className="flex items-center gap-1">
                <span>LTE</span>
                <span>🔋 98%</span>
              </div>
            </div>

            {/* Simulated app visual header */}
            {selectedChannel === 'Zalo' ? (
              <div className="bg-blue-600 text-white p-3 pt-1 flex items-center gap-2 shrink-0">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-bold text-[10px]">Z</div>
                <div>
                  <h4 className="font-bold text-[10px]">Trạm Y Tế Phường Tân Hưng</h4>
                  <span className="text-[8px] text-blue-200">Zalo Official Account</span>
                </div>
              </div>
            ) : selectedChannel === 'SMS' ? (
              <div className="bg-slate-100 text-slate-800 p-3 pt-1 flex items-center gap-2 shrink-0 border-b border-slate-200">
                <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-[10px]">💬</div>
                <div>
                  <h4 className="font-bold text-[10px]">TYT_TAN_HUNG</h4>
                  <span className="text-[8px] text-slate-500">Tổng đài SMS Brandname chính thức</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-850 text-teal-400 p-3 pt-1 flex items-center gap-2 shrink-0 border-b border-slate-800">
                <div className="w-6 h-6 bg-teal-500/20 rounded-full flex items-center justify-center text-[10px]">🏥</div>
                <div>
                  <h4 className="font-bold text-[10px] text-slate-200">HỘP THƯ GIA ĐÌNH KHỎE</h4>
                  <span className="text-[8px] text-teal-500">Mạng nội bộ trạm y tế</span>
                </div>
              </div>
            )}

            {/* Simulation Message Canvas Container */}
            <div className="flex-1 overflow-y-auto bg-slate-900 p-4 space-y-4">
              <span className="block text-center text-[8px] text-slate-500 font-mono">
                Hôm nay, {new Date().toLocaleDateString('vi-VN')}
              </span>

              {/* Msg bubble container layout styles */}
              <div className={`p-3 max-w-[90%] rounded-2xl text-[10px] shadow-md animate-zoomIn leading-relaxed select-text ${
                selectedChannel === 'Zalo' 
                  ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm ml-0 mr-auto" 
                  : selectedChannel === 'SMS' 
                  ? "bg-emerald-600 text-white rounded-tr-sm ml-auto mr-0" 
                  : "bg-slate-800 border border-slate-705 text-slate-200 rounded-tl-sm ml-0 mr-auto"
              }`}>
                {msgTitle && (
                  <p className="font-extrabold uppercase mb-1 border-b pb-1 opacity-90 border-slate-100 tracking-wide text-[9px]">
                    📬 {msgTitle}
                  </p>
                )}
                <p className="whitespace-pre-line font-medium text-justify">{msgContent || "Đang chờ nhập nội dung..."}</p>
                <div className="text-[7px] text-slate-400 text-right mt-2 flex items-center justify-end gap-1 font-mono">
                  <span>12:35 PM</span>
                  {selectedChannel === 'Zalo' && <span className="text-blue-500 font-sans">✓ Đã gửi</span>}
                  {selectedChannel === 'SMS' && <span className="text-emerald-300 font-sans">✓ Đã phát</span>}
                </div>
              </div>
            </div>

            {/* Bottom action instruction line bar */}
            <div className="bg-slate-950 p-2 text-center text-[8.5px] text-slate-400 border-t border-slate-800 shrink-0 font-display font-medium">
              📱 Mô phỏng Giao diện Người dân Nhận Tin
            </div>
            
          </div>

          {/* B. Sent messages history logs logs */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            
            <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
                <History className="w-4 h-4 text-slate-500" /> Nhật ký Truyền thông Phường
              </h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">
                Tổng cộng: {sentLogs.length}
              </span>
            </div>

            {/* Search filter for history */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm tiêu đề, nội dung hoặc người nhận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.8 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-indigo-500 text-slate-800"
              />
              <span className="absolute left-2.5 top-2.2 text-slate-400 text-[10px]">🔍</span>
            </div>

            {/* List representation feed */}
            <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs hover:border-slate-300 hover:bg-slate-100/30 transition shadow-sm relative group"
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md border-0 cursor-pointer opacity-0 group-hover:opacity-100 transition"
                        title="Xóa bản nhật ký này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-start gap-2 pr-6">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          log.channel === 'Zalo' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : log.channel === 'SMS' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}>
                          {log.channel}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-850 leading-snug">{log.title}</h4>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                            Bà con: {log.recipientLabel}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2 font-normal leading-relaxed break-normal italic bg-white p-2 border border-slate-150/50 rounded-lg">
                        "{log.content}"
                      </p>

                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-200/50 text-[9px] text-slate-400 font-mono">
                        <span>Gửi lúc: {log.sentAt}</span>
                        <span className={`font-bold flex items-center gap-0.8 ${log.status.includes('đọc') ? 'text-blue-600' : 'text-emerald-600'}`}>
                          ● {log.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-slate-400 py-10">
                  <Inbox className="w-6 h-6 text-slate-300 mx-auto mb-1 opacity-70" />
                  Không tìm thấy tin nhắn trùng khớp hợp lệ.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
