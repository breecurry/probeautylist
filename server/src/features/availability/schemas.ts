import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const availabilityRuleObject = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(timePattern, 'Use HH:MM 24-hour time'),
  endTime: z.string().regex(timePattern, 'Use HH:MM 24-hour time'),
  isActive: z.boolean().default(true),
});

export const availabilityRuleSchema = availabilityRuleObject.refine((rule) => rule.startTime < rule.endTime, {
  message: 'Start time must be before end time',
  path: ['endTime'],
});

export const updateAvailabilityRuleSchema = availabilityRuleObject.partial().refine((rule) => {
  if (!rule.startTime || !rule.endTime) return true;
  return rule.startTime < rule.endTime;
}, {
  message: 'Start time must be before end time',
  path: ['endTime'],
});

export const replaceAvailabilityRulesSchema = z.object({
  rules: z.array(availabilityRuleSchema).max(21),
});

export type AvailabilityRuleInput = z.infer<typeof availabilityRuleObject>;
