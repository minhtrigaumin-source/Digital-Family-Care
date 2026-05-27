import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, Activity, User, Stethoscope, AlertCircle, 
  Info, Bot, UserCheck, RefreshCw, AlertTriangle, ShieldCheck, HelpCircle
} from 'lucide-react';
import { Household, HouseholdMember, WardInfo, EpidemiologicalAlert } from '../types';

interface AIAssistantProps {
  households: Household[];
  wardInfo: WardInfo;
  alerts: EpidemiologicalAlert[];
  presetSelectedMember?: HouseholdMember | null;
  onClearPresetMember?: () => void;
  user?: { name: string; email: string; role: 'officer' | 'admin' } | null;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export default function AIAssistant({
  households,
  wardInfo,
  alerts,
  presetSelectedMember,
  onClearPresetMember,
  user,
}: AIAssistantProps) {
  // Chat History
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Xin chào! Tôi là **Trợ lý Y tế Trí tuệ Nhân tạo** của Trạm y tế Phường. 

Tôi có khả năng phân tích toàn diện hồ sơ y tế hộ gia đình, đánh giá sự dao động các chỉ số cơ thể (BMI, Huyết áp, Đường huyết) và tư vấn phòng chống dịch bệnh dựa trên thông tin thực tế của từng nhân khẩu.

Bạn có thể **lựa chọn một thành viên gia đình để phân tích nhanh** ở thanh công cụ bên dưới, hoặc chọn một số câu hỏi y tế mẫu của phường nhé! `,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Target member context selector
  const [selectedMemberId, setSelectedMemberId] = useState<string>('none');

  // Ref for chat scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Flatten all members for selection
  const allMembers: { member: HouseholdMember; household: Household }[] = [];
  households.forEach(h => {
    h.members.forEach(m => {
      allMembers.push({ member: m, household: h });
    });
  });

  // Watch for preset changes from other tabs
  useEffect(() => {
    if (presetSelectedMember) {
      setSelectedMemberId(presetSelectedMember.id);
      
      // Auto-trigger an initial review request
      const age = new Date().getFullYear() - new Date(presetSelectedMember.dob).getFullYear();
      const messageText = `Hãy phân tích tình trạng sức khỏe của tôi (${presetSelectedMember.fullName}, ${age} tuổi, giới tính ${presetSelectedMember.gender}) và đưa ra lời khuyên y tế, chế độ ăn dựa trên các chỉ số của tôi.`;
      
      triggerAIService(messageText, presetSelectedMember);
      
      // Clear parent preset indicator
      if (onClearPresetMember) onClearPresetMember();
    }
  }, [presetSelectedMember]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Guidelines preset trigger
  const handlePresetTrigger = (promptText: string) => {
    let targetMember: HouseholdMember | undefined = undefined;
    if (selectedMemberId !== 'none') {
      targetMember = allMembers.find(item => item.member.id === selectedMemberId)?.member;
    }
    triggerAIService(promptText, targetMember);
  };

  const handleSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');

    let targetMember: HouseholdMember | undefined = undefined;
    if (selectedMemberId !== 'none') {
      targetMember = allMembers.find(item => item.member.id === selectedMemberId)?.member;
    }

    triggerAIService(userMessage, targetMember);
  };

  // Central trigger to backend API call
  const triggerAIService = async (userMessage: string, targetMember?: HouseholdMember) => {
    // Append user message locally
    const userMsgObj: Message = {
      role: 'user',
      text: userMessage,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsgObj]);
    setLoading(true);
    setErrorMsg(null);

    try {
      // Build contexts
      const activeAlerts = alerts.filter(a => a.active);
      const wardContext = {
        wardName: wardInfo.name,
        healthCenterPhone: wardInfo.healthCenterPhone,
        healthCenterAddress: wardInfo.healthCenterAddress,
        activeAlerts: activeAlerts
      };

      // Query server endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(1).map(m => ({
            role: m.role,
            text: m.text
          })),
          patientContext: targetMember || null,
          wardContext: wardContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gặp sự cố không mong muốn khi gọi API.");
      }

      const modelMsgObj: Message = {
        role: 'model',
        text: data.text || "Xin lỗi, tôi chưa rút trích được nội dung trả lời.",
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, modelMsgObj]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Không thể kết nối đến Trợ lý AI.");
    } finally {
      setLoading(false);
    }
  };

  const activeReviewMember = allMembers.find(item => item.member.id === selectedMemberId);

  return (
    <div className="space-y-6">
      
      {/* Visual Header Grid Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl text-white shadow-sm shrink-0">
              <Stethoscope className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-1.5">
                Bác Sĩ Trí Tuệ Nhân Tạo <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Gemini 3.5</span>
              </h2>
              <p className="text-xs text-slate-500">Mô hình tư vấn, rà soát chỉ số y sinh cho hộ gia đình và cảnh báo dịch tễ</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
            <UserCheck className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 shrink-0">Lựa chọn nhân khẩu cần tư vấn:</span>
            <select
              value={selectedMemberId}
              onChange={e => setSelectedMemberId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-700 font-medium focus:outline-teal-500 w-full md:w-56"
            >
              <option value="none">-- Tìm kiếm chung toàn Phường --</option>
              {allMembers.map(item => (
                <option key={item.member.id} value={item.member.id}>
                  {item.member.fullName} ({item.member.relationship} - HGĐ {item.household.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected citizen details summary strip for guidance context */}
        {activeReviewMember && (
          <div className="mt-4 bg-teal-50/50 rounded-xl p-3 border border-teal-100 flex flex-wrap gap-4 items-center text-xs text-slate-700">
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-800">{activeReviewMember.member.fullName}</span> 
              <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.2 rounded font-medium">
                {activeReviewMember.member.relationship}
              </span>
            </div>
            <div>CCCD: <span className="font-semibold text-slate-800">{activeReviewMember.member.id}</span></div>
            <div>BMI Châu Á: <span className="font-semibold text-slate-800">{(activeReviewMember.member.weight / ((activeReviewMember.member.height/100)*(activeReviewMember.member.height/100))).toFixed(1)}</span></div>
            <div>Huyết áp: <span className="font-semibold text-slate-800">{activeReviewMember.member.bloodPressureSys}/{activeReviewMember.member.bloodPressureDia} mmHg</span></div>
            <div>Đường huyết: <span className="font-semibold text-slate-800">{activeReviewMember.member.bloodSugar} mmol/L</span></div>
            {activeReviewMember.member.chronicConditions.length > 0 && (
              <div className="flex items-center gap-1.5 text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                <AlertTriangle className="w-3 h-3 text-orange-600" /> Bệnh nền: {activeReviewMember.member.chronicConditions.join(', ')}
              </div>
            )}
            <button
              onClick={() => handlePresetTrigger(
                `Hãy rà soát kỹ các thông tin bệnh sử của tôi và lập một LỊCH NHẮC NHỞ TIÊM CHỦNG ĐỊNH KỲ chi tiết cho tôi (${activeReviewMember.member.fullName}). Vui lòng lập dưới dạng BẢNG BIỂU TRỰC QUAN bao gồm tên vắc-xin, mức độ cần gấp, ngày tiêm tiếp theo dự kiến lý tưởng trong năm 2026, lùi liều hoặc khoảng cách tối thiểu, dặn dò chăm sóc sức khỏe, và một mẫu tin nhắn SMS nhắc nhở cán bộ y tế có thể copy để gửi nhanh nhé!`
              )}
              className="ml-auto bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer shadow-sm flex items-center gap-1 text-[10px] uppercase tracking-wide border-0"
              title="Nhấp để chatbot tự động lập lịch nhắc tiêm chủng chi tiết"
            >
              📅 Lên lịch nhắc tiêm chủng
            </button>
          </div>
        )}
      </div>

      {/* Main chat UI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Helper suggestions left: 1 column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <HelpCircle className="w-4 h-4 text-emerald-500" /> Chủ đề hỏi nhanh mẫu
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={() => handlePresetTrigger(
                  activeReviewMember 
                    ? `Dựa trên các chỉ số đo được và bệnh lý nền nếu có của tôi, hãy thiết lập một thực đơn dinh dưỡng hàng ngày lý tưởng của chuẩn Bộ Y Tế, các loại đồ ăn nên tránh và môn thể thao thích hợp nhất.` 
                    : "Thiết kế một thực đơn 7 ngày hợp lý cho hộ gia đình có người lớn tuổi bị cao huyết áp nhẹ và trẻ nhỏ cần bổ sung canxi."
                )}
                className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/10 text-xs text-slate-700 font-medium cursor-pointer transition"
              >
                🍳 Thực đơn sinh hoạt & ăn kiêng y tế
              </button>
              
              <button
                onClick={() => handlePresetTrigger(
                  activeReviewMember 
                    ? `Kiểm tra hồ sơ tiêm chủng của tôi. Hãy rà soát danh sách mũi tiêm cơ bản và cho tôi biết tôi còn thiếu hay quá hạn mũi nào đặc trưng không nhé.` 
                    : "Độ tuổi vàng để tiêm phòng các loại vắc-xin cơ bản cho trẻ em Việt Nam từ sơ sinh đến dưới 6 tuổi là gì?"
                )}
                className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/10 text-xs text-slate-700 font-medium cursor-pointer transition"
              >
                💉 Rà soát sổ tiêm chủng định kỳ
              </button>

              <button
                onClick={() => handlePresetTrigger(
                  activeReviewMember 
                    ? `Hãy thiết lập một LỊCH NHẮC NHỞ TIÊM CHỦNG ĐỊNH KỲ chi tiết cho tôi (${activeReviewMember.member.fullName}) dạng BẢNG TRỰC QUAN kèm mẫu nhắn tin SMS nhắc nhở qua Zalo nhé!` 
                    : "Hãy cung cấp một biểu mẫu và quy trình nhắn tin SMS tự động nhắc nhở tiêm chủng cho các hộ dân của Trạm y tế Phường."
                )}
                className="w-full text-left p-2.5 rounded-lg border border-rose-100 bg-rose-50/10 text-rose-800 hover:border-rose-200 hover:bg-rose-50/20 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
              >
                📅 Lên lịch nhắc tiêm chủng
              </button>

              <button
                onClick={() => handlePresetTrigger(
                  "Hãy đưa ra hướng dẫn phòng chống bệnh Sốt xuất huyết cấp Phường và cách súc rửa lưu hồ chứa lăng quăng đúng quy trình."
                )}
                className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/10 text-xs text-slate-700 font-medium cursor-pointer transition"
              >
                🦟 Phòng dịch sốt xuất huyết tại TDP
              </button>

              <button
                onClick={() => handlePresetTrigger(
                  activeReviewMember 
                    ? `Các dấu hiệu đột quỵ hay biến chứng nhồi máu cơ tim, suy thận nào mà tôi cần đặc biệt cảnh giác dựa trên các chỉ số huyết áp/đường huyết của tôi?` 
                    : "Cách nhận biết nhanh dấu hiệu tai biến đột quỵ (quy tắc F.A.S.T) và cách sơ cứu khẩn cấp tại nhà."
                )}
                className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/10 text-xs text-slate-700 font-medium cursor-pointer transition"
              >
                ⚠️ Nhận diện tai biến & Sơ cứu nhanh
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-slate-600">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Info className="w-4 h-4 text-slate-500" /> Bản quyền y khoa cơ sở:
            </span>
            <p className="leading-relaxed text-[11px]">
              Hệ thống sử dụng mô hình ngôn ngữ lớn để diễn giải chỉ số sức khỏe định dạng thô. Khuyến cáo không thay thế chẩn đoán độc lập từ bác sĩ lâm sàng có chuyên môn tại Trạm y tế.
            </p>
          </div>
        </div>

        {/* Chat layout area: 3 columns */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-[520px]">
          
          {/* Messages view wrapper */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Show error indicator for Gemini API Key configuration */}
            {errorMsg && (
              <div className="bg-red-50 rounded-xl border border-red-100 p-4 space-y-2.5 text-xs text-red-800">
                <p className="font-bold flex items-center gap-1.5 text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0" /> Gặp lỗi cấu hình Trợ lý AI (Chưa bật khóa kết nối)
                </p>
                <p className="leading-relaxed text-[11px] text-red-700">
                  Hệ thống không thể gọi được mô hình Gemini do thiếu biến môi trường <code className="bg-red-100 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code>.
                </p>
                <div className="bg-white p-3 rounded-lg border border-red-100/50 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                  <span className="font-bold text-slate-700">Cách xử lý cực kỳ đơn giản cho người đánh giá:</span>
                  <p>1. Bấm vào biểu tượng <strong>Cài đặt (Settings) &rarr; Secrets</strong> ở thanh menu phía trên/phía góc giao diện AI Studio.</p>
                  <p>2. Chọn khóa <strong>GEMINI_API_KEY</strong> và dán mã API Key của bạn vào đó.</p>
                  <p>3. Làm mới trình duyệt hoặc bấm gửi lại tin nhắn là Trợ lý AI sẽ hoạt động hoàn toàn miễn phí!</p>
                </div>
              </div>
            )}

            {messages.map((m, idx) => {
              const isAI = m.role === 'model';
              const age = activeReviewMember ? new Date().getFullYear() - new Date(activeReviewMember.member.dob).getFullYear() : 0;

              return (
                <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                    
                    {/* Avatar icons bubble */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      isAI ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Chat Text Card bubble */}
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-1.5 border ${
                      isAI 
                        ? 'bg-slate-50 text-slate-800 border-slate-100 rounded-tl-none' 
                        : 'bg-teal-600 text-white border-teal-500 rounded-tr-none'
                    }`}>
                      {/* Name marker */}
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                        {isAI ? 'Trợ lý Y tế Phường' : 'Cán bộ / Người dân'}
                      </span>
                      
                      <div className="whitespace-pre-wrap markdown-body font-normal">
                        {m.text}
                      </div>

                      <span className="text-[9px] opacity-50 block pt-1 text-right">
                        {m.timestamp}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* AI waiting loader skeleton */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 animate-bounce">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 rounded-tl-none text-xs space-y-1 text-slate-500 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" /> Gemini đang tra cứu hồ sơ sức khỏe y sinh...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form input messaging footer bar */}
          <form onSubmit={handleSubmitChat} className="p-3.5 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center gap-2">
            <input 
              type="text" 
              placeholder={
                selectedMemberId !== 'none' 
                  ? `Hỏi y tế về chỉ số của thành viên ${activeReviewMember?.member.fullName || 'đang chọn'}...`
                  : "Nhập câu hỏi tham vấn y sinh sức khỏe của bạn..."
              }
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 shadow-sm transition"
              disabled={loading}
            />
            
            <button
              type="submit"
              className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl shadow-sm transition cursor-pointer"
              disabled={loading || !inputValue.trim()}
              title="Gửi câu hỏi"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
