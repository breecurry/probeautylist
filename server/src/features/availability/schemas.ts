import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

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

const availabilityExceptionObject = z.object({
  date: z.string().regex(datePattern, 'Use YYYY-MM-DD date format'),
  startTime: z.string().regex(timePattern, 'Use HH:MM 24-hour time').nullable().optional(),
  endTime: z.string().regex(timePattern, 'Use HH:MM 24-hour time').nullable().optional(),
  isBlocked: z.boolean().default(true),
  reason: z.string().trim().max(160).nullable().optional(),
});

export const availabilityExceptionSchema = availabilityExceptionObject.refine((exception) => {
  if (!exception.startTime && !exception.endTime) return true;
  if (!exception.startTime || !exception.endTime) return false;
  return exception.startTime < exception.endTime;
}, {
  message: 'Provide both start and end times, with start before end, or leave both blank for a full-day block',
  path: ['endTime'],
});

export const updateAvailabilityExceptionSchema = availabilityExceptionObject.partial().refine((exception) => {
  if (!exception.startTime && !exception.endTime) return true;
  if (!exception.startTime || !exception.endTime) return false;
  return exception.startTime < exception.endTime;
}, {
  message: 'Provide both start and end times, with start before end, or leave both blank for a full-day block',
  path: ['endTime'],
});

export type AvailabilityRuleInput = z.infer<typeof availabilityRuleObject>;
