import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Check,
  Undo2,
  X,
  MessageSquare,
} from 'lucide-react';
import { Ingredient, Recipe, UserPreferences } from '../types';

interface RecipeViewProps {
  ingredients: Ingredient[];
  recipes: Recipe[];
  preferences: UserPreferences;
  onUpdatePreferences: (newPref: UserPreferences) => void;
  onFetchRecipes: () => Promise<void>;
  onDeductInventory: (
    recipeName: string,
    usedItems: { ingredientId?: string; name: string; amount: number; unit: string }[]
  ) => void;
  onUndoDeduction: () => void;
  canUndoDeduction: boolean;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (r: Recipe | null) => void;
  isLoadingRecipes: boolean;
}

export const RecipeView: React.FC<RecipeViewProps> = ({
  ingredients,
  recipes,
  preferences,
  onUpdatePreferences,
  onFetchRecipes,
  onDeductInventory,
  onUndoDeduction,
  canUndoDeduction,
  selectedRecipe,
  setSelectedRecipe,
  isLoadingRecipes,
}) => {
  // Filter panel state
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Dynamic Tweak / 換一道 state (A09)
  const [tweakInput, setTweakInput] = useState('');
  const [isTweaking, setIsTweaking] = useState(false);
  const [tweakPreservedSummary, setTweakPreservedSummary] = useState<string | null>(null);

  // Cooking step completion tracking
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Cooking Complete & Inventory Deduction Modal (A10, A11)
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [deductInputs, setDeductInputs] = useState<
    { name: string; originalQty: number; usedAmount: number; unit: string; ingredientId?: string }[]
  >([]);
  const [deductionSuccessMessage, setDeductionSuccessMessage] = useState<string | null>(null);

  // Quick chips for tweaking
  const quickTweakChips = [
    '換一道不用開火的',
    '15 分鐘內完成',
    '不要高麗菜',
    '改用微波爐',
    '優先使用快到期食材',
    '少用一種食材',
  ];

  // Equipment options
  const allEquipment = ['電鍋', '氣炸鍋', '微波爐', '單口瓦斯爐', '不用開火'];
  const allDietStyles = ['一般均衡', '高蛋白增肌', '低醣／生酮', '全素'];
  const allTimeLimits = [
    { label: '15 分鐘內', value: 15 },
    { label: '30 分鐘內', value: 30 },
    { label: '45 分鐘內', value: 45 },
    { label: '不限時間', value: 999 },
  ];

  // Toggle equipment in preferences
  const handleToggleEquipment = (eq: string) => {
    const current = [...preferences.equipment];
    const updated = current.includes(eq)
      ? current.filter((item) => item !== eq)
      : [...current, eq];
    onUpdatePreferences({ ...preferences, equipment: updated });
  };

  // Trigger dynamic recipe tweaking via backend /api/tweak-recipe
  const handleTweakRecipe = async (instruction: string) => {
    if (!selectedRecipe || !instruction.trim()) return;
    setIsTweaking(true);

    try {
      const res = await fetch('/api/tweak-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRecipe: selectedRecipe,
          userInstruction: instruction,
          activeConstraints: {
            equipment: preferences.equipment,
            dietStyle: preferences.dietStyle,
            excludedIngredients: preferences.excludedIngredients,
            maxCookingMinutes: preferences.maxCookingMinutes,
          },
          ingredients,
        }),
      });

      if (!res.ok) throw new Error('動態換菜失敗');
      const data = await res.json();

      if (data.recipe) {
        setSelectedRecipe(data.recipe);
        setTweakPreservedSummary(data.preservedSummary || '已為您動態換菜並保留原有限制條件');
        setCompletedSteps({});
      }
    } catch (err) {
      console.error(err);
      alert('換菜失敗，請重試');
    } finally {
      setIsTweaking(false);
      setTweakInput('');
    }
  };

  // Open "我煮好了" confirmation modal (A10)
  const handleOpenDeductModal = () => {
    if (!selectedRecipe) return;

    const initialDeductions = selectedRecipe.ingredients.map((ing) => {
      // Find matching item in current fridge inventory
      const matched = ingredients.find(
        (i) => i.name.toLowerCase() === ing.name.toLowerCase()
      );
      return {
        name: ing.name,
        ingredientId: matched?.id,
        originalQty: matched ? matched.quantity : 0,
        usedAmount: ing.amount,
        unit: ing.unit,
      };
    });

    setDeductInputs(initialDeductions);
    setIsDeductModalOpen(true);
  };

  // Confirm inventory deduction (A10, A11)
  const handleConfirmDeduction = () => {
    if (!selectedRecipe) return;

    // Check for negative remaining
    for (const item of deductInputs) {
      if (item.ingredientId && item.usedAmount > item.originalQty) {
        alert(
          `食材「${item.name}」的扣除量 (${item.usedAmount}${item.unit}) 大於現有庫存 (${item.originalQty}${item.unit})，請確認實際用量！`
        );
        return;
      }
    }

    const usedList = deductInputs.map((item) => ({
      ingredientId: item.ingredientId,
      name: item.name,
      amount: item.usedAmount,
      unit: item.unit,
    }));

    onDeductInventory(selectedRecipe.name, usedList);
    setIsDeductModalOpen(false);
    setDeductionSuccessMessage(
      `🎉 太棒了！已記錄《${selectedRecipe.name}》完成，並成功更新 ${usedList.filter((i) => i.ingredientId).length} 項食材庫存！`
    );
    setTimeout(() => setDeductionSuccessMessage(null), 8000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20352B] tracking-tight">
            找食譜與配菜推薦
          </h1>
          <p className="text-sm text-[#68776D] mt-0.5">
            智慧依據現有庫存與設備篩選，保證無多餘外購壓力。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showFilterDrawer
                ? 'bg-[#2F6B4F] text-white border-[#2F6B4F]'
                : 'bg-white text-[#20352B] border-[#E3E8E0] hover:border-[#2F6B4F]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>條件篩選 ({preferences.equipment.length + (preferences.dietStyle ? 1 : 0)})</span>
          </button>

          <button
            onClick={onFetchRecipes}
            disabled={isLoadingRecipes}
            className="flex items-center gap-2 bg-[#2F6B4F] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#2F6B4F]/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecipes ? 'animate-spin' : ''}`} />
            <span>重新推薦食譜</span>
          </button>
        </div>
      </div>

      {/* Deduction Success & Undo Banner (A11) */}
      {deductionSuccessMessage && (
        <div className="bg-[#26734D]/10 border border-[#26734D] text-[#26734D] px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle className="w-5 h-5 text-[#26734D]" />
            <span>{deductionSuccessMessage}</span>
          </div>
          {canUndoDeduction && (
            <button
              onClick={onUndoDeduction}
              className="flex items-center gap-1 text-xs font-bold underline hover:opacity-80 cursor-pointer ml-3"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>復原此次庫存扣除</span>
            </button>
          )}
        </div>
      )}

      {/* Condition Filter Drawer (A06) */}
      {showFilterDrawer && (
        <div className="bg-white rounded-2xl p-5 border border-[#E3E8E0] shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#E3E8E0] pb-2">
            <h3 className="text-sm font-bold text-[#20352B]">客製化條件設定</h3>
            <span className="text-xs text-[#68776D]">條件為必要限制，系統絕不推薦未選設備</span>
          </div>

          {/* Section 1: Equipment */}
          <div>
            <label className="text-xs font-bold text-[#20352B] block mb-2">
              可用設備（可複選）
            </label>
            <div className="flex flex-wrap gap-2">
              {allEquipment.map((eq) => {
                const isChecked = preferences.equipment.includes(eq);
                return (
                  <button
                    key={eq}
                    onClick={() => handleToggleEquipment(eq)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
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

          {/* Section 2: Diet Style & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#20352B] block mb-2">
                飲食風格
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allDietStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => onUpdatePreferences({ ...preferences, dietStyle: style })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      preferences.dietStyle === style
                        ? 'bg-[#20352B] text-white border-[#20352B]'
                        : 'bg-[#F7F6F0] text-[#68776D] border-[#E3E8E0]'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#20352B] block mb-2">
                最長料理時間
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allTimeLimits.map((t) => (
                  <button
                    key={t.value}
                    onClick={() =>
                      onUpdatePreferences({ ...preferences, maxCookingMinutes: t.value })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      preferences.maxCookingMinutes === t.value
                        ? 'bg-[#E9A23B] text-white border-[#E9A23B]'
                        : 'bg-[#F7F6F0] text-[#68776D] border-[#E3E8E0]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                setShowFilterDrawer(false);
                onFetchRecipes();
              }}
              className="bg-[#2F6B4F] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer hover:bg-[#2F6B4F]/90"
            >
              套用條件並重新推薦食譜
            </button>
          </div>
        </div>
      )}

      {/* Applied Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[#68776D] font-semibold whitespace-nowrap">已套用條件:</span>
        {preferences.equipment.map((eq) => (
          <span
            key={eq}
            className="px-2.5 py-1 rounded-lg bg-[#2F6B4F]/10 text-[#2F6B4F] font-semibold whitespace-nowrap"
          >
            {eq}
          </span>
        ))}
        <span className="px-2.5 py-1 rounded-lg bg-[#20352B]/10 text-[#20352B] font-semibold whitespace-nowrap">
          {preferences.dietStyle}
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#E9A23B]/15 text-[#E9A23B] font-semibold whitespace-nowrap">
          {preferences.maxCookingMinutes >= 999 ? '不限時' : `${preferences.maxCookingMinutes} 分鐘內`}
        </span>
      </div>

      {/* Main Layout: Left Recipe Cards List, Right Recipe Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recipe Cards (A07) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#20352B]">
              為您找到的料理 ({recipes.length} 道)
            </h2>
            <span className="text-xs text-[#68776D]">點擊可查看做法步驟</span>
          </div>

          {isLoadingRecipes ? (
            <div className="bg-white rounded-2xl p-10 border border-[#E3E8E0] text-center shadow-xs">
              <div className="w-10 h-10 border-4 border-[#2F6B4F] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="font-bold text-sm text-[#20352B]">主廚智能系統正在為您調配食譜...</p>
              <p className="text-xs text-[#68776D] mt-1">
                嚴格遵循您的可用設備與食材庫存
              </p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-[#E3E8E0] text-center shadow-xs">
              <p className="font-bold text-sm text-[#20352B]">目前找不到完全符合的食譜</p>
              <p className="text-xs text-[#68776D] mt-1 mb-4">
                您選擇的設備或時間限制可能太嚴格，建議放寬料理時間或增選設備。
              </p>
              <button
                onClick={() => setShowFilterDrawer(true)}
                className="text-xs font-bold text-[#2F6B4F] underline cursor-pointer"
              >
                調整篩選條件
              </button>
            </div>
          ) : (
            recipes.map((recipe) => {
              const isSelected = selectedRecipe?.id === recipe.id;
              return (
                <div
                  key={recipe.id}
                  onClick={() => {
                    setSelectedRecipe(recipe);
                    setCompletedSteps({});
                    setTweakPreservedSummary(null);
                  }}
                  className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#2F6B4F] ring-2 ring-[#2F6B4F]/20 bg-[#2F6B4F]/5'
                      : 'border-[#E3E8E0] hover:border-[#A9C6AE]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#68776D] mb-1.5">
                      <span className="flex items-center gap-1 font-semibold text-[#20352B]">
                        <Clock className="w-3.5 h-3.5 text-[#E9A23B]" />
                        <span>{recipe.totalMinutes} 分鐘</span>
                      </span>
                      <span className="bg-[#F7F6F0] px-2 py-0.5 rounded text-[11px] font-medium">
                        {recipe.equipment.join(' · ')}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-[#20352B]">
                      {recipe.name}
                    </h3>
                    <p className="text-xs text-[#68776D] mt-1 line-clamp-2 leading-relaxed">
                      {recipe.description}
                    </p>

                    {/* Missing items reminder */}
                    {recipe.missingIngredients && recipe.missingIngredients.length > 0 ? (
                      <div className="mt-2 text-[11px] text-[#B7791F] bg-[#B7791F]/10 px-2 py-1 rounded-lg">
                        還需自備：{recipe.missingIngredients.join('、')}
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-[#26734D] bg-[#26734D]/10 px-2 py-1 rounded-lg font-medium">
                        ✓ 現有庫存食材全齊備！
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E3E8E0] flex items-center justify-between">
                    <span className="text-xs text-[#68776D]">
                      {recipe.ingredients.length} 種食材 · {recipe.steps.length} 步驟
                    </span>
                    <span
                      className={`text-xs font-bold flex items-center gap-0.5 ${
                        isSelected ? 'text-[#2F6B4F]' : 'text-[#68776D]'
                      }`}
                    >
                      <span>{isSelected ? '正在檢視' : '查看做法'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Recipe Details & Step-by-Step Cooking Guide (A08) */}
        <div className="lg:col-span-7">
          {selectedRecipe ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E3E8E0] shadow-xs space-y-6">
              {/* Preserved Constraints Banner after Tweak (A09) */}
              {tweakPreservedSummary && (
                <div className="bg-[#2F6B4F]/10 border border-[#2F6B4F]/30 p-3 rounded-xl text-xs text-[#2F6B4F] font-medium flex items-center gap-2 animate-fade-in">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#2F6B4F]" />
                  <span>{tweakPreservedSummary}</span>
                </div>
              )}

              {/* Recipe Title */}
              <div className="pb-4 border-b border-[#E3E8E0]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E9A23B]/20 text-[#E9A23B]">
                    {selectedRecipe.equipment.join(' · ')}
                  </span>
                  <span className="text-xs text-[#68776D] flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" /> {selectedRecipe.totalMinutes} 分鐘
                  </span>
                  <span className="text-xs text-[#68776D] font-medium">
                    · {selectedRecipe.servings || 1} 人份
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#20352B]">
                  {selectedRecipe.name}
                </h2>
                <p className="text-xs text-[#68776D] mt-1 leading-relaxed">
                  {selectedRecipe.description}
                </p>
              </div>

              {/* Ingredients Required Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#68776D] mb-2.5">
                  所需食材與份量
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        ing.isInFridge
                          ? 'border-[#A9C6AE] bg-[#2F6B4F]/5'
                          : 'border-[#B7791F]/30 bg-[#B7791F]/5'
                      }`}
                    >
                      <span className="font-bold text-[#20352B] truncate mr-1">
                        {ing.name}
                      </span>
                      <span className="font-semibold text-[#68776D] whitespace-nowrap">
                        {ing.amount} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step-by-Step Instructions with checkboxes & safety warnings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#68776D]">
                    逐步料理教學
                  </h3>
                  <span className="text-[11px] text-[#2F6B4F] font-semibold">
                    進度: {Object.values(completedSteps).filter(Boolean).length} /{' '}
                    {selectedRecipe.steps.length} 步
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedRecipe.steps.map((step) => {
                    const isDone = !!completedSteps[step.stepNumber];
                    return (
                      <div
                        key={step.stepNumber}
                        onClick={() =>
                          setCompletedSteps((prev) => ({
                            ...prev,
                            [step.stepNumber]: !isDone,
                          }))
                        }
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isDone
                            ? 'bg-[#26734D]/5 border-[#26734D]/30 opacity-70'
                            : 'bg-white border-[#E3E8E0] hover:border-[#2F6B4F]'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                            isDone
                              ? 'bg-[#26734D] text-white'
                              : 'bg-[#F7F6F0] text-[#20352B] border border-[#E3E8E0]'
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : step.stepNumber}
                        </div>

                        <div className="flex-1">
                          <p
                            className={`text-xs sm:text-sm leading-relaxed ${
                              isDone ? 'line-through text-[#68776D]' : 'text-[#20352B]'
                            }`}
                          >
                            {step.instruction}
                          </p>

                          {step.safetyTip && (
                            <div className="mt-2 text-[11px] text-[#B7791F] flex items-center gap-1.5 bg-[#B7791F]/10 px-2 py-1 rounded-lg">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <span>安全提示：{step.safetyTip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Recipe Tweaking / "換一道" Input & Chips (A09) */}
              <div className="bg-[#F7F6F0] p-4 rounded-2xl border border-[#E3E8E0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#20352B] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#2F6B4F]" />
                    <span>對話微調 / 動態換菜</span>
                  </span>
                  <span className="text-[11px] text-[#68776D]">保留既有設備與忌口條件</span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {quickTweakChips.map((chip) => (
                    <button
                      key={chip}
                      disabled={isTweaking}
                      onClick={() => handleTweakRecipe(chip)}
                      className="px-2.5 py-1 bg-white hover:bg-[#2F6B4F] hover:text-white rounded-lg text-xs font-medium text-[#20352B] border border-[#E3E8E0] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Custom Natural Language Tweak Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tweakInput}
                    onChange={(e) => setTweakInput(e.target.value)}
                    placeholder="想怎麼調整這道料理？例如：改成用微波爐、少放蒜頭..."
                    className="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-[#E3E8E0] focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                  <button
                    disabled={isTweaking || !tweakInput.trim()}
                    onClick={() => handleTweakRecipe(tweakInput)}
                    className="px-4 py-2 bg-[#20352B] text-white rounded-xl text-xs font-bold hover:bg-[#20352B]/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isTweaking ? '調配中...' : '送出調整'}
                  </button>
                </div>
              </div>

              {/* Bottom Actions: "我煮好了" Cooking Completion */}
              <div className="pt-4 border-t border-[#E3E8E0] flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="px-4 py-3 rounded-xl border border-[#E3E8E0] text-xs font-bold text-[#68776D] hover:text-[#20352B] cursor-pointer"
                >
                  返回食譜清單
                </button>

                <button
                  onClick={handleOpenDeductModal}
                  className="flex-1 py-3 px-5 rounded-xl bg-[#26734D] hover:bg-[#26734D]/90 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>我煮好了！確認用量並扣庫存</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-[#E3E8E0] text-center shadow-xs flex flex-col items-center justify-center min-h-[400px]">
              <BookOpen className="w-12 h-12 text-[#A9C6AE] mb-3" />
              <h3 className="font-bold text-base text-[#20352B]">請從左側點選食譜</h3>
              <p className="text-xs text-[#68776D] mt-1 max-w-sm">
                展開料理逐步教學與安全提醒，並在料理結束後確認實際使用食材並扣除庫存。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cooking Completion & Inventory Deduction Confirmation Modal */}
      {isDeductModalOpen && selectedRecipe && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E3E8E0] space-y-4 animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8E0]">
              <div>
                <h3 className="text-base font-bold text-[#20352B]">
                  這次用了哪些食材？
                </h3>
                <p className="text-xs text-[#68776D]">
                  請確認實際用量，確認後才會更新冰箱庫存，避免多扣或少扣。
                </p>
              </div>
              <button
                onClick={() => setIsDeductModalOpen(false)}
                className="text-[#68776D] hover:text-[#20352B] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editable Usage Table */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              <div className="grid grid-cols-12 text-[11px] font-bold text-[#68776D] px-2 py-1">
                <span className="col-span-4">食材名稱</span>
                <span className="col-span-2 text-center">原有庫存</span>
                <span className="col-span-3 text-center">本次使用</span>
                <span className="col-span-3 text-right">更新後剩餘</span>
              </div>

              {deductInputs.map((item, idx) => {
                const remaining = item.ingredientId
                  ? Math.max(0, item.originalQty - item.usedAmount)
                  : 0;
                const isOverused = item.ingredientId && item.usedAmount > item.originalQty;

                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 items-center p-2.5 rounded-xl border text-xs ${
                      isOverused
                        ? 'border-[#B54747] bg-[#B54747]/5'
                        : 'border-[#E3E8E0] bg-[#F7F6F0]'
                    }`}
                  >
                    <div className="col-span-4 font-bold text-[#20352B]">
                      {item.name}
                      {!item.ingredientId && (
                        <span className="text-[10px] block text-[#68776D] font-normal">
                          (自備外購)
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 text-center text-[#68776D]">
                      {item.ingredientId ? `${item.originalQty} ${item.unit}` : '-'}
                    </div>

                    <div className="col-span-3 flex items-center justify-center">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.usedAmount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setDeductInputs((prev) =>
                            prev.map((i, iIdx) =>
                              iIdx === idx ? { ...i, usedAmount: val } : i
                            )
                          );
                        }}
                        className="w-16 px-1.5 py-1 text-center font-bold bg-white border border-[#E3E8E0] rounded-lg text-xs focus:outline-hidden focus:border-[#2F6B4F]"
                      />
                    </div>

                    <div
                      className={`col-span-3 text-right font-extrabold ${
                        isOverused ? 'text-[#B54747]' : 'text-[#26734D]'
                      }`}
                    >
                      {item.ingredientId
                        ? `${remaining.toFixed(1).replace('.0', '')} ${item.unit}`
                        : '外購無更動'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick helper */}
            <div className="flex items-center justify-between text-xs pt-2">
              <button
                onClick={() => {
                  if (selectedRecipe) {
                    setDeductInputs(
                      selectedRecipe.ingredients.map((ing) => {
                        const matched = ingredients.find(
                          (i) => i.name.toLowerCase() === ing.name.toLowerCase()
                        );
                        return {
                          name: ing.name,
                          ingredientId: matched?.id,
                          originalQty: matched ? matched.quantity : 0,
                          usedAmount: ing.amount,
                          unit: ing.unit,
                        };
                      })
                    );
                  }
                }}
                className="text-[#2F6B4F] hover:underline font-semibold cursor-pointer"
              >
                重設為食譜建議用量
              </button>

              <span className="text-[11px] text-[#68776D]">
                僅扣除有在庫存之食材
              </span>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#E3E8E0] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeductModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#68776D] hover:bg-[#F7F6F0] cursor-pointer"
              >
                先不要更新
              </button>
              <button
                type="button"
                onClick={handleConfirmDeduction}
                className="px-5 py-2.5 bg-[#26734D] hover:bg-[#26734D]/90 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>確認更新冰箱庫存</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
