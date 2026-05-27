import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, AlertTriangle, ShieldCheck, HeartPulse, 
  Bot, Clock, ListFilter, Activity, Star, LogOut, MessageSquare
} from 'lucide-react';
import { Household, HouseholdMember, WardInfo, EpidemiologicalAlert } from './types';
import { initialHouseholds, initialWardInfo, initialAlerts } from './initialData';
import WardOverview from './components/WardOverview';
import HouseholdDirectory from './components/HouseholdDirectory';
import HouseholdDetail from './components/HouseholdDetail';
import AIAssistant from './components/AIAssistant';
import LoginScreen from './components/LoginScreen';
import HouseholdMessaging from './components/HouseholdMessaging';

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: 'officer' | 'admin' } | null>(() => {
    const saved = localStorage.getItem('ward_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('ward_is_guest') === 'true';
  });

  // Navigation Tabs: 'overview' | 'directory' | 'detail' | 'messaging' | 'ai'
  const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'detail' | 'messaging' | 'ai'>('overview');

  // Core App State persisted in LocalStorage
  const [households, setHouseholds] = useState<Household[]>([]);
  const [wardInfo, setWardInfo] = useState<WardInfo>(initialWardInfo);
  const [alerts, setAlerts] = useState<EpidemiologicalAlert[]>([]);

  // Selected Household for viewing details
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);

  // Selected patient passed directly to AI Consultant
  const [presetAIMember, setPresetAIMember] = useState<HouseholdMember | null>(null);

  // Auth Operations
  const handleLogin = (user: { name: string; email: string; role: 'officer' | 'admin' }) => {
    setCurrentUser(user);
    setIsGuest(false);
    localStorage.setItem('ward_current_user', JSON.stringify(user));
    localStorage.setItem('ward_is_guest', 'false');
  };

  const handleEnterAsGuest = () => {
    setCurrentUser(null);
    setIsGuest(true);
    setActiveTab('overview');
    localStorage.setItem('ward_is_guest', 'true');
    localStorage.removeItem('ward_current_user');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsGuest(false);
    setActiveTab('overview');
    localStorage.removeItem('ward_current_user');
    localStorage.removeItem('ward_is_guest');
    localStorage.removeItem('ward_auth_token');
  };

  // Load state on mount with server-side synchronization
  useEffect(() => {
    // 1. Instantly load from localStorage for high-speed offline experience
    const storedHouseholds = localStorage.getItem('ward_households');
    const storedWardInfo = localStorage.getItem('ward_info');
    const storedAlerts = localStorage.getItem('ward_alerts');

    if (storedHouseholds) {
      try { setHouseholds(JSON.parse(storedHouseholds)); } catch (e) {}
    } else {
      setHouseholds(initialHouseholds);
    }

    if (storedWardInfo) {
      try {
        const parsed = JSON.parse(storedWardInfo);
        const nameContainsBenNghe = parsed.name && (parsed.name.includes("Bến Nghé") || parsed.name === "Phường Bến Nghé");
        const addressContainsBenNghe = parsed.healthCenterAddress && (parsed.healthCenterAddress.includes("Bến Nghé") || parsed.healthCenterAddress.includes("Hông Đàng") || parsed.healthCenterAddress.includes("Quận 1"));
        if (nameContainsBenNghe || addressContainsBenNghe) {
          setWardInfo(initialWardInfo);
          localStorage.setItem('ward_info', JSON.stringify(initialWardInfo));
        } else {
          setWardInfo(parsed);
        }
      } catch (e) {
        setWardInfo(initialWardInfo);
      }
    } else {
      setWardInfo(initialWardInfo);
    }

    if (storedAlerts) {
      try { setAlerts(JSON.parse(storedAlerts)); } catch (e) {}
    } else {
      setAlerts(initialAlerts);
    }

    // 2. Fetch fresh real-time data from server for multi-device sync
    const fetchData = async () => {
      try {
        const [householdsRes, wardRes, alertsRes] = await Promise.all([
          fetch('/api/households'),
          fetch('/api/ward-info'),
          fetch('/api/alerts')
        ]);

        if (householdsRes.ok) {
          const hhData = await householdsRes.json();
          setHouseholds(hhData);
          localStorage.setItem('ward_households', JSON.stringify(hhData));
        }
        if (wardRes.ok) {
          const wardData = await wardRes.json();
          const nameContainsBenNghe = wardData.name && (wardData.name.includes("Bến Nghé") || wardData.name === "Phường Bến Nghé");
          const addressContainsBenNghe = wardData.healthCenterAddress && (wardData.healthCenterAddress.includes("Bến Nghé") || wardData.healthCenterAddress.includes("Hông Đàng") || wardData.healthCenterAddress.includes("Quận 1"));
          
          if (nameContainsBenNghe || addressContainsBenNghe) {
            setWardInfo(initialWardInfo);
            localStorage.setItem('ward_info', JSON.stringify(initialWardInfo));
            const token = localStorage.getItem('ward_auth_token');
            await fetch('/api/ward-info', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(initialWardInfo)
            });
          } else {
            setWardInfo(wardData);
            localStorage.setItem('ward_info', JSON.stringify(wardData));
          }
        }
        if (alertsRes.ok) {
          const alData = await alertsRes.json();
          setAlerts(alData);
          localStorage.setItem('ward_alerts', JSON.stringify(alData));
        }
      } catch (err) {
        console.warn("Could not sync with server, using local fallback:", err);
      }
    };

    fetchData();
  }, []);

  // Save state helpers with immediate server sync
  const saveHouseholds = async (data: Household[]) => {
    setHouseholds(data);
    localStorage.setItem('ward_households', JSON.stringify(data));
    try {
      const token = localStorage.getItem('ward_auth_token');
      await fetch('/api/households', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error("Failed to sync households to server:", err);
    }
  };

  const saveWardInfo = async (data: WardInfo) => {
    setWardInfo(data);
    localStorage.setItem('ward_info', JSON.stringify(data));
    try {
      const token = localStorage.getItem('ward_auth_token');
      await fetch('/api/ward-info', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error("Failed to sync ward info to server:", err);
    }
  };

  const saveAlerts = async (data: EpidemiologicalAlert[]) => {
    setAlerts(data);
    localStorage.setItem('ward_alerts', JSON.stringify(data));
    try {
      const token = localStorage.getItem('ward_auth_token');
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error("Failed to sync alerts to server:", err);
    }
  };

  // State handlers
  const handleUpdateWardInfo = (updated: WardInfo) => {
    saveWardInfo(updated);
  };

  const handleResetWardInfo = () => {
    saveWardInfo(initialWardInfo);
  };

  const handleAddAlert = (alert: EpidemiologicalAlert) => {
    const updated = [alert, ...alerts];
    saveAlerts(updated);
  };

  const handleToggleAlertStatus = (id: string) => {
    const updated = alerts.map(a => a.id === id ? { ...a, active: !a.active } : a);
    saveAlerts(updated);
  };

  const handleAddHousehold = (newH: Household) => {
    const updated = [newH, ...households];
    saveHouseholds(updated);
  };

  const handleDeleteHousehold = (id: string) => {
    if (confirm("Bạn thật sự muốn xóa sổ hộ khẩu y tế này cùng toàn bộ nhân khẩu bên trong?")) {
      const updated = households.filter(h => h.id !== id);
      saveHouseholds(updated);
      if (selectedHouseholdId === id) setSelectedHouseholdId(null);
    }
  };

  const handleAddMember = (householdId: string, member: HouseholdMember) => {
    const updated = households.map(h => {
      if (h.id === householdId) {
        return {
          ...h,
          members: [...h.members, member]
        };
      }
      return h;
    });
    saveHouseholds(updated);
  };

  const handleUpdateMember = (householdId: string, memberId: string, updatedM: HouseholdMember) => {
    const updated = households.map(h => {
      if (h.id === householdId) {
        return {
          ...h,
          members: h.members.map(m => m.id === memberId ? updatedM : m)
        };
      }
      return h;
    });
    saveHouseholds(updated);
  };

  const handleDeleteMember = (householdId: string, memberId: string) => {
    const updated = households.map(h => {
      if (h.id === householdId) {
        return {
          ...h,
          members: h.members.filter(m => m.id !== memberId)
        };
      }
      return h;
    });
    saveHouseholds(updated);
  };

  const handleAskAIAboutMember = (member: HouseholdMember) => {
    setPresetAIMember(member);
    setActiveTab('ai');
  };

  // Switch to specific household details view
  const handleSelectHousehold = (id: string) => {
    setSelectedHouseholdId(id);
    setActiveTab('detail');
  };

  const activeHousehold = households.find(h => h.id === selectedHouseholdId);

  // Smooth scroll handler to targeted active epidemiological alerts panel
  const handleScrollToAlerts = () => {
    setActiveTab('overview');
    setTimeout(() => {
      const el = document.getElementById('epidemiological-alerts-panel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Set hash to trigger CSS target: styling transitions
        window.location.hash = 'epidemiological-alerts-panel';
        // Clear hash after a second to allow re-targeting
        setTimeout(() => {
          window.location.hash = '';
        }, 1200);
      }
    }, 120);
  };

  // Time stamp state ticker
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const live = new Date();
      setCurrentTime(live.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentUser && !isGuest) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        onEnterAsGuest={handleEnterAsGuest} 
      />
    );
  }

  return (
    <div id="root-layout" className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Dynamic Header Navbar Bar */}
      <header id="main-header" className="bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-lg shadow ring-1 ring-white/10">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div id="brand-title" className="text-sm font-bold tracking-widest text-teal-400 font-display flex items-center gap-1.5 uppercase">
                GIA ĐÌNH KHỎE <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.2 rounded">Ward Version</span>
              </div>
              <h1 className="text-base font-bold font-display text-white mt-0.5">
                Quản lý Sức khỏe Hộ Gia đình {wardInfo.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Clock Indicators */}
            <div className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700 font-mono">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              {currentTime || 'Loading...'}
            </div>

            {/* Interactive Ward Alerts action shortcut button */}
            <button
              onClick={handleScrollToAlerts}
              className="bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer hover:border-red-550/50 hover:text-red-300 transition duration-150"
              title="Nhấp để chuyển nhanh đến phân mục Quản lý ổ dịch giám sát"
            >
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-red-400" />
              <span className="font-semibold">{alerts.filter(a => a.active).length} Ổ dịch giám sát</span>
            </button>

            {/* Officer Profile Badge */}
            {currentUser ? (
              <div id="officer-badge" className="bg-slate-800 text-slate-200 pl-3 pr-1.5 py-1 rounded-lg flex items-center gap-2.5 border border-slate-705 animate-fadeIn">
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[11px] text-teal-400 leading-tight tracking-wide">{currentUser.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono leading-none">{currentUser.role === 'admin' ? 'Hệ thống Admin' : 'Cán bộ Y tế'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-slate-700 hover:text-red-400 text-slate-400 rounded-md cursor-pointer transition border-0 flex items-center justify-center shrink-0"
                  title="Đăng xuất tài khoản công vụ"
                >
                  <LogOut className="w-4 h-4 text-slate-40s" />
                </button>
              </div>
            ) : (
              <div id="guest-badge" className="bg-amber-500/10 text-amber-300 pl-3 pr-1 py-1 rounded-lg flex items-center gap-2 border border-amber-500/20 animate-fadeIn">
                <span className="font-semibold text-[10.5px] uppercase tracking-wide">Tra cứu (Khách)</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-amber-505 hover:bg-amber-500 active:scale-95 text-slate-950 font-extrabold px-2 py-0.5 rounded-md text-[10px] cursor-pointer transition border-0"
                  title="Đăng nhập tài khoản cán bộ"
                >
                  ĐĂNG NHẬP
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Control strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-t border-slate-800/80 scroll-px-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-5 text-xs font-semibold tracking-wider uppercase border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-teal-500 text-teal-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" /> Bản Quản lý Dịch tễ
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`py-3 px-5 text-xs font-semibold tracking-wider uppercase border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'directory'
                  ? 'border-teal-500 text-teal-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              <ListFilter className="w-4 h-4 shrink-0" /> Sổ Hộ Khẩu Sức Khỏe
            </button>

            {activeHousehold && (
              <button
                onClick={() => setActiveTab('detail')}
                className={`py-3 px-5 text-xs font-semibold tracking-wider uppercase border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'detail'
                    ? 'border-teal-500 text-teal-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/20'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" /> Chi Tiết: {activeHousehold.headName}
              </button>
            )}

            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'officer') && (
              <button
                onClick={() => setActiveTab('messaging')}
                 className={`py-3 px-5 text-xs font-semibold tracking-wider uppercase border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'messaging'
                    ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/20'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" /> Gửi Tin Nhắn Phường
              </button>
            )}

            <button
              onClick={() => setActiveTab('ai')}
              className={`py-3 px-5 text-xs font-semibold tracking-wider uppercase border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'ai'
                  ? 'border-teal-500 text-teal-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              <Bot className="w-4 h-4 text-teal-400 shrink-0 fill-teal-400/15" /> Bác sĩ AI Phường
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Render Active View Tab */}
        {activeTab === 'overview' && (
          <WardOverview 
            wardInfo={wardInfo}
            onUpdateWardInfo={handleUpdateWardInfo}
            onResetWardInfo={handleResetWardInfo}
            households={households}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onToggleAlertStatus={handleToggleAlertStatus}
            user={currentUser}
          />
        )}

        {activeTab === 'directory' && (
          <HouseholdDirectory 
            households={households}
            onSelectHousehold={handleSelectHousehold}
            onAddHousehold={handleAddHousehold}
            onDeleteHousehold={handleDeleteHousehold}
            user={currentUser}
          />
        )}

        {activeTab === 'detail' && activeHousehold && (
          <HouseholdDetail 
            household={activeHousehold}
            onBack={() => setActiveTab('directory')}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onAskAIAboutMember={handleAskAIAboutMember}
            user={currentUser}
          />
        )}

        {activeTab === 'messaging' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'officer') && (
          <HouseholdMessaging 
            households={households}
            user={currentUser}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistant 
            households={households}
            wardInfo={wardInfo}
            alerts={alerts}
            presetSelectedMember={presetAIMember}
            onClearPresetMember={() => setPresetAIMember(null)}
            user={currentUser}
          />
        )}

      </main>

      {/* Corporate Professional Footer */}
      <footer className="bg-white border-t border-slate-100 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-400">
          <p>© 2026 HealthHouseholds Inc. Dự án ươm mầm khởi nghiệp Công nghệ Y tế Cơ sở Phường/Xã.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 transition cursor-default flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Bản thử nghiệm y tế thông minh
            </span>
            <span className="hover:text-slate-600 transition cursor-help">Bộ Y Tế Đồng Hành</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
