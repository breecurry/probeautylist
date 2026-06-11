import { z } from 'zod';
import { disputeStatuses } from '../../constants/domain.js';

export const createDisputeSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().min(10).max(2000),
});

export const updateDisputeSchema = z.object({
  status: z.enum(disputeStatuses),
  resolutionNote: z.string().trim().max(2000).optional().or(z.literal('')),
});
