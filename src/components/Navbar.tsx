import React from 'react';
import {
  Refrigerator,
  Camera,
  BookOpen,
  Sliders,
  ChefHat,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  inventoryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  inventoryCount,
}) => {
  const navItems = [
    { id: 'home', label: '首頁', icon: ChefHat },
    { id: 'scan', label: '拍照盤點', icon: Camera, badge: '辨識' },
    { id: 'fridge', label: '我的冰箱', icon: Refrigerator, count: inventoryCount },
    { id: 'recipes', label: '找食譜', icon: BookOpen },
    { id: 'settings', label: '個人偏好', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E3E8E0] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-[#2F6B4F] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Refrigerator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#20352B] tracking-tight">
                鮮食智配
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E9A23B]/15 text-[#E9A23B] font-medium border border-[#E9A23B]/30">
                智慧生鮮
              </span>
            </div>
            <p className="text-[11px] text-[#68776D] hidden sm:block">
              智慧冰箱盤點 · 智能食材辨識 · 客製食譜推薦
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all relative cursor-pointer ${
                  isActive
                    ? 'bg-[#2F6B4F] text-white shadow-xs'
                    : 'text-[#68776D] hover:text-[#20352B] hover:bg-[#F7F6F0]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#68776D]'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-[#E3E8E0] text-[#20352B]'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className="text-[10px] px-1 rounded bg-[#E9A23B] text-white font-bold leading-none py-0.5">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E3E8E0] px-2 py-1.5 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer relative ${
                isActive ? 'text-[#2F6B4F] font-bold' : 'text-[#68776D]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#2F6B4F]' : 'text-[#68776D]'}`} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 text-[9px] min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#2F6B4F] text-white flex items-center justify-center">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
