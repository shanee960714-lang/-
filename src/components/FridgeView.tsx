import React, { useState } from 'react';
import {
  Search,
  Plus,
  Camera,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  Check,
  X,
  Filter,
} from 'lucide-react';
import { Ingredient } from '../types';

interface FridgeViewProps {
  ingredients: Ingredient[];
  onUpdateIngredient: (id: string, updated: Partial<Ingredient>) => void;
  onDeleteIngredient: (id: string) => void;
  onAddIngredient: (newItem: Ingredient) => void;
  onNavigateToScan: () => void;
}

export const FridgeView: React.FC<FridgeViewProps> = ({
  ingredients,
  onUpdateIngredient,
  onDeleteIngredient,
  onAddIngredient,
  onNavigateToScan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expiring' | 'unconfirmed'>('all');

  // Modal for adding manual ingredient
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newUnit, setNewUnit] = useState('份');
  const [newCategory, setNewCategory] = useState<Ingredient['category']>('蔬菜');
  const [newExpiry, setNewExpiry] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(1);
  const [editUnit, setEditUnit] = useState<string>('');

  const categories = ['全部', '蔬菜', '蛋奶豆', '肉類', '海鮮', '主食', '調味料', '其他'];

  const filteredIngredients = ingredients.filter((item) => {
    // Search filter
    if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Category filter
    if (selectedCategory !== '全部' && item.category !== selectedCategory) {
      return false;
    }
    // Status filter
    if (statusFilter === 'expiring') {
      if (!item.expiryDate) return false;
      const diff =
        (new Date(item.expiryDate).getTime() - new Date('2026-10-18').getTime()) /
        (1000 * 3600 * 24);
      return diff <= 4 && diff >= 0;
    }
    if (statusFilter === 'unconfirmed') {
      return item.confirmed === false;
    }
    return true;
  });

  const handleStartEdit = (item: Ingredient) => {
    setEditingId(item.id);
    setEditQty(item.quantity);
    setEditUnit(item.unit);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateIngredient(id, { quantity: editQty, unit: editUnit });
    setEditingId(null);
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: Ingredient = {
      id: `ing-${Date.now()}`,
      name: newName.trim(),
      quantity: newQty,
      unit: newUnit.trim() || '份',
      category: newCategory,
      confidence: 'high',
      confirmed: true,
      expiryDate: newExpiry || undefined,
      location: '冷藏',
      source: 'manual',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onAddIngredient(newItem);
    setIsAddModalOpen(false);
    setNewName('');
    setNewQty(1);
    setNewUnit('份');
    setNewExpiry('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20352B] tracking-tight">
            我的冰箱庫存
          </h1>
          <p className="text-sm text-[#68776D] mt-0.5">
            隨時掌握新鮮度、快速增減食材，做菜時自動精準扣除。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToScan}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#2F6B4F] text-[#2F6B4F] font-semibold text-xs hover:bg-[#2F6B4F]/10 transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>拍照盤點</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2F6B4F] text-white font-semibold text-xs hover:bg-[#2F6B4F]/90 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>手動新增食材</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E3E8E0] shadow-xs space-y-3">
        {/* Search input & status filter chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68776D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋食材名稱（例如：雞蛋、高麗菜、豆腐）..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F7F6F0] rounded-xl border border-[#E3E8E0] focus:outline-hidden focus:border-[#2F6B4F]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#68776D] font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> 篩選:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#2F6B4F] text-white'
                  : 'bg-[#F7F6F0] text-[#68776D] hover:text-[#20352B]'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setStatusFilter('expiring')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'expiring'
                  ? 'bg-[#B7791F] text-white'
                  : 'bg-[#F7F6F0] text-[#B7791F] hover:bg-[#B7791F]/10'
              }`}
            >
              即將到期 (3天內)
            </button>
            <button
              onClick={() => setStatusFilter('unconfirmed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'unconfirmed'
                  ? 'bg-[#E9A23B] text-white'
                  : 'bg-[#F7F6F0] text-[#68776D] hover:text-[#20352B]'
              }`}
            >
              待確認項目
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#20352B] text-white shadow-xs'
                  : 'bg-[#F7F6F0] text-[#68776D] hover:text-[#20352B] hover:bg-[#E3E8E0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients Grid / List */}
      {filteredIngredients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E3E8E0] text-center shadow-xs">
          <p className="font-bold text-[#20352B] text-base">找不到相符的食材</p>
          <p className="text-xs text-[#68776D] mt-1 mb-4">
            請嘗試調整搜尋關鍵字、分類篩選，或點擊「新增食材」加入庫存。
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('全部');
              setStatusFilter('all');
            }}
            className="text-xs font-semibold text-[#2F6B4F] hover:underline cursor-pointer"
          >
            重設篩選條件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIngredients.map((item) => {
            const isEditing = editingId === item.id;
            const isExpiringSoon =
              item.expiryDate &&
              (new Date(item.expiryDate).getTime() - new Date('2026-10-18').getTime()) /
                (1000 * 3600 * 24) <=
                3;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs flex flex-col justify-between ${
                  isExpiringSoon
                    ? 'border-[#B7791F]/40 bg-[#B7791F]/5'
                    : 'border-[#E3E8E0] hover:border-[#A9C6AE]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-[#20352B]">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#F7F6F0] text-[#68776D] font-medium border border-[#E3E8E0]">
                          {item.category}
                        </span>
                      </div>

                      {item.source === 'photo' && (
                        <span className="text-[10px] text-[#2F6B4F] mt-0.5 inline-block">
                          📷 照片盤點辨識
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="text-[#68776D] hover:text-[#2F6B4F] p-1.5 rounded-lg hover:bg-[#F7F6F0] transition-colors cursor-pointer"
                        title="編輯用量"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`確定要從冰箱移除「${item.name}」嗎？`)) {
                            onDeleteIngredient(item.id);
                          }
                        }}
                        className="text-[#68776D] hover:text-[#B54747] p-1.5 rounded-lg hover:bg-[#B54747]/10 transition-colors cursor-pointer"
                        title="刪除食材"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity & Unit */}
                  <div className="mt-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2 bg-[#F7F6F0] p-2 rounded-xl">
                        <input
                          type="number"
                          min="0.1"
                          step="0.5"
                          value={editQty}
                          onChange={(e) => setEditQty(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-white border border-[#E3E8E0] rounded-lg text-xs font-bold text-center"
                        />
                        <input
                          type="text"
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="w-12 px-2 py-1 bg-white border border-[#E3E8E0] rounded-lg text-xs text-center"
                        />
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="p-1 bg-[#2F6B4F] text-white rounded-lg hover:bg-[#2F6B4F]/90 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-[#20352B]">
                          {item.quantity}
                        </span>
                        <span className="text-xs text-[#68776D] font-medium">
                          {item.unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expiry Date & Status */}
                <div className="mt-4 pt-3 border-t border-[#E3E8E0] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-[#68776D]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.expiryDate ? `保鮮期: ${item.expiryDate}` : '未指定到期日'}</span>
                  </div>

                  {isExpiringSoon && (
                    <span className="flex items-center gap-1 font-bold text-[#B7791F]">
                      <AlertTriangle className="w-3 h-3" />
                      <span>即將到期</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E3E8E0] space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8E0]">
              <h3 className="text-base font-bold text-[#20352B]">手動新增冰箱食材</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#68776D] hover:text-[#20352B] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#20352B] block mb-1">
                  食材名稱 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：牛番茄、無糖優格、洋蔥"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E3E8E0] bg-[#F7F6F0] focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#20352B] block mb-1">
                    數量 *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E3E8E0] bg-[#F7F6F0] focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#20352B] block mb-1">
                    單位 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="顆、塊、克、瓶"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E3E8E0] bg-[#F7F6F0] focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#20352B] block mb-1">
                    分類
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E3E8E0] bg-[#F7F6F0] focus:outline-hidden focus:border-[#2F6B4F]"
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
                <div>
                  <label className="text-xs font-bold text-[#20352B] block mb-1">
                    有效保鮮期
                  </label>
                  <input
                    type="date"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E3E8E0] bg-[#F7F6F0] focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E3E8E0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#68776D] hover:bg-[#F7F6F0] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2F6B4F] text-white rounded-xl text-xs font-bold hover:bg-[#2F6B4F]/90 cursor-pointer shadow-xs"
                >
                  確認新增入庫
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
