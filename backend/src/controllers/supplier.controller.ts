import 'dotenv/config';
import { Request, Response } from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { db } from '../prisma/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Ordered list of valid free-tier text-out models with active quota on your project
const FREE_TIER_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
];

export const parseSupplierSheet = async (req: Request, res: Response) => {
  try {
    const { rateSheetText, fileBase64, mimeType, applyUpdates } = req.body;

    if (!rateSheetText && !fileBase64) {
      return res.status(400).json({
        reason: 'Provide either rateSheetText or fileBase64 + mimeType',
      });
    }

    const prompt =
      'Extract all product SKUs, names, Minimum Order Quantities (MOQ), and delivery lead times (in days) from this supplier rate sheet.';

    const parts: any[] = [prompt];
    if (rateSheetText) {
      parts.push(rateSheetText);
    }
    if (fileBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType,
        },
      });
    }

    let parsedItems: any[] | null = null;
    let usedModel = '';
    const failedModels: { model: string; status: number }[] = [];

    for (const modelName of FREE_TIER_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.ARRAY,
              description: 'List of parsed supplier items with MOQ and lead time',
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  sku: { type: SchemaType.STRING, description: 'Product SKU code' },
                  name: { type: SchemaType.STRING, description: 'Product name' },
                  moq: {
                    type: SchemaType.INTEGER,
                    description: 'Minimum Order Quantity (units per crate/order)',
                  },
                  lead_time_days: {
                    type: SchemaType.INTEGER,
                    description: 'Delivery lead time in days',
                  },
                },
                required: ['sku', 'name', 'moq', 'lead_time_days'],
              },
            },
          },
        });

        const aiResponse = await model.generateContent(parts);
        parsedItems = JSON.parse(aiResponse.response.text());
        usedModel = modelName;
        break; // Stop as soon as one model succeeds
      } catch (err: any) {
        const status = err?.status || 500;
        failedModels.push({ model: modelName, status });
        // If rate-limited (429), overloaded (503), or unavailable (404), try the next model
        if (status === 429 || status === 503 || status === 404) {
          continue;
        }
        throw err;
      }
    }

    // All 3 free-tier models exhausted/rate-limited
    if (!parsedItems) {
      return res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        reason:
          'All AI models (Gemini 3.8 Flash, 3.1 Flash Lite, and 2.5 Flash Lite) have exceeded their free-tier rate limit. Please try again after 1 minute (for RPM reset) or after 24 hours (if daily RPD quota is full).',
        retryAfterHint: '1 minute (RPM) or 24 hours (RPD)',
        attemptedModels: failedModels,
      });
    }

    const updatedProducts = [];
    if (applyUpdates) {
      for (const item of parsedItems) {
        const existing = await db.orm.public.Product.where({
          sku: item.sku,
        }).first();

        if (existing) {
          await db.orm.public.Product.where({ id: existing.id }).update({
            moq: item.moq,
            lead_time_days: item.lead_time_days,
          });
          updatedProducts.push({
            sku: item.sku,
            moq: item.moq,
            lead_time_days: item.lead_time_days,
          });
        }
      }
    }

    return res.status(200).json({
      model: usedModel,
      extracted: parsedItems,
      updatedProducts,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      reason: 'Failed to parse supplier rate sheet',
    });
  }
};