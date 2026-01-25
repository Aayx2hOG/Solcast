import { z } from "zod";

const sanitizedString = (min: number, max: number) =>
    z.string()
        .min(min)
        .max(max)
        .trim()
        .refine(val => !/[<>{}]/.test(val), {
            message: "Contains forbidden characters",
        });

const positiveAmount = z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val > 0, {
        message: "Must be a positive number",
    })
    .refine((val) => val <= 1_000_000_000, {
        message: "Amount exceeds maximum allowed",
    });

const uuid = z.string().uuid({ message: "Invalid ID format" });

const walletAddress = z
    .string()
    .min(32)
    .max(44)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid wallet address format");

const txSignature = z
    .string()
    .min(87)
    .max(88)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid transaction signature");

export const TradeSchema = z
    .object({
        marketId: uuid,
        amount: positiveAmount,
        type: z.enum(["BUY", "SELL"]).transform((val) => val.toUpperCase()),
        shares: positiveAmount,
        price: positiveAmount.refine((val) => val <= 1, {
            message: "Price must be between 0 and 1 for prediction markets",
        }),
        txHash: txSignature.optional(),
    })
    .strict();

export const CreateMarketSchema = z
    .object({
        question: sanitizedString(10, 500),
        description: sanitizedString(20, 2000),
        category: z.union([
            z.enum(["SPORTS", "POLITICS", "CRYPTO", "ECONOMICS", "ENTERTAINMENT", "SCIENCE", "OTHER"]),
            z.string(),
            z.object({}).passthrough(),
        ]).transform((val) => {
            if (typeof val === 'object') {
                return Object.keys(val)[0]?.toUpperCase() || 'OTHER';
            }
            return typeof val === 'string' ? val.toUpperCase() : 'OTHER';
        }),
        endTimestamp: z.union([
            z.number(),
            z.string().datetime(),
            z.string().regex(/^\d+$/),
        ]).transform((val) => typeof val === 'number' ? val : parseInt(val)),
        resolutionTimestamp: z.union([
            z.number(),
            z.string().datetime(),
            z.string().regex(/^\d+$/),
        ]).transform((val) => typeof val === 'number' ? val : parseInt(val)),
        oracleSource: sanitizedString(1, 100),
        marketId: z.string().optional(),
    })
    .refine(
        (data) => data.resolutionTimestamp > data.endTimestamp,
        { message: "Resolution must be after end date" }
    );

export const LoginSchema = z.object({
    walletAddress: walletAddress,
}).strict();

export const OrderSchema = z
    .object({
        marketId: uuid,
        orderType: z.enum(["BUY", "SELL"]),
        outcome: z.enum(["YES", "NO"]),
        shares: positiveAmount,
        price: positiveAmount.refine((val) => val >= 0.01 && val <= 0.99, {
            message: "Price must be between 0.01 and 0.99",
        }),
    })
    .strict();

export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, errors: result.error.issues };
}

export type Trade = z.infer<typeof TradeSchema>;
export type CreateMarket = z.infer<typeof CreateMarketSchema>;
export type Order = z.infer<typeof OrderSchema>;