import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Check,
  BookOpen,
} from 'lucide-react';
import { Ingredient } from '../types';
import { fileToBase64, urlToBase64 } from '../utils/imageUtils';
import { SAMPLE_PREVIEWS } from '../utils/mockData';

interface ScanViewProps {
  onAddIngredientsToFridge: (newItems: Ingredient[]) => void;
  onNavigateToRecipes: () => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  onAddIngredientsToFridge,
  onNavigateToRecipes,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Analysis results
  const [detectedIngredients, setDetectedIngredients] = useState<
    (Ingredient & { checked: boolean })[]
  >([]);

  // UI state
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image analysis request
  const analyzeImageBase64 = async (base64: string, mimeType: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setSuccessToast(null);

    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '這張照片不太清楚，請重新拍攝，或改用手動新增食材。');
      }

      const data = await res.json();

      if (Array.isArray(data.ingredients)) {
        const items = data.ingredients.map((item: any, idx: number) => ({
          id: item.id || `detected-${Date.now()}-${idx}`,
          name: item.name || '未知食材',
          quantity: item.quantity !== undefined ? item.quantity : 1,
          unit: item.unit || '份',
          category: item.category || '其他',
          confidence: item.confidence || 'high',
          confidence_note: item.confidence_note || '',
          box_2d: item.box_2d || undefined,
          confirmed: false,
          checked: item.defaultChecked !== false,
          source: 'photo' as const,
        }));
        setDetectedIngredients(items);
      } else {
        setDetectedIngredients([]);
      }
    } catch (err: any) {
      console.error('Image analysis error:', err);
      setErrorMessage(err.message || '辨識過程中斷，請重試或上傳其他照片。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Upload handler from local file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { base64, mimeType } = await fileToBase64(file);
      setImagePreview(base64);
      await analyzeImageBase64(base64, mimeType);
    } catch (err) {
      console.error(err);
      setErrorMessage('讀取圖片失敗，請重試');
    }
  };

  // Quick select sample photo
  const handleSelectSample = async (sampleUrl: string) => {
    setImagePreview(sampleUrl);
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const { base64, mimeType } = await urlToBase64(sampleUrl);
      setImagePreview(base64);
      await analyzeImageBase64(base64, mimeType);
    } catch (err) {
      console.error('Sample loading error:', err);
      setErrorMessage('無法載入範例圖片，請直接上傳本地照片。');
      setIsAnalyzing(false);
    }
  };

  // Toggle item check
  const handleToggleCheck = (id: string) => {
    setDetectedIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // Edit item field
  const handleUpdateItem = (id: string, field: keyof Ingredient, value: any) => {
    setDetectedIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Delete detected item
  const handleDeleteItem = (id: string) => {
    setDetectedIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  // Add manual item
  const handleAddManualItem = () => {
    const newItem: Ingredient & { checked: boolean } = {
      id: `manual-${Date.now()}`,
      name: '自訂食材',
      quantity: 1,
      unit: '份',
      category: '蔬菜',
      confidence: 'high',
      checked: true,
      confirmed: true,
      source: 'manual',
    };
    setDetectedIngredients((prev) => [newItem, ...prev]);
  };

  // Confirm and add to fridge inventory
  const handleConfirmAddToFridge = () => {
    const checkedItems = detectedIngredients
      .filter((i) => i.checked)
      .map((i) => ({
        ...i,
        confirmed: true,
        updatedAt: new Date().toISOString().split('T')[0],
      }));

    if (checkedItems.length === 0) {
      alert('請至少勾選一項要加入冰箱的食材');
      return;
    }

    onAddIngredientsToFridge(checkedItems);
    setSuccessToast(`已成功將 ${checkedItems.length} 項食材加入冰箱！`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20352B] tracking-tight">
            拍下冰箱裡的食材
          </h1>
          <p className="text-sm text-[#68776D] mt-1">
            智慧辨識可見食材與標記框位置，確認後即可一鍵加入冰箱庫存。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-[#2F6B4F] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2F6B4F]/90 transition-all shadow-xs cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>開啟相機 / 上傳照片</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {successToast && (
        <div className="bg-[#26734D]/10 border border-[#26734D] text-[#26734D] px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2 font-medium text-sm">
            <CheckCircle className="w-5 h-5 text-[#26734D]" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={onNavigateToRecipes}
            className="text-xs font-bold underline hover:opacity-80 cursor-pointer"
          >
            立即為這些食材找食譜 →
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-[#B54747]/10 border border-[#B54747]/30 text-[#B54747] px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* If No Image is selected yet: Upload Guidelines & Sample Photos */}
      {!imagePreview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="md:col-span-2 border-2 border-dashed border-[#A9C6AE] hover:border-[#2F6B4F] bg-white rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group shadow-xs"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#2F6B4F]/10 flex items-center justify-center text-[#2F6B4F] group-hover:scale-110 transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#20352B]">
              點擊上傳或拖曳照片至此
            </h3>
            <p className="text-xs text-[#68776D] mt-2 max-w-md">
              支援常用相片與圖片格式。可分層拍攝冷藏室或料理台，不確定之食材將提示手動確認。
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#2F6B4F] bg-[#2F6B4F]/10 px-3 py-1.5 rounded-full font-medium">
              <Info className="w-3.5 h-3.5" />
              <span>辨識結果會先讓您確認，不會直接改變庫存</span>
            </div>
          </div>

          {/* Shooting Tips */}
          <div className="bg-white rounded-2xl p-6 border border-[#E3E8E0] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#2F6B4F] font-bold text-base mb-3">
                <CheckCircle className="w-5 h-5" />
                <span>拍攝清晰小指南</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#20352B]/85">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E3E8E0] text-[#20352B] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    <strong>光線充足</strong>：避免逆光或反光遮擋食材與包裝。
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E3E8E0] text-[#20352B] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    <strong>分層取景</strong>：可分別拍冷藏層架或蔬果保鮮抽屜。
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E3E8E0] text-[#20352B] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    <strong>自由修正</strong>：智能辨識結果皆可自由編輯數量或刪除。
                  </span>
                </li>
              </ul>
            </div>

            {/* Quick Sample Selector */}
            <div className="mt-6 pt-4 border-t border-[#E3E8E0]">
              <span className="text-xs font-semibold text-[#68776D] block mb-2">
                沒有照片？點擊體驗精選範例：
              </span>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_PREVIEWS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSample(sample.url);
                    }}
                    className="relative group overflow-hidden rounded-xl border border-[#E3E8E0] hover:border-[#2F6B4F] text-left cursor-pointer transition-all aspect-square"
                  >
                    <img
                      src={sample.url}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-1.5 opacity-90 group-hover:opacity-100">
                      <span className="text-[10px] text-white font-medium leading-tight">
                        {sample.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* When Image is loaded or analyzing */}
      {imagePreview && (
        <div className="space-y-6">
          {/* Top Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E3E8E0] shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#2F6B4F] bg-[#2F6B4F]/10 hover:bg-[#2F6B4F]/20 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>更換照片</span>
              </button>
              <button
                onClick={() => {
                  if (imagePreview) analyzeImageBase64(imagePreview, 'image/jpeg');
                }}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#68776D] hover:text-[#20352B] bg-[#F7F6F0] px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>重新辨識</span>
              </button>
            </div>

            <span className="text-xs font-bold text-[#20352B]">
              共辨識出 {detectedIngredients.length} 項食材
            </span>
          </div>

          {/* Loading Indicator */}
          {isAnalyzing && (
            <div className="bg-white rounded-2xl p-8 border border-[#A9C6AE] shadow-xs flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full border-4 border-[#2F6B4F] border-t-transparent animate-spin mb-3"></div>
              <p className="font-bold text-[#20352B]">智能系統正在深度解讀食材中...</p>
              <p className="text-xs text-[#68776D] mt-1">
                正在精準檢測邊界框座標、份量與類別
              </p>
            </div>
          )}

          {/* Main Content Grid: Left Image with Bounding Boxes, Right Panel */}
          {!isAnalyzing && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image with Bounding Boxes */}
              <div className="lg:col-span-6 bg-white rounded-2xl p-4 border border-[#E3E8E0] shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#20352B]">照片檢視與標記框</span>
                  <span className="text-[11px] text-[#68776D]">
                    點擊框標可快速定位右側食材
                  </span>
                </div>

                <div className="relative w-full rounded-xl overflow-hidden bg-black/5 aspect-4/3 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="冰箱照片"
                    className="w-full h-full object-contain select-none"
                  />

                  {/* Overlaid Bounding Boxes */}
                  {detectedIngredients.map((item) => {
                    if (!item.box_2d || item.box_2d.length !== 4) return null;
                    const [ymin, xmin, ymax, xmax] = item.box_2d;

                    const top = `${(ymin / 1000) * 100}%`;
                    const left = `${(xmin / 1000) * 100}%`;
                    const width = `${((xmax - xmin) / 1000) * 100}%`;
                    const height = `${((ymax - ymin) / 1000) * 100}%`;

                    const isHighlighted = highlightedId === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setHighlightedId(item.id)}
                        onMouseEnter={() => setHighlightedId(item.id)}
                        onMouseLeave={() => setHighlightedId(null)}
                        style={{ top, left, width, height }}
                        className={`absolute border-2 transition-all cursor-pointer group flex items-start justify-start ${
                          isHighlighted
                            ? 'border-[#E9A23B] bg-[#E9A23B]/25 z-20 scale-[1.01]'
                            : item.confidence === 'low'
                            ? 'border-[#B7791F] bg-[#B7791F]/10 z-10'
                            : 'border-[#2F6B4F] bg-[#2F6B4F]/10 z-10'
                        }`}
                      >
                        <span
                          className={`text-[10px] px-1 py-0.5 rounded font-bold whitespace-nowrap shadow-xs -mt-5 ml-0 transition-colors ${
                            isHighlighted
                              ? 'bg-[#E9A23B] text-white'
                              : item.confidence === 'low'
                              ? 'bg-[#B7791F] text-white'
                              : 'bg-[#2F6B4F] text-white'
                          }`}
                        >
                          {item.name} {item.quantity}{item.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend indicator */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#68776D] pt-2 border-t border-[#E3E8E0]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#2F6B4F]"></span>
                      <span>清晰辨識</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#B7791F]"></span>
                      <span>待確認/模糊</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#E9A23B]"></span>
                      <span>當前選取</span>
                    </span>
                  </div>
                  <span>共框選 {detectedIngredients.length} 項</span>
                </div>
              </div>

              {/* Right Column: Ingredient Confirmation Table (A04) */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div className="bg-white rounded-2xl p-5 border border-[#E3E8E0] shadow-xs flex flex-col h-full">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3E8E0] mb-3">
                    <div>
                      <h2 className="text-base font-bold text-[#20352B]">
                        確認食材與數量
                      </h2>
                      <p className="text-xs text-[#68776D]">
                        可自由修改名稱、份量或刪除誤判項目
                      </p>
                    </div>
                    <button
                      onClick={handleAddManualItem}
                      className="flex items-center gap-1 text-xs font-semibold text-[#2F6B4F] hover:bg-[#2F6B4F]/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>手動新增</span>
                    </button>
                  </div>

                  {/* Scrollable Items List */}
                  <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
                    {detectedIngredients.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#68776D]">
                        未能檢測到食材，請嘗試點擊上方「手動新增」或重新拍攝
                      </div>
                    ) : (
                      detectedIngredients.map((item) => {
                        const isHighlighted = highlightedId === item.id;
                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => setHighlightedId(item.id)}
                            onMouseLeave={() => setHighlightedId(null)}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              isHighlighted
                                ? 'border-[#E9A23B] bg-[#E9A23B]/5'
                                : item.checked
                                ? 'border-[#E3E8E0] bg-[#FFFFFF] hover:border-[#A9C6AE]'
                                : 'border-[#E3E8E0] bg-[#F7F6F0]/60 opacity-60'
                            }`}
                          >
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => handleToggleCheck(item.id)}
                              className="w-4 h-4 rounded text-[#2F6B4F] focus:ring-[#2F6B4F] cursor-pointer"
                            />

                            {/* Editable Name & Category */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, 'name', e.target.value)
                                  }
                                  className="font-bold text-sm text-[#20352B] bg-transparent border-b border-transparent hover:border-[#A9C6AE] focus:border-[#2F6B4F] focus:outline-hidden px-0.5 w-28"
                                  placeholder="食材名稱"
                                />

                                {/* Confidence Badge */}
                                {item.confidence === 'low' ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#B7791F]/15 text-[#B7791F] font-semibold flex items-center gap-0.5">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    {item.confidence_note || '請確認'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#26734D]/15 text-[#26734D] font-semibold">
                                    清晰辨識
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1">
                                <select
                                  value={item.category}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, 'category', e.target.value)
                                  }
                                  className="text-[11px] text-[#68776D] bg-[#F7F6F0] rounded px-1.5 py-0.5 border border-[#E3E8E0] focus:outline-hidden"
                                >
                                  <option value="蔬菜">蔬菜</option>
                                  <option value="蛋奶豆">蛋奶豆</option>
                                  <option value="肉類">肉類</option>
                                  <option value="海鮮">海鮮</option>
                                  <option value="主食">主食</option>
                                  <option value="調味料">調味料</option>
                                  <option value="其他">其他</option>
                                </select>
                              </div>
                            </div>

                            {/* Editable Quantity & Unit */}
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0.1"
                                step="0.5"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.id,
                                    'quantity',
                                    parseFloat(e.target.value) || 1
                                  )
                                }
                                className="w-14 text-center text-xs font-semibold py-1 px-1 rounded-lg border border-[#E3E8E0] bg-[#F7F6F0] focus:outline-hidden focus:border-[#2F6B4F]"
                              />
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, 'unit', e.target.value)
                                }
                                className="w-10 text-center text-xs py-1 px-1 rounded-lg border border-[#E3E8E0] bg-[#F7F6F0] focus:outline-hidden focus:border-[#2F6B4F]"
                              />
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-[#68776D] hover:text-[#B54747] p-1 rounded transition-colors cursor-pointer"
                              title="刪除此項目"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-4 border-t border-[#E3E8E0] mt-auto space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#68776D]">
                      <span>
                        已選取 {detectedIngredients.filter((i) => i.checked).length} /{' '}
                        {detectedIngredients.length} 項
                      </span>
                      <button
                        onClick={() => {
                          const allChecked = detectedIngredients.every((i) => i.checked);
                          setDetectedIngredients((prev) =>
                            prev.map((i) => ({ ...i, checked: !allChecked }))
                          );
                        }}
                        className="hover:underline text-[#2F6B4F] cursor-pointer"
                      >
                        {detectedIngredients.every((i) => i.checked) ? '取消全選' : '全選'}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleConfirmAddToFridge}
                        className="flex-1 bg-[#2F6B4F] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#2F6B4F]/90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>確認加入冰箱庫存</span>
                      </button>
                      <button
                        onClick={onNavigateToRecipes}
                        className="px-4 py-2.5 border border-[#2F6B4F] text-[#2F6B4F] rounded-xl font-bold text-sm hover:bg-[#2F6B4F]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>前往配菜</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
