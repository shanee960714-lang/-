import React from 'react';
import {
  Refrigerator,
  Camera,
  BookOpen,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  Sliders,
  ChefHat,
} from 'lucide-react';
import { Ingredient, Recipe, UserPreferences } from '../types';

interface HomeViewProps {
  ingredients: Ingredient[];
  recipes: Recipe[];
  preferences: UserPreferences;
  onNavigate: (tab: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onQuickFilter: (filterKey: string, value: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  ingredients,
  recipes,
  preferences,
  onNavigate,
  onSelectRecipe,
  onQuickFilter,
}) => {
  // Compute expiring items (within 3 days from now, today is 2026-10-18)
  const expiringItems = ingredients.filter((i) => {
    if (!i.expiryDate) return false;
    const diff = (new Date(i.expiryDate).getTime() - new Date('2026-10-18').getTime()) / (1000 * 3600 * 24);
    return diff <= 4 && diff >= 0;
  });

  const categoriesCount = new Set(ingredients.map((i) => i.category)).size;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#2F6B4F] bg-[#2F6B4F]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            智慧廚房料理中心
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20352B] tracking-tight mt-1.5">
            今天想煮什麼？
          </h1>
          <p className="text-sm text-[#68776D] mt-0.5">
            依據您冰箱的 {ingredients.length} 項食材與可用廚具，為您推薦即刻能開煮的料理。
          </p>
        </div>

        <button
          onClick={() => onNavigate('scan')}
          className="flex items-center gap-2 bg-[#2F6B4F] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#2F6B4F]/90 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>拍照盤點冰箱</span>
        </button>
      </div>

      {/* Inventory Summary Banner & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Inventory Overview */}
        <div
          onClick={() => onNavigate('fridge')}
          className="bg-white rounded-2xl p-5 border border-[#E3E8E0] shadow-xs hover:border-[#A9C6AE] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[#2F6B4F]">
              <Refrigerator className="w-5 h-5" />
              <span className="font-bold text-sm text-[#20352B]">目前冷藏庫存</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#68776D] group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#20352B]">{ingredients.length}</span>
            <span className="text-xs text-[#68776D]">項食材 (涵蓋 {categoriesCount} 大類)</span>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#68776D]">
            <CheckCircle className="w-3.5 h-3.5 text-[#26734D]" />
            <span>所有項目已完成入庫校驗</span>
          </div>
        </div>

