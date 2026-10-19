import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limits for image base64 payloads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Shared Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Analyze Image (Strictly Smart Fridge Ingredient Detection with Bounding Boxes)
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 data' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const promptText = `
你是一位專業的智慧冰箱食材視覺分析專家與資深廚房管理師。
請仔細辨識這張照片中所有可見的冰箱或廚房食材。

請為每項可見食材標註：
1. name: 繁體中文食材名稱（例如: 雞蛋, 板豆腐, 高麗菜, 青蔥, 豬五花, 牛奶, 檸檬, 蒜頭）
2. quantity: 估計數量或份量（數值，例如: 4, 1, 0.5, 200）
3. unit: 單位（例如: 顆, 塊, 份, 根, 瓶, 包, 克）
4. category: 分類（蔬菜, 蛋奶豆, 肉類, 海鮮, 主食, 調味料, 其他）
5. confidence: 辨識信心度（"high" 或 "low"；若食材被部分遮擋、重疊、包裝不透明或模糊，請標記為 "low"）
6. confidence_note: 信心提示文字（若 low 填寫「包裝反光，請確認」或「辨識不確定，請確認名稱」；若 high 填寫「清晰辨識」）
7. box_2d: 歸一化座標邊界框 [ymin, xmin, ymax, xmax]，範圍為 0 到 1000 的整數，代表該食材在圖片中的實際位置。
8. defaultChecked: boolean（預設 true，若辨識極度模糊可設 false）

請以繁體中文 (zh-TW) 輸出，並嚴格遵循 JSON 格式。
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  category: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                  confidence_note: { type: Type.STRING },
                  box_2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] normalized 0-1000',
                  },
                  defaultChecked: { type: Type.BOOLEAN },
                },
                required: ['name', 'quantity', 'unit', 'category', 'box_2d'],
              },
            },
          },
          required: ['ingredients'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (Array.isArray(parsed.ingredients)) {
      parsed.ingredients = parsed.ingredients.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `ing_${Date.now()}_${idx}`,
        defaultChecked: item.defaultChecked !== false,
      }));
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    return res.status(500).json({
      error: error.message || '辨識圖片失敗，請重試或改用手動新增食材。',
    });
  }
});

