import React, { useState } from 'react';
import { Sliders, CheckCircle, Plus, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { UserPreferences } from '../types';

interface PreferencesViewProps {
  preferences: UserPreferences;
  onSavePreferences: (updated: UserPreferences) => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({
  preferences,
  onSavePreferences,
}) => {
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);
  const [customAllergen, setCustomAllergen] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const availableEquipment = ['電鍋', '氣炸鍋', '微波爐', '單口瓦斯爐', '不用開火'];
  const availableDiets = ['一般均衡', '高蛋白增肌', '低醣／生酮', '全素'];
  const commonExclusions = ['不吃海鮮', '不吃牛肉', '不吃芹菜', '不吃香菜', '不吃洋蔥', '乳糖不耐', '麩質過敏'];

  const toggleEquipment = (eq: string) => {
    const list = localPrefs.equipment.includes(eq)
      ? localPrefs.equipment.filter((e) => e !== eq)
      : [...localPrefs.equipment, eq];
    setLocalPrefs({ ...localPrefs, equipment: list });
  };

  const toggleExclusion = (item: string) => {
    const list = localPrefs.excludedIngredients.includes(item)
      ? localPrefs.excludedIngredients.filter((e) => e !== item)
      : [...localPrefs.excludedIngredients, item];
    setLocalPrefs({ ...localPrefs, excludedIngredients: list });
  };

  const addCustomExclusion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAllergen.trim()) return;
    if (!localPrefs.excludedIngredients.includes(customAllergen.trim())) {
      setLocalPrefs({
        ...localPrefs,
        excludedIngredients: [...localPrefs.excludedIngredients, customAllergen.trim()],
      });
    }
    setCustomAllergen('');
  };

  const handleSave = () => {
    onSavePreferences(localPrefs);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20352B] tracking-tight">
            個人偏好設定
          </h1>
          <p className="text-sm text-[#68776D] mt-0.5">
            設定您的廚房設備與飲食限制，每次推薦食譜時均嚴格遵守。
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-[#2F6B4F] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#2F6B4F]/90 transition-all shadow-xs cursor-pointer"
        >
          儲存偏好
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-[#26734D]/10 border border-[#26734D] text-[#26734D] px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <CheckCircle className="w-5 h-5 text-[#26734D]" />
          <span>偏好設定已成功更新！後續食譜推薦將立即套用此設定。</span>
        </div>
      )}

      {/* Equipment Box */}
      <div className="bg-white rounded-2xl p-6 border border-[#E3E8E0] shadow-xs space-y-3">
        <label className="text-sm font-bold text-[#20352B] block">
          常用可用廚具設備（多選）
        </label>
        <p className="text-xs text-[#68776D]">
          此為硬限制：未勾選的設備，食譜中絕不會要求使用。
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {availableEquipment.map((eq) => {
            const isChecked = localPrefs.equipment.includes(eq);
            return (
              <button
                key={eq}
                onClick={() => toggleEquipment(eq)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-[#2F6B4F] text-white border-[#2F6B4F] shadow-xs'
                    : 'bg-[#F7F6F0] text-[#68776D] border-[#E3E8E0] hover:text-[#20352B]'
                }`}
              >
                {isChecked ? '✓ ' : ''}{eq}
              </button>
            );
          })}
        </div>
      </div>

      {/* Diet Style Box */}
      <div className="bg-white rounded-2xl p-6 border border-[#E3E8E0] shadow-xs space-y-3">
        <label className="text-sm font-bold text-[#20352B] block">
          主要飲食風格
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {availableDiets.map((diet) => (
            <button
              key={diet}
              onClick={() => setLocalPrefs({ ...localPrefs, dietStyle: diet })}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                localPrefs.dietStyle === diet
                  ? 'bg-[#20352B] text-white border-[#20352B] font-bold shadow-xs'
                  : 'bg-[#F7F6F0] text-[#68776D] border-[#E3E8E0] hover:text-[#20352B]'
              }`}
            >
              <span className="text-xs block">{diet}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Excluded Ingredients & Allergens Box */}
      <div className="bg-white rounded-2xl p-6 border border-[#E3E8E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2F6B4F]" />
          <label className="text-sm font-bold text-[#20352B]">
            忌口與排除食材 / 過敏原標籤
          </label>
        </div>
        <p className="text-xs text-[#68776D]">
          標記的食材將被視為絕對禁用項目，不會出現在任何推薦料理中。
        </p>

        {/* Preset common exclusions */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {commonExclusions.map((item) => {
            const isExcluded = localPrefs.excludedIngredients.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleExclusion(item)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isExcluded
                    ? 'bg-[#B54747] text-white border-[#B54747]'
                    : 'bg-[#F7F6F0] text-[#68776D] border-[#E3E8E0]'
                }`}
              >
                {isExcluded ? '✕ ' : ''}{item}
              </button>
            );
          })}
        </div>

        {/* Custom Input */}
        <form onSubmit={addCustomExclusion} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={customAllergen}
            onChange={(e) => setCustomAllergen(e.target.value)}
            placeholder="自訂排除項目（例如：香菇、花生、肉桂）"
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E3E8E0] bg-[#F7F6F0] focus:outline-hidden focus:border-[#2F6B4F]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#F7F6F0] hover:bg-[#E3E8E0] text-[#20352B] rounded-xl text-xs font-bold border border-[#E3E8E0] cursor-pointer"
          >
            新增標籤
          </button>
        </form>

        {/* Active excluded tags list */}
        {localPrefs.excludedIngredients.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5">
            {localPrefs.excludedIngredients.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#B54747]/10 text-[#B54747] border border-[#B54747]/30"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => toggleExclusion(tag)}
                  className="hover:opacity-70 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cooking Time & Mode Box */}
      <div className="bg-white rounded-2xl p-6 border border-[#E3E8E0] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#20352B] block mb-2">
              預設料理時間限制
            </label>
            <select
              value={localPrefs.maxCookingMinutes}
              onChange={(e) =>
                setLocalPrefs({
                  ...localPrefs,
                  maxCookingMinutes: parseInt(e.target.value, 10),
                })
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3E8E0] bg-[#F7F6F0] focus:outline-hidden focus:border-[#2F6B4F]"
            >
              <option value={15}>15 分鐘以內</option>
              <option value={30}>30 分鐘以內</option>
              <option value={45}>45 分鐘以內</option>
              <option value={999}>不限時間</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#20352B] block mb-2">
              食材使用策略
            </label>
            <select
              value={localPrefs.ingredientUsageMode}
              onChange={(e) =>
                setLocalPrefs({ ...localPrefs, ingredientUsageMode: e.target.value })
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3E8E0] bg-[#F7F6F0] focus:outline-hidden focus:border-[#2F6B4F]"
            >
              <option value="優先使用現有食材">優先使用現有食材 (可含基本油鹽)</option>
              <option value="只使用現有食材">只使用現有食材 (絕不外購)</option>
              <option value="優先使用快到期食材">優先使用快到期食材</option>
              <option value="可以使用少量額外食材">可推薦搭配少許常見副料</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