        {/* Card 2: Expiring Soon Alert */}
        <div
          onClick={() => onNavigate('fridge')}
          className={`rounded-2xl p-5 border shadow-xs transition-all cursor-pointer group flex flex-col justify-between ${
            expiringItems.length > 0
              ? 'bg-[#B7791F]/5 border-[#B7791F]/30 hover:border-[#B7791F]'
              : 'bg-white border-[#E3E8E0]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#B7791F]">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold text-sm text-[#20352B]">即將到期食材</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#B7791F]/15 text-[#B7791F]">
              優先使用
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#B7791F]">
              {expiringItems.length}
            </span>
            <span className="text-xs text-[#68776D]">項即將在 3 天內到期</span>
          </div>

          <div className="mt-3 text-xs text-[#68776D] truncate">
            {expiringItems.length > 0
              ? expiringItems.map((i) => i.name).join('、')
              : '目前食材皆在安全保鮮期內'}
          </div>
        </div>

        {/* Card 3: Kitchen Equipment & Preferences */}
        <div
          onClick={() => onNavigate('settings')}
          className="bg-white rounded-2xl p-5 border border-[#E3E8E0] shadow-xs hover:border-[#2F6B4F] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#2F6B4F]">
              <Sliders className="w-5 h-5" />
              <span className="font-bold text-sm text-[#20352B]">設備與飲食偏好</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#68776D] group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="mt-3">
            <span className="text-xs font-semibold text-[#20352B] block">
              可用設備：{preferences.equipment.join('、')}
            </span>
            <span className="text-xs text-[#68776D] block mt-1">
              風格：{preferences.dietStyle} · 最長 {preferences.maxCookingMinutes >= 999 ? '不限' : `${preferences.maxCookingMinutes} 分鐘`}
            </span>
          </div>

          <span className="mt-3 text-xs font-bold text-[#2F6B4F] flex items-center gap-1 group-hover:underline">
            <span>調整個人偏好設定</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Quick Condition Chips Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E3E8E0] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#20352B] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#2F6B4F]" />
            <span>快速套用熱門條件</span>
          </span>
          <button
            onClick={() => onNavigate('recipes')}
            className="text-xs text-[#2F6B4F] font-bold hover:underline cursor-pointer"
          >
            完整條件設定 →
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onQuickFilter('maxCookingMinutes', 15)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F7F6F0] hover:bg-[#2F6B4F] hover:text-white text-[#20352B] transition-colors cursor-pointer border border-[#E3E8E0]"
          >
            ⚡ 15 分鐘快手菜
          </button>
          <button
            onClick={() => onQuickFilter('equipment', ['電鍋'])}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F7F6F0] hover:bg-[#2F6B4F] hover:text-white text-[#20352B] transition-colors cursor-pointer border border-[#E3E8E0]"
          >
            🍲 只用電鍋蒸煮
          </button>
          <button
            onClick={() => onQuickFilter('dietStyle', '高蛋白增肌')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F7F6F0] hover:bg-[#2F6B4F] hover:text-white text-[#20352B] transition-colors cursor-pointer border border-[#E3E8E0]"
          >
            💪 高蛋白增肌
          </button>
          <button
            onClick={() => onQuickFilter('equipment', ['不用開火'])}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F7F6F0] hover:bg-[#2F6B4F] hover:text-white text-[#20352B] transition-colors cursor-pointer border border-[#E3E8E0]"
          >
            🥗 不用開火 / 涼拌
          </button>
          <button
            onClick={() => onQuickFilter('dietStyle', '全素')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F7F6F0] hover:bg-[#2F6B4F] hover:text-white text-[#20352B] transition-colors cursor-pointer border border-[#E3E8E0]"
          >
            🌿 純植全素料理
          </button>
        </div>
      </div>

      {/* Recommended Recipes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#20352B]">今日精選推薦食譜</h2>
            <p className="text-xs text-[#68776D]">
              設備已嚴格限定在您的可用廚具：{preferences.equipment.join('、')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('recipes')}
            className="text-xs font-bold text-[#2F6B4F] hover:underline cursor-pointer"
          >
            換一批 / 查看更多
          </button>
        </div>

        {recipes.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-[#E3E8E0] text-center shadow-xs">
            <ChefHat className="w-10 h-10 text-[#A9C6AE] mx-auto mb-3" />
            <p className="font-bold text-[#20352B]">尚未生成專屬食譜</p>
            <p className="text-xs text-[#68776D] mt-1 mb-4">
              前往「找食譜」或點擊下方按鈕，AI 將即刻為您的庫存調配最佳料理。
            </p>
            <button
              onClick={() => onNavigate('recipes')}
              className="bg-[#2F6B4F] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#2F6B4F]/90 transition-colors shadow-xs cursor-pointer"
            >
              立刻生成推薦食譜
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                className="bg-white rounded-2xl border border-[#E3E8E0] hover:border-[#2F6B4F] p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#68776D] mb-2">
                    <span className="flex items-center gap-1 font-semibold text-[#20352B]">
                      <Clock className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>{recipe.totalMinutes} 分鐘</span>
                    </span>
                    <span className="bg-[#F7F6F0] px-2 py-0.5 rounded text-[11px] font-medium">
                      {recipe.equipment.join(' · ')}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-[#20352B] group-hover:text-[#2F6B4F] transition-colors">
                    {recipe.name}
                  </h3>

                  <p className="text-xs text-[#68776D] mt-1.5 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>

                  {/* Missing items badge */}
                  {recipe.missingIngredients && recipe.missingIngredients.length > 0 ? (
                    <div className="mt-3 text-[11px] text-[#B7791F] bg-[#B7791F]/10 px-2 py-1 rounded-lg">
                      還需自備：{recipe.missingIngredients.join('、')}
                    </div>
                  ) : (
                    <div className="mt-3 text-[11px] text-[#26734D] bg-[#26734D]/10 px-2 py-1 rounded-lg font-medium">
                      ✓ 現有食材全數齊全！
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[#E3E8E0] flex items-center justify-between">
                  <span className="text-xs text-[#68776D] font-medium">
                    {recipe.ingredients.length} 項食材 · {recipe.steps.length} 步驟
                  </span>
                  <span className="text-xs font-bold text-[#2F6B4F] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    <span>查看做法</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Ingredients List */}
      <div className="bg-white rounded-2xl p-5 border border-[#E3E8E0] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Refrigerator className="w-4 h-4 text-[#2F6B4F]" />
            <h2 className="text-sm font-bold text-[#20352B]">冰箱最新食材</h2>
          </div>
          <button
            onClick={() => onNavigate('fridge')}
            className="text-xs text-[#2F6B4F] font-bold hover:underline cursor-pointer"
          >
            管理完整冰箱 →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {ingredients.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-[#F7F6F0] border border-[#E3E8E0] text-center"
            >
              <span className="text-xs font-bold text-[#20352B] block truncate">
                {item.name}
              </span>
              <span className="text-[11px] text-[#68776D] mt-0.5 block">
                {item.quantity} {item.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
