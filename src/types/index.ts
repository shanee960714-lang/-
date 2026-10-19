export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: '蔬菜' | '蛋奶豆' | '肉類' | '海鮮' | '主食' | '調味料' | '其他';
  confidence?: 'high' | 'low';
  confidence_note?: string;
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  confirmed?: boolean;
  expiryDate?: string;
  location?: '冷藏' | '冷凍' | '常溫';
  source?: 'photo' | 'manual';
  updatedAt?: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  safetyTip?: string;
  completed?: boolean;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  isInFridge: boolean;
  isMissing?: boolean;
  actualUsedAmount?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepMinutes?: number;
  cookMinutes?: number;
  totalMinutes: number;
  equipment: string[];
  servings: number;
  dietTags?: string[];
  ingredients: RecipeIngredient[];
  missingIngredients?: string[];
  steps: RecipeStep[];
  nutritionEstimate?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface UserPreferences {
  equipment: string[];
  dietStyle: string;
  excludedIngredients: string[];
  allergens: string[];
  maxCookingMinutes: number;
  servings: number;
  ingredientUsageMode: string;
}

export interface InventoryTransaction {
  id: string;
  ingredientId: string;
  ingredientName: string;
  delta: number;
  unit: string;
  previousQty: number;
  newQty: number;
  recipeName?: string;
  timestamp: string;
}