// Endpoint: Recipe Recommendations (Filtered strictly by available fridge inventory, equipment, diet style, allergens, cooking time)
app.post('/api/recommend-recipes', async (req, res) => {
  try {
    const {
      ingredients = [], // list of current confirmed fridge items { name, quantity, unit }
      equipment = ['電鍋', '微波爐'], // user checked equipment
      dietStyle = '一般均衡', // 一般均衡, 高蛋白增肌, 低醣／生酮, 全素
      excludedIngredients = [], // user excluded ingredients / allergens
      maxCookingMinutes = 30, // 15, 30, 45, 999 (no limit)
      ingredientUsageMode = '優先使用現有食材',
      servings = 1,
    } = req.body;

    const systemPrompt = `你是一位專業的智慧廚房食譜規劃師與資深家常菜主廚。
你的職責是依據使用者現有的冰箱食材清單、可用的烹飪設備、嚴格的飲食忌口限制與時間限制，規劃最實用、做得到且美味的家常食譜。

【重要規則】：
1. 【設備為硬限制】：絕對不能推薦需要使用者「未勾選設備」的食譜！例如若使用者未選氣炸鍋，食譜中就絕不能出現氣炸步驟；若勾選「不用開火」，只能是涼拌、沙拉或免加熱料理。
2. 【過敏原與忌口為硬限制】：絕對不得出現排除清單中的食材。全素模式下必須嚴格排除肉、魚、海鮮、蛋、乳及明膠等動物製品。
3. 【時間限制為硬限制】：總時間（準備時間 + 烹飪時間）不得超過使用者指定的時間上限（如 15 分鐘、30 分鐘等）。
4. 【食材用量透明】：食譜中的食材必須明確標註建議使用量，並清楚標示哪些是現有冰箱庫存、哪些是額外缺少需自備/添購的（如有）。
5. 【步驟清晰附安全提醒】：每一步驟具體明確，高溫、熱油或微波蒸氣需附上貼心安全提醒。`;

    const userPrompt = `
【冰箱現有庫存食材】：
${
  ingredients.length > 0
    ? ingredients.map((i: any) => `- ${i.name} (現存: ${i.quantity} ${i.unit || ''})`).join('\n')
    : '目前尚無已確認食材（請以常見家常食材為基底）'
}

【可用設備（硬限制）】：${equipment.join('、') || '不用開火'}
【飲食風格】：${dietStyle}
【嚴格忌口/過敏原（嚴禁使用）】：${excludedIngredients.join('、') || '無特別忌口'}
【最長料理時間】：${maxCookingMinutes >= 999 ? '不限' : `${maxCookingMinutes} 分鐘內`}
【食材使用模式】：${ingredientUsageMode}
【預估份量】：${servings} 人份

請推薦 2 到 3 道完全符合上述條件的精緻實用食譜。若目前條件極度嚴格而難以完全匹配，請在 'hasConflict' 註明，並在 'conflictReason' 中說明原因與建議放寬項目。
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasConflict: { type: Type.BOOLEAN },
            conflictReason: { type: Type.STRING },
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  prepMinutes: { type: Type.INTEGER },
                  cookMinutes: { type: Type.INTEGER },
                  totalMinutes: { type: Type.INTEGER },
                  equipment: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  servings: { type: Type.INTEGER },
                  dietTags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        amount: { type: Type.NUMBER },
                        unit: { type: Type.STRING },
                        isInFridge: { type: Type.BOOLEAN },
                        isMissing: { type: Type.BOOLEAN },
                      },
                      required: ['name', 'amount', 'unit', 'isInFridge'],
                    },
                  },
                  missingIngredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  steps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stepNumber: { type: Type.INTEGER },
                        instruction: { type: Type.STRING },
                        safetyTip: { type: Type.STRING },
                      },
                      required: ['stepNumber', 'instruction'],
                    },
                  },
                  nutritionEstimate: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.INTEGER },
                      protein: { type: Type.INTEGER },
                      carbs: { type: Type.INTEGER },
                      fat: { type: Type.INTEGER },
                    },
                  },
                },
                required: [
                  'name',
                  'description',
                  'totalMinutes',
                  'equipment',
                  'ingredients',
                  'steps',
                ],
              },
            },
          },
          required: ['recipes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (Array.isArray(parsed.recipes)) {
      parsed.recipes = parsed.recipes.map((r: any, idx: number) => ({
        ...r,
        id: r.id || `recipe_${Date.now()}_${idx}`,
      }));
    }
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error recommending recipes:', error);
    return res.status(500).json({ error: error.message || '推薦食譜失敗' });
  }
});

// Endpoint: Dynamic Recipe Tweak / "換一道" (Conversational fine-tuning with preserved constraints)
app.post('/api/tweak-recipe', async (req, res) => {
  try {
    const {
      currentRecipe,
      userInstruction, // e.g. "換一道不用開火的", "不要高麗菜", "15分鐘內完成", "改用微波爐"
      activeConstraints = {},
      ingredients = [],
    } = req.body;

    const systemPrompt = `你是一位靈活的智慧食譜調配顧問。
使用者正在查看一道食譜，並給出調整指令（例如：「換一道不用開火的」、「改成 15 分鐘內」、「不要高麗菜」、「改用微波爐」）。
【核心原則】：
1. 增量修改：只修改使用者指定的條件，必須嚴格保留使用者原有的其他有效約束（例如全素、已排除的忌口、不可用設備等）！
2. 絕不能只改菜名，必須提供全新的步驟、精確食材與真實做法。
3. 若新指令與原條件衝突（例如原本限電鍋，現在說改氣炸鍋），以最新指令為準，並在 'preservedSummary' 與 'adjustmentExplanation' 中清楚向使用者說明保留了哪些、替換了哪些。`;

    const userPrompt = `
【原食譜】：${currentRecipe.name} (${currentRecipe.description})
【原食譜使用設備】：${currentRecipe.equipment?.join('、')}
【原食譜食材】：${currentRecipe.ingredients?.map((i: any) => `${i.name} ${i.amount}${i.unit}`).join('、')}

【使用者最新微調指令】：${userInstruction}

【系統保留的基礎條件】：
- 可用設備：${activeConstraints.equipment?.join('、') || '未限制'}
- 飲食風格：${activeConstraints.dietStyle || '一般均衡'}
- 排除忌口：${activeConstraints.excludedIngredients?.join('、') || '無'}
- 時間限制：${activeConstraints.maxCookingMinutes || '不限'}

【冰箱庫存】：${ingredients.map((i: any) => `${i.name} (${i.quantity}${i.unit})`).join('、')}

請輸出新食譜，以及條件保留摘要與差異說明。
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            preservedSummary: {
              type: Type.STRING,
              description: '例如：已保留「全素」、「15分鐘內」限制，並為您切換為「不用開火」料理',
            },
            adjustmentExplanation: {
              type: Type.STRING,
              description: '這道新食譜如何滿足您的最新要求',
            },
            recipe: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                prepMinutes: { type: Type.INTEGER },
                cookMinutes: { type: Type.INTEGER },
                totalMinutes: { type: Type.INTEGER },
                equipment: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                servings: { type: Type.INTEGER },
                dietTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      isInFridge: { type: Type.BOOLEAN },
                      isMissing: { type: Type.BOOLEAN },
                    },
                    required: ['name', 'amount', 'unit', 'isInFridge'],
                  },
                },
                missingIngredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      stepNumber: { type: Type.INTEGER },
                      instruction: { type: Type.STRING },
                      safetyTip: { type: Type.STRING },
                    },
                    required: ['stepNumber', 'instruction'],
                  },
                },
                nutritionEstimate: {
                  type: Type.OBJECT,
                  properties: {
                    calories: { type: Type.INTEGER },
                    protein: { type: Type.INTEGER },
                    carbs: { type: Type.INTEGER },
                    fat: { type: Type.INTEGER },
                  },
                },
              },
              required: [
                'name',
                'description',
                'totalMinutes',
                'equipment',
                'ingredients',
                'steps',
              ],
            },
          },
          required: ['preservedSummary', 'recipe'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.recipe) {
      parsed.recipe.id = `recipe_${Date.now()}`;
    }
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error tweaking recipe:', error);
    return res.status(500).json({ error: error.message || '換菜微調失敗' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FreshMatch Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
