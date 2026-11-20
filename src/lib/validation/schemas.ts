import { z } from 'zod';

export const userProfileSchema = z.enum([
  'general',
  'children',
  'elderly',
  'respiratory',
  'outdoor_worker',
  'athlete',
]);

export const geocodeQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Search query must be at least 2 characters.')
    .max(100, 'Search query must be 100 characters or fewer.')
    .regex(/^[\p{L}\p{N}\s,.'-]+$/u, 'Search query contains unsupported characters.'),
});

export const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export const aqiQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  name: z.string().trim().min(1).max(120).optional(),
  country: z.string().trim().max(80).optional(),
  countryCode: z.string().trim().max(10).optional(),
  admin1: z.string().trim().max(80).optional(),
  timezone: z.string().trim().max(64).optional(),
});

const pollutantContextSchema = z.object({
  id: z.enum(['pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co']),
  formula: z.string().max(16),
  value: z.number().nullable(),
  unit: z.string().max(16),
  subIndex: z.number().nullable(),
  statusLabel: z.string().max(40),
  standardThreshold: z.number().positive(),
  standardName: z.string().max(80),
});

const timeWindowContextSchema = z
  .object({
    label: z.string().max(40),
    avgAqi: z.number().min(0).max(500),
  })
  .nullable();

export const chatContextSchema = z.object({
  cityName: z.string().trim().min(1).max(120),
  country: z.string().trim().max(80),
  fetchedAt: z.string().max(60),
  usAqi: z.number().min(0).max(500),
  europeanAqi: z.number().min(0).max(500).nullable(),
  categoryLabel: z.string().max(60),
  dominantPollutant: z.string().max(20).nullable(),
  pollutants: z.array(pollutantContextSchema).max(6),
  min24hAqi: z.number().min(0).max(500).nullable(),
  max24hAqi: z.number().min(0).max(500).nullable(),
  avg24hAqi: z.number().min(0).max(500).nullable(),
  bestWindow: timeWindowContextSchema,
  worstWindow: timeWindowContextSchema,
  advisoryHeadline: z.string().max(240),
  maskGuidance: z.string().max(240),
  exerciseAdvice: z.string().max(240),
  ventilationAdvice: z.string().max(240),
});

export const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please enter a question.')
    .max(500, 'Question must be 500 characters or fewer.'),
  profile: userProfileSchema,
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(1200),
      }),
    )
    .max(10)
    .default([]),
  context: chatContextSchema,
});

export type GeocodeQueryInput = z.infer<typeof geocodeQuerySchema>;
export type AqiQueryInput = z.infer<typeof aqiQuerySchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
