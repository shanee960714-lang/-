import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ScanView } from './components/ScanView';
import { FridgeView } from './components/FridgeView';
import { RecipeView } from './components/RecipeView';
import { PreferencesView } from './components/PreferencesView';
import { Ingredient, Recipe, UserPreferences, InventoryTransaction } from './types';
import { INITIAL_INGREDIENTS, INITIAL_PREFERENCES } from './utils/mockData';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('home');

  // Inventory State with local persistence
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    try {
      const saved = localStorage.getItem('freshmatch_ingredients');
      return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
    } catch {
      return INITIAL_INGREDIENTS;
    }
  });

  // User Preferences with local persistence
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('freshmatch_preferences');
      return saved ? JSON.parse(saved) : INITIAL_PREFERENCES;
    } catch {
      return INITIAL_PREFERENCES;
    }
  });

  // Recipes state
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: 'recipe-sample-1',
      name: '蒜香蔥花嫩豆腐烘蛋',
      description: '只需單口瓦斯爐或微波爐，將滑嫩板豆腐與濃郁蛋香融為一體，撒上焦香青蔥。',
      totalMinutes: 15,
      equipment: ['單口瓦斯爐'],
      servings: 1,
      dietTags: ['高蛋白增肌', '低醣'],
      ingredients: [
        { name: '雞蛋', amount: 3, unit: '顆', isInFridge: true },
        { name: '板豆腐', amount: 1, unit: '塊', isInFridge: true },
        { name: '青蔥', amount: 1, unit: '根', isInFridge: true },
        { name: '蒜頭', amount: 2, unit: '瓣', isInFridge: true },
      ],
      steps: [
        {
          stepNumber: 1,
          instruction: '將板豆腐用紙巾吸乾多餘水分，切成 2 公分見方小塊。青蔥切細花，蒜頭拍碎去皮切末。',
        },
        {
          stepNumber: 2,
          instruction: '取平底鍋或不沾鍋，熱鍋後倒入一茶匙油，先將蒜碎與蔥白小火煸出香氣。',
          safetyTip: '油溫適中即可，蒜末極易焦黑變苦，請保持微小火。',
        },
        {
          stepNumber: 3,
          instruction: '加入豆腐塊輕輕煎至表面微黃，將打散的雞蛋液淋在豆腐周圍，蓋上鍋蓋微悶 2 分鐘。',
        },
        {
          stepNumber: 4,
          instruction: '撒上青蔥綠花，趁熱起鍋裝盤即可享用。',
        },
      ],
      nutritionEstimate: {
        calories: 320,
        protein: 26,
        carbs: 6,
        fat: 18,
      },
    },
    {
      id: 'recipe-sample-2',
      name: '電鍋蒸時蔬五花肉卷',
      description: '免顧火！高麗菜包捲五花肉片與板豆腐，電鍋一鍵蒸透，甘甜清爽無負擔。',
      totalMinutes: 25,
      equipment: ['電鍋'],
      servings: 2,
      dietTags: ['無油煙', '家庭常備'],
      ingredients: [
        { name: '豬五花肉片', amount: 150, unit: '克', isInFridge: true },
        { name: '高麗菜', amount: 0.25, unit: '顆', isInFridge: true },
        { name: '板豆腐', amount: 0.5, unit: '塊', isInFridge: true },
      ],
      steps: [
        {
          stepNumber: 1,
          instruction: '高麗菜葉洗淨後汆燙 30 秒至軟化，撈出瀝乾備用。',
        },
        {
          stepNumber: 2,
          instruction: '將豆腐切成長條狀，用五花肉片與高麗菜葉緊密包裹成肉卷。',
        },
        {
          stepNumber: 3,
          instruction: '整齊排入蒸盤，電鍋外鍋倒入半杯水（約 100ml），按下開關蒸煮至跳起即可。',
          safetyTip: '揭蓋時請站立於側邊，小心高溫蒸氣燙傷臉手。',
        },
      ],
      nutritionEstimate: {
        calories: 380,
        protein: 22,
        carbs: 10,
        fat: 28,
      },
    },
  ]);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState<boolean>(false);

  // Inventory transaction history & undo support
  const [lastTransaction, setLastTransaction] = useState<InventoryTransaction[] | null>(null);

  // Save ingredients & preferences to localStorage
  useEffect(() => {
    localStorage.setItem('freshmatch_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('freshmatch_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Add ingredients from photo scan or manual add
  const handleAddIngredientsToFridge = (newItems: Ingredient[]) => {
    setIngredients((prev) => {
      const updated = [...prev];
      for (const item of newItems) {
        // If ingredient already exists by name, add up quantity
        const existingIdx = updated.findIndex(
          (i) => i.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + item.quantity,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        } else {
          updated.push(item);
        }
      }
      return updated;
    });
  };

  const handleUpdateIngredient = (id: string, updated: Partial<Ingredient>) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updated } : i))
    );
  };

  const handleDeleteIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  // Recipe fetching from server /api/recommend-recipes
  const handleFetchRecipes = async () => {
    setIsLoadingRecipes(true);
    try {
      const res = await fetch('/api/recommend-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          equipment: preferences.equipment,
          dietStyle: preferences.dietStyle,
          excludedIngredients: preferences.excludedIngredients,
          maxCookingMinutes: preferences.maxCookingMinutes,
          ingredientUsageMode: preferences.ingredientUsageMode,
          servings: preferences.servings,
        }),
      });

      if (!res.ok) throw new Error('推薦食譜失敗');
      const data = await res.json();
      if (Array.isArray(data.recipes) && data.recipes.length > 0) {
        setRecipes(data.recipes);
        setSelectedRecipe(data.recipes[0]);
      }
    } catch (err) {
      console.error(err);
      alert('推薦食譜產生失敗，請檢查網路連線或稍後再試');
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // Cooking completed: Deduct inventory (A10, A11)
  const handleDeductInventory = (
    recipeName: string,
    usedItems: { ingredientId?: string; name: string; amount: number; unit: string }[]
  ) => {
    const transactions: InventoryTransaction[] = [];

    setIngredients((prev) => {
      const nextList = [...prev];
      for (const used of usedItems) {
        if (!used.ingredientId) continue;
        const targetIdx = nextList.findIndex((i) => i.id === used.ingredientId);
        if (targetIdx >= 0) {
          const prevQty = nextList[targetIdx].quantity;
          const newQty = Math.max(0, prevQty - used.amount);

          transactions.push({
            id: `tx-${Date.now()}-${targetIdx}`,
            ingredientId: nextList[targetIdx].id,
            ingredientName: nextList[targetIdx].name,
            delta: used.amount,
            unit: used.unit,
            previousQty: prevQty,
            newQty: newQty,
            recipeName,
            timestamp: new Date().toISOString(),
          });

          nextList[targetIdx] = {
            ...nextList[targetIdx],
            quantity: newQty,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
      }
      return nextList;
    });

    setLastTransaction(transactions);
  };

  // Undo deduction (A11)
  const handleUndoDeduction = () => {
    if (!lastTransaction || lastTransaction.length === 0) return;

    setIngredients((prev) => {
      const nextList = [...prev];
      for (const tx of lastTransaction) {
        const targetIdx = nextList.findIndex((i) => i.id === tx.ingredientId);
        if (targetIdx >= 0) {
          nextList[targetIdx] = {
            ...nextList[targetIdx],
            quantity: tx.previousQty,
          };
        }
      }
      return nextList;
    });

    setLastTransaction(null);
    alert('已成功復原剛才扣除的食材庫存！');
  };

  // Quick filter helper from HomeView chips
  const handleQuickFilter = (filterKey: string, value: any) => {
    const updated = { ...preferences, [filterKey]: value };
    setPreferences(updated);
    setActiveTab('recipes');
    handleFetchRecipes();
  };

  const expiringCount = ingredients.filter((i) => {
    if (!i.expiryDate) return false;
    const diff =
      (new Date(i.expiryDate).getTime() - new Date('2026-10-18').getTime()) /
      (1000 * 3600 * 24);
    return diff <= 4 && diff >= 0;
  }).length;

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#20352B] flex flex-col font-sans selection:bg-[#2F6B4F]/20">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inventoryCount={ingredients.length}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'home' && (
          <HomeView
            ingredients={ingredients}
            recipes={recipes}
            preferences={preferences}
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectRecipe={(recipe) => {
              setSelectedRecipe(recipe);
              setActiveTab('recipes');
            }}
            onQuickFilter={handleQuickFilter}
          />
        )}

        {activeTab === 'scan' && (
          <ScanView
            onAddIngredientsToFridge={handleAddIngredientsToFridge}
            onNavigateToRecipes={() => {
              setActiveTab('recipes');
              handleFetchRecipes();
            }}
          />
        )}

        {activeTab === 'fridge' && (
          <FridgeView
            ingredients={ingredients}
            onUpdateIngredient={handleUpdateIngredient}
            onDeleteIngredient={handleDeleteIngredient}
            onAddIngredient={(item) => handleAddIngredientsToFridge([item])}
            onNavigateToScan={() => setActiveTab('scan')}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeView
            ingredients={ingredients}
            recipes={recipes}
            preferences={preferences}
            onUpdatePreferences={setPreferences}
            onFetchRecipes={handleFetchRecipes}
            onDeductInventory={handleDeductInventory}
            onUndoDeduction={handleUndoDeduction}
            canUndoDeduction={!!lastTransaction && lastTransaction.length > 0}
            selectedRecipe={selectedRecipe}
            setSelectedRecipe={setSelectedRecipe}
            isLoadingRecipes={isLoadingRecipes}
          />
        )}

        {activeTab === 'settings' && (
          <PreferencesView
            preferences={preferences}
            onSavePreferences={setPreferences}
          />
        )}
      </main>
    </div>
  );
}
