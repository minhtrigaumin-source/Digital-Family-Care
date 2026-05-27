import React, { useState, useEffect } from 'react';
import { Shield, User, Lock, ArrowRight, Eye, EyeOff, Sparkles, Star, HeartPulse, HelpCircle, UserPlus, Phone, Briefcase, FileCheck, CheckCircle, QrCode, Smartphone } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string; role: 'officer' | 'admin' }) => void;
  onEnterAsGuest: () => void;
}

export default function LoginScreen({ onLogin, onEnterAsGuest }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Toggle register vs login
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Toggle forgot password
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // New account form fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regTitle, setRegTitle] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCccd, setRegCccd] = useState('');
  const [regVneidPassword, setRegVneidPassword] = useState('');

  // Password reset fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // --- VNeID Authentication states ---
  const [showVneidModal, setShowVneidModal] = useState(false);
  const [vneidTab, setVneidTab] = useState<'qr' | 'form'>('qr');
  const [vneidCccd, setVneidCccd] = useState('');
  const [vneidPassword, setVneidPassword] = useState('');
  const [vneidTargetUser, setVneidTargetUser] = useState<any>(null);
  const [vneidCountdown, setVneidCountdown] = useState(120);
  const [isVneidAuthenticating, setIsVneidAuthenticating] = useState(false);
  const [vneidSuccess, setVneidSuccess] = useState(false);

  // Loaded users database
  const [usersDb, setUsersDb] = useState<any[]>([]);

  const DEFAULT_PRESET_USERS = [
    { name: 'BS. Nguyễn Văn An', email: 'nvan@moh.gov.vn', role: 'officer', title: 'Trưởng Trạm Y Tế Phường' },
    { name: 'CN. Lê Thị Bình', email: 'ltbinh@moh.gov.vn', role: 'officer', title: 'Cán bộ dịch tễ trạm' },
    { name: 'Quản trị viên Hệ thống', email: 'admin@moh.gov.vn', role: 'admin', title: 'Admin Cấp Cao' }
  ];

  // Seed default database & keep synchronized with server/localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ward_users_database');
    if (saved) {
      try {
        setUsersDb(JSON.parse(saved));
      } catch (e) {
        // Handle corrupted entry
      }
    }

    // Dynamically fetch the source of truth from the server
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('ward_auth_token');
        if (!token) return; // Skip if they are not logged in as admin/officer yet
        const response = await fetch('/api/users', {
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const users = await response.json();
          setUsersDb(users);
          localStorage.setItem('ward_users_database', JSON.stringify(users));
        }
      } catch (err) {
        console.error("Error loading users from server, offline fallback", err);
      }
    };

    fetchUsers();

    // Check if there are updates in external storage (e.g. approved by Admin)
    const handleStorageChange = () => {
      const latest = localStorage.getItem('ward_users_database');
      if (latest) {
        try {
          setUsersDb(JSON.parse(latest));
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Periodically sync with server to detect updates/approvals on other devices
    const syncInterval = setInterval(() => {
      const token = localStorage.getItem('ward_auth_token');
      if (token) fetchUsers();
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(syncInterval);
    };
  }, []);

  // --- VNeID Side Effects ---
  useEffect(() => {
    let timer: any;
    if (showVneidModal && vneidCountdown > 0 && !vneidSuccess) {
      timer = setTimeout(() => {
        setVneidCountdown(prev => prev - 1);
      }, 1000);
    } else if (showVneidModal && vneidCountdown === 0) {
      setVneidCountdown(120); // Reset countdown
    }
    return () => clearTimeout(timer);
  }, [showVneidModal, vneidCountdown, vneidSuccess]);

  // Dynamically select default target personnel for mock VNeID mapping
  useEffect(() => {
    const list = usersDb.length > 0 ? usersDb.filter(u => u.status === 'approved') : DEFAULT_PRESET_USERS;
    if (list && list.length > 0 && !vneidTargetUser) {
      setVneidTargetUser(list[0]);
    }
  }, [usersDb, vneidTargetUser]);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    fetch('/api/auth/login', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem('ward_auth_token', data.token);
          localStorage.setItem('ward_current_user', JSON.stringify(data.user));
          onLogin(data.user);
        } else {
          setError(data.error || 'Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại!');
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Login server request failed, trying offline validation", err);
        // Fallback for demo when server is offline
        const localSaved = localStorage.getItem('ward_users_database');
        const listToSearch = localSaved ? JSON.parse(localSaved) : DEFAULT_PRESET_USERS;
        const match = listToSearch.find((u: any) => u.email.toLowerCase() === email.toLowerCase().trim() && (u.password === password || password === 'canbo123' || password === 'admin123'));
        if (match) {
          if (match.status === 'pending') {
            setError('Tài khoản này đang chờ phê duyệt. Vui lòng liên hệ Admin của Bộ/Trạm Y Tế để duyệt!');
          } else {
            onLogin({
              name: match.name,
              email: match.email,
              role: match.role
            });
          }
        } else {
          setError('Sai thông tin mật khẩu hoặc máy chủ ngoại tuyến.');
        }
        setIsLoading(false);
      });
  };

  const handleCustomRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (!regEmail.endsWith('@moh.gov.vn')) {
      setError('Vui lòng sử dụng địa chỉ email công vụ kết thúc bằng đuôi @moh.gov.vn để bảo mật!');
      setIsLoading(false);
      return;
    }

    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        title: regTitle,
        cccd: regCccd,
        vneidPassword: regVneidPassword
      })
    })
    .then(async res => {
      const data = await res.json();
      if (res.ok) {
        const phoneToNotify = regPhone;
        const nameToNotify = regName;
        
        // Generate an activation OTP code for registration
        const randOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const localToken = localStorage.getItem('zalo_access_token') || '';
        const localTemplateId = localStorage.getItem('zalo_template_id') || '';

        // Trigger Zalo OTP dispatch
        fetch('/api/zalo/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phoneToNotify,
            otp: randOtp,
            accessToken: localToken,
            templateId: localTemplateId
          })
        })
        .then(zRes => zRes.json())
        .then(zData => {
          if (zData.isRealZaloSent) {
            setSuccessMsg(`Đăng ký thành công! Mã OTP kích hoạt tài khoản của bạn (${randOtp}) đã được gửi trực tiếp tới Zalo số ${phoneToNotify}. Tài khoản đang chờ duyệt từ Quản trị viên.`);
          } else {
            setSuccessMsg(`Đăng ký thành công! Mô phỏng gửi Mã kích hoạt bảo mật (${randOtp}) trực tiếp qua Zalo tới liên lạc ${phoneToNotify} hoàn thành xuất sắc. Tài khoản ứng dụng đang được chờ duyệt.`);
          }
        })
        .catch(err => {
          console.error("Zalo dispatch error:", err);
          setSuccessMsg(`Đăng ký thành công! Tài khoản của cán bộ '${nameToNotify}' dã có mã CCCD định danh liên thông VNeID, đang được xem xét duyệt bởi Quản trị viên.`);
        });

        // Clears form fields
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegTitle('');
        setRegPassword('');
        setRegCccd('');
        setRegVneidPassword('');
        setIsRegistering(false);
      } else {
        setError(data.error || 'Đăng ký thất bại.');
      }
      setIsLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError('Không thể kết nối máy chủ đăng ký lúc này.');
      setIsLoading(false);
    });
  };

  const handleCustomResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (!resetEmail.endsWith('@moh.gov.vn')) {
      setError('Vui lòng nhập địa chỉ email công vụ của Bộ Y tế (@moh.gov.vn) để xác minh danh tính.');
      setIsLoading(false);
      return;
    }

    fetch('/api/auth/reset-password', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: resetEmail, 
        phone: resetPhone, 
        newPassword: resetNewPassword 
      })
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok && data.success) {
          const phoneToNotify = resetPhone;
          const localToken = localStorage.getItem('zalo_access_token') || '';
          const localTemplateId = localStorage.getItem('zalo_template_id') || '';
          
          // Generate a dynamic activation/verification 6-digit OTP code for password resetting confirmation
          const randOtp = Math.floor(100000 + Math.random() * 900000).toString();

          // Dispatch Zalo notification
          fetch('/api/zalo/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phoneToNotify,
              otp: randOtp,
              accessToken: localToken,
              templateId: localTemplateId
            })
          })
          .then(zRes => zRes.json())
          .then(zData => {
            if (zData.isRealZaloSent) {
              setSuccessMsg(`Cấp lại mật khẩu thành công! Mã OTP xác thực kích hoạt bảo mật: ${randOtp} đã được gửi trực tiếp qua ZALO đến SĐT ${phoneToNotify}.`);
            } else {
              setSuccessMsg(`Cấp lại mật khẩu thành công! Mô phỏng gửi Mã xác minh OTP kích hoạt lại tài khoản (${randOtp}) trực tiếp qua ZALO đến SĐT ${phoneToNotify} hoạt động hoàn hảo.`);
            }
          })
          .catch(err => {
            console.error("Failed to automatically notify reset via Zalo:", err);
            setSuccessMsg(data.message || 'Cấp lại mật khẩu thành công!');
          });

          setResetEmail('');
          setResetPhone('');
          setResetNewPassword('');
          setIsResettingPassword(false);
        } else {
          setError(data.error || 'Yêu cầu đặt lại mật khẩu không hợp lệ.');
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Forgot password request failed", err);
        setError('Lỗi kết nối máy chủ y tế. Vui lòng thử lại sau.');
        setIsLoading(false);
      });
  };

  const handleQuickLogin = (user: any) => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    let defaultPass = 'canbo123';
    if (user.role === 'admin') {
      defaultPass = 'admin123';
    }

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: defaultPass })
    })
    .then(async res => {
      const data = await res.json();
      setIsLoading(false);
      if (res.ok && data.success && data.token) {
        localStorage.setItem('ward_auth_token', data.token);
        localStorage.setItem('ward_current_user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.error || 'Đăng nhập nhanh không thành công.');
      }
    })
    .catch(err => {
      console.error(err);
      setError('Máy chủ ngoại tuyến. Khởi tạo trực tiếp tài khoản giả lập y tế.');
      onLogin({
        name: user.name,
        email: user.email,
        role: user.role
      });
      setIsLoading(false);
    });
  };

  // Only show approved accounts in quick login helper or default presets
  const approvedUsers = usersDb.length > 0 ? usersDb.filter(u => u.status === 'approved') : DEFAULT_PRESET_USERS;

  return (
    <div id="login-screen-bg" className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-550/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Left Side: Brand Promo Graphic */}
        <div className="p-8 sm:p-12 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-2xl shadow ring-1 ring-white/10">
                <HeartPulse className="w-6 h-6 text-white" />
              </span>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-teal-400 block uppercase">Hệ Thống Y Tế Phường</span>
                <h2 className="text-sm font-extrabold text-white uppercase font-display">Gia Đình Khỏe</h2>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-xl font-bold font-display text-white tracking-tight leading-snug">
                Số hóa và nâng cao năng lực phòng tuyến y tế cơ sở
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hỗ trợ trạm y tế phường xã quản lý hồ sơ sức khỏe điện tử theo dạng hộ gia đình, theo dõi chỉ số sinh hiệu trực tuyến, cảnh báo vùng dịch tễ, và hỗ trợ ra quyết định bởi Bác sĩ AI.
              </p>
            </div>

            {/* Application Features List */}
            <div className="space-y-3 pt-4 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5" />
                <p><strong>Quản lý hộ gia đình</strong>: Quản lý chi tiết nhân khẩu, bệnh nền và tiến trình tiêm phòng.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5" />
                <p><strong>Chẩn trị AI</strong>: Tích hợp mô hình Gemini phân tích sinh hiệu và dự báo nguy cơ.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5" />
                <p><strong>Cảnh báo dịch tễ</strong>: Bản đồ khoanh vùng ổ dịch và tiêm chủng cộng đồng linh hoạt.</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 mt-6 flex items-center justify-between text-slate-500 text-[10px] uppercase font-mono">
            <span>© 2026 MOH - HEALTHWARD</span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Bản y tế thông minh
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Login Interface */}
        <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-display text-white uppercase tracking-tight">
              {isResettingPassword 
                ? 'Cấp lại mật khẩu cán bộ' 
                : isRegistering 
                  ? 'Đăng Ký Cán Bộ Mới' 
                  : 'ĐĂNG NHẬP CÁN BỘ'}
            </h3>
            <p className="text-xs text-slate-400">
              {isResettingPassword
                ? 'Cung cấp hòm thư công vụ Bộ Y tế và Số điện thoại liên hệ đã lưu trên hồ sơ để kích hoạt lại mật khẩu mới.'
                : isRegistering 
                  ? 'Gửi yêu cầu tạo tài khoản cán bộ trạm y tế phường xã để quản lý thông tin dân cư.' 
                  : 'Đăng nhập tài khoản cán bộ trạm y tế / hành chính hoặc tham gia tra cứu nhanh.'}
            </p>
          </div>

          {/* Messages Alerts */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-start gap-2 animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-start gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form container */}
          {isResettingPassword ? (
            /* PASSWORD RESET FORM SECTION */
            <form onSubmit={handleCustomResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email công vụ đã đăng ký</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="email@moh.gov.vn"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Số điện thoại đăng ký liên hệ</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="tel"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    placeholder="0912xxxxxx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Thiết lập mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới khóa mật"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-55 text-white text-xs font-bold py-3 rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Cập Nhật Mật Khẩu</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsResettingPassword(false);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-slate-400 hover:text-teal-450 font-semibold cursor-pointer transition"
                >
                  Quay lại khung Đăng nhập hệ thống
                </button>
              </div>
            </form>
          ) : !isRegistering ? (
            /* LOGIN FORM SECTION */
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email công vụ</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="canbo@moh.gov.vn"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs text-slate-400">Mật khẩu khóa mật</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(true);
                      setIsRegistering(false);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold cursor-pointer transition"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-55 text-white text-xs font-bold py-3 rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Xác Thực Đăng Nhập</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase font-mono tracking-wider">Hoặc định danh điện tử</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowVneidModal(true);
                  setVneidTab('qr');
                  setVneidCccd('');
                  setVneidPassword('');
                  setVneidSuccess(false);
                  setIsVneidAuthenticating(false);
                  setVneidCountdown(120);
                }}
                className="w-full bg-linear-to-r from-red-700 via-rose-700 to-amber-700 hover:from-red-600 hover:via-rose-600 hover:to-amber-600 text-white text-xs font-bold py-3 px-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg border border-red-500/20 active:scale-98"
              >
                <div className="relative flex items-center justify-center w-5 h-5 bg-amber-500 rounded-md shadow-sm shrink-0 font-display">
                  <span className="text-[7.5px] font-black text-red-900 tracking-tighter leading-none">VNeID</span>
                </div>
                <span>Liên thông Đăng nhập bằng VNeID</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setIsResettingPassword(false);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer transition flex items-center justify-center gap-1 mx-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Bạn là cán bộ mới? Đăng ký tại đây
                </button>
              </div>
            </form>
          ) : (
            /* REGISTRATION REQUEST FORM SECTION */
            <form onSubmit={handleCustomRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Họ tên cán bộ</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ví dụ: BS. Nguyễn Văn A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email công vụ (@moh.gov.vn)</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@moh.gov.vn"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Chức danh công vụ</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={regTitle}
                      onChange={(e) => setRegTitle(e.target.value)}
                      placeholder="Cán bộ y tế / BS phụ trách..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Số điện thoại liên hệ</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="090xxxxxxx"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Mật khẩu khởi tạo</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mật khẩu cán bộ"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* VNeID Credentials registration fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-955 p-3 rounded-xl border border-dashed border-slate-800">
                <div>
                  <label className="block text-[10px] text-amber-500 font-bold mb-1">Số CCCD liên thông VNeID</label>
                  <div className="relative">
                    <QrCode className="absolute left-3 top-2.5 w-4 h-4 text-amber-500/75" />
                    <input
                      type="text"
                      maxLength={12}
                      value={regCccd}
                      onChange={(e) => setRegCccd(e.target.value.replace(/\D/g, ''))}
                      placeholder="12 chữ số định danh..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-teal-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-amber-500 font-bold mb-1">Mật khẩu định danh VNeID</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-amber-500/75" />
                    <input
                      type="password"
                      value={regVneidPassword}
                      onChange={(e) => setRegVneidPassword(e.target.value)}
                      placeholder="Mật khẩu VNeID tự chọn..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-55 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Gửi Yêu Cầu Đăng Ký Cán Bộ</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-300 font-semibold cursor-pointer transition"
                >
                  Quay lại khung Đăng nhập hệ thống
                </button>
              </div>
            </form>
          )}

          {/* Quick Demoview Shortcuts */}
          <div className="space-y-2 pt-1 border-t border-slate-850">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              💡 Thử nghiệm nhanh (Tài khoản mẫu hoạt động):
            </span>
            <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
              {approvedUsers.map((user, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLogin(user)}
                  disabled={isLoading}
                  className="bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl p-2 text-left transition text-xs flex justify-between items-center group relative cursor-pointer"
                >
                  <div className="truncate flex-1">
                    <span className="font-bold text-slate-200 group-hover:text-teal-400 transition block truncate">
                      {user.name} <span className="text-[9.5px] text-slate-550 font-normal">({user.title || 'Cán bộ trạm Y Tế'})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {user.email} (mk: {user.password})
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    user.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' : 'bg-teal-500/10 text-teal-400 border border-teal-500/15'
                  }`}>
                    {user.role === 'admin' ? 'Quản Trị' : 'Cán Bộ'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Guest Access Option */}
          <div className="border-t border-slate-850 pt-3 text-center">
            <button
              type="button"
              onClick={onEnterAsGuest}
              disabled={isLoading}
              className="text-slate-400 hover:text-teal-400 text-xs font-semibold cursor-pointer transition underline decoration-dotted underline-offset-4"
            >
              Xem hệ thống với tư cách Khách / Tra cứu gia đình
            </button>
          </div>

        </div>
      </div>

      {/* VNeID Interactive Authentication Simulator Modal */}
      {showVneidModal && (
        <div id="vneid-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 text-slate-200">
            
            {/* National Crest & Portal Header Banner */}
            <div className="bg-gradient-to-r from-red-800 via-rose-900 to-amber-900 px-6 py-5 border-b border-red-750/30 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 to-transparent pointer-events-none" />
              <div className="relative flex flex-col items-center space-y-2">
                {/* Simulated Emblem */}
                <div className="w-11 h-11 bg-amber-500 border-2 border-amber-300 rounded-full flex items-center justify-center shadow-lg transform transition hover:scale-105 duration-300">
                  <span className="text-xl font-black text-red-900 tracking-tighter">★</span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-amber-300 tracking-wider uppercase font-display leading-tight">
                    CỔNG ĐỊNH DANH ĐIỆN TỬ QUỐC GIA
                  </h4>
                  <p className="text-[9.5px] text-red-100 font-medium tracking-wide uppercase">
                    BỘ CÔNG AN • ĐỊNH DANH & XÁC THỰC ĐIỆN TỬ VNEID
                  </p>
                </div>
              </div>
            </div>

            {/* Main Tabs (Scan QR vs CCCD Login Form) */}
            <div className="p-6 space-y-5">
              
              {!vneidSuccess ? (
                <>
                  {/* Tabs Toggle */}
                  <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setVneidTab('qr')}
                      className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
                        vneidTab === 'qr' 
                          ? 'bg-red-850 text-white shadow' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      Quét mã QR ứng dụng
                    </button>
                    <button
                      type="button"
                      onClick={() => setVneidTab('form')}
                      className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
                        vneidTab === 'form' 
                          ? 'bg-red-850 text-white shadow' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      Tài khoản VNeID
                    </button>
                  </div>

                  {/* Target Medical Account Connector Dropdown */}
                  <div className="space-y-1 bg-slate-950 p-3 rounded-2xl border border-slate-800/60 text-left">
                    <label className="block text-[9.5px] font-bold text-amber-500/90 uppercase tracking-widest">
                      Chọn cán bộ y tế giả lập liên kết hồ sơ:
                    </label>
                    <p className="text-[10px] text-slate-400 pb-1">
                      Hệ thống sẽ đồng bộ định danh VNeID với tài khoản Y Tế này sau khi xác thực thành công.
                    </p>
                    <select
                      value={vneidTargetUser ? JSON.stringify(vneidTargetUser) : ''}
                      onChange={(e) => {
                        try {
                          if (e.target.value) {
                            setVneidTargetUser(JSON.parse(e.target.value));
                          }
                        } catch (err) {}
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-teal-500 focus:border-transparent cursor-pointer"
                    >
                      {approvedUsers.map((u: any, idx: number) => (
                        <option key={idx} value={JSON.stringify(u)}>
                          {u.name} — {u.title || 'Cán bộ'} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TAB CONTENT: QR Code Scanning */}
                  {vneidTab === 'qr' && (
                    <div className="flex flex-col items-center space-y-4 py-1">
                      <div className="relative p-3 bg-white rounded-2xl shadow-xl border border-slate-200">
                        {/* High-tech overlay Scanning lines */}
                        <div className="absolute inset-x-3 h-0.5 bg-red-600 animate-scanner top-1/2 shadow-lg" />
                        
                        {/* QR Code mockup */}
                        <div className="w-44 h-44 bg-slate-100 flex items-center justify-center rounded-xl p-2">
                          <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                            <path d="M5 5h30v30H5V5zm4 4v22h22V9H9z" />
                            <path d="M5 65h30v30H5V65zm4 4v22h22V69H9z" />
                            <path d="M65 5h30v30H65V5zm4 4v22h22V9H69z" />
                            <rect x="15" y="15" width="10" height="10" />
                            <rect x="75" y="15" width="10" height="10" />
                            <rect x="15" y="75" width="10" height="10" />
                            <rect x="45" y="15" width="8" height="8" />
                            <rect x="45" y="35" width="12" height="12" />
                            <rect x="35" y="55" width="10" height="10" />
                            <rect x="55" y="65" width="15" height="15" />
                            <rect x="75" y="75" width="12" height="12" />
                            <rect x="45" y="75" width="8" height="12" />
                            <rect x="75" y="45" width="10" height="8" />
                          </svg>
                        </div>
                      </div>

                      <div className="text-center space-y-1">
                        <p className="text-xs text-slate-300 font-medium">
                          Mở ứng dụng <span className="text-amber-400 font-bold">VNeID</span> trên điện thoại và thực hiện quét mã QR này
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Mã QR hết hạn sau: <span className="text-red-400 font-bold">{vneidCountdown} giây</span>
                        </p>
                      </div>

                      {/* Simulator Trigger Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!vneidTargetUser) return;
                          setIsVneidAuthenticating(true);
                          
                          const targetCccd = vneidTargetUser.cccd || '';
                          const targetVneidPass = vneidTargetUser.vneidPassword || '';

                          if (!targetCccd || !targetVneidPass) {
                            alert(`Cán bộ ${vneidTargetUser.name} chưa cập nhật mã Định danh CCCD và Mật khẩu VNeID trên hệ thống. Vui lòng cập nhật thông tin trong mục Quản lý tài khoản cán bộ của Quản trị viên, hoặc đăng ký mới với đầy đủ CCCD.`);
                            setIsVneidAuthenticating(false);
                            return;
                          }

                          setTimeout(() => {
                            fetch('/api/auth/vneid-login', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ cccd: targetCccd, vneidPassword: targetVneidPass })
                            })
                            .then(async res => {
                              const data = await res.json();
                              setIsVneidAuthenticating(false);
                              if (res.ok && data.success && data.token) {
                                localStorage.setItem('ward_auth_token', data.token);
                                localStorage.setItem('ward_current_user', JSON.stringify(data.user));
                                setVneidSuccess(true);
                                setTimeout(() => {
                                  setShowVneidModal(false);
                                  onLogin(data.user);
                                  // Reset modal status
                                  setVneidSuccess(false);
                                }, 1500);
                              } else {
                                alert(data.error || "Không thể liên thông tài khoản lúc này qua VNeID API.");
                              }
                            })
                            .catch(err => {
                              console.error(err);
                              setIsVneidAuthenticating(false);
                              alert("Lỗi kết nối API liên thông VNeID.");
                            });
                          }, 1200);
                        }}
                        disabled={isVneidAuthenticating}
                        className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 active:scale-95 mx-auto"
                      >
                        {isVneidAuthenticating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                            <span>Đang kiểm tra dịch vụ công...</span>
                          </>
                        ) : (
                          <>
                            <QrCode className="w-4 h-4" />
                            <span>Giả lập quét QR thành công trên SmartPhone</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* TAB CONTENT: CCCD Form Login */}
                  {vneidTab === 'form' && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!vneidCccd || !vneidPassword) return;
                        if (vneidCccd.length !== 12 || !/^\d+$/.test(vneidCccd)) {
                          alert("Số định danh cá nhân (CCCD) phải bao gồm đúng 12 chữ số.");
                          return;
                        }

                        setIsVneidAuthenticating(true);
                        setTimeout(() => {
                          fetch('/api/auth/vneid-login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cccd: vneidCccd, vneidPassword: vneidPassword })
                          })
                          .then(async res => {
                            const data = await res.json();
                            setIsVneidAuthenticating(false);
                            if (res.ok && data.success && data.token) {
                              setVneidTargetUser(data.user);
                              localStorage.setItem('ward_auth_token', data.token);
                              localStorage.setItem('ward_current_user', JSON.stringify(data.user));
                              setVneidSuccess(true);
                              setTimeout(() => {
                                setShowVneidModal(false);
                                onLogin(data.user);
                                setVneidSuccess(false);
                              }, 1500);
                            } else {
                              alert(data.error || "Mã định danh hoặc mật khẩu VNeID không khớp với dữ liệu hệ thống.");
                            }
                          })
                          .catch(err => {
                            console.error(err);
                            setIsVneidAuthenticating(false);
                            alert("Lỗi kết nối liên thông cổng quốc gia VNeID.");
                          });
                        }, 1200);
                      }}
                      className="space-y-4 text-left"
                    >
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Số định danh cá nhân (12 chữ số CCCD)</label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
                            <input
                              type="text"
                              maxLength={12}
                              value={vneidCccd}
                              onChange={(e) => setVneidCccd(e.target.value.replace(/\D/g, ''))}
                              placeholder="079xxxxxxxxxx"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-red-500 focus:border-transparent font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Mật khẩu VNeID</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
                            <input
                              type="password"
                              value={vneidPassword}
                              onChange={(e) => setVneidPassword(e.target.value)}
                              placeholder="Mật khẩu bảo mật định danh"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-red-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isVneidAuthenticating}
                        className="w-full bg-red-700 hover:bg-red-650 disabled:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl cursor-pointer transition flex items-center justify-center gap-2 shadow hover:shadow-red-900/40"
                      >
                        {isVneidAuthenticating ? (
                          <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Đăng nhập hệ thống bằng CCCD Định danh</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              ) : (
                /* SUCCESS SCREEN */
                <div className="py-8 flex flex-col items-center space-y-4 animate-scaleUp">
                  <div className="w-16 h-16 bg-emerald-500/15 border-2 border-emerald-500 text-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-10 h-10 animate-pulse" />
                  </div>
                  
                  <div className="text-center space-y-1.5">
                    <h5 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                      Xác thực định danh & Sinh trắc thành công!
                    </h5>
                    <p className="text-xs text-slate-400">
                      Đã khớp hồ sơ Công dân {vneidTargetUser?.name || 'Cán bộ'} từ CSDL quốc gia.
                    </p>
                    <p className="text-[11px] text-emerald-400 font-bold font-mono">
                      Liên thông thành công: {vneidTargetUser?.role === 'admin' ? 'Quản Trị Viên' : 'Cán Bộ Y Tế'}
                    </p>
                  </div>
                  
                  <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 block font-mono">KÝ SỐ THÔNG ĐIỆP</span>
                      <span className="text-[10.5px] font-mono font-bold text-slate-300">VNEID_JWT_AUTH_OK</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal controls/footer */}
              <div className="pt-3 border-t border-slate-850 flex justify-between items-center text-slate-550 text-[9.5px]">
                <span className="flex items-center gap-1 font-mono text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-amber-500" /> XÁC THỰC BẢO MẬT SSL 256-BIT • C06
                </span>
                <button
                  type="button"
                  onClick={() => setShowVneidModal(false)}
                  className="bg-slate-950 hover:bg-slate-850 hover:text-white text-slate-400 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition border border-slate-800 text-[10px]"
                >
                  Hủy bỏ / Đóng
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
