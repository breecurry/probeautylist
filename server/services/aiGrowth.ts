import OpenAI from 'openai';
import { storage } from '../storage';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface AIGrowthInsights {
  reactivationCandidates: { clientName: string; lastVisit: string; daysSinceVisit: number }[];
  growthInsights: { insight: string; recommendation: string }[];
  bookingPatterns: { pattern: string; analysis: string }[];
  personalizedTips: string[];
  generatedAt: Date;
}

interface CachedInsights {
  data: AIGrowthInsights;
  expiresAt: number;
}

const insightsCache = new Map<string, CachedInsights>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function getCachedInsights(businessId: string): AIGrowthInsights | null {
  const cached = insightsCache.get(businessId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  if (cached) {
    insightsCache.delete(businessId);
  }
  return null;
}

export async function generateGrowthInsights(businessId: string): Promise<AIGrowthInsights> {
  const [inactiveClients, bookingsByWeekday, bookingsByHour, serviceMix, analytics] = await Promise.all([
    storage.getInactiveClients(businessId, 30),
    storage.getBookingsByWeekday(businessId),
    storage.getBookingsByHour(businessId),
    storage.getServiceRevenueMix(businessId),
    storage.getBusinessAnalytics(businessId),
  ]);

  const reactivationCandidates = inactiveClients.map(c => ({
    clientName: c.clientName,
    lastVisit: c.lastVisit.toISOString().split('T')[0],
    daysSinceVisit: c.daysSinceVisit,
  }));

  const businessDataPrompt = `
You are an AI business growth consultant for a beauty/salon business. Analyze the following data and provide actionable insights.

BOOKING PATTERNS BY DAY:
${bookingsByWeekday.map(d => `${d.dayName}: ${d.count} bookings`).join('\n') || 'No data available'}

BOOKING PATTERNS BY HOUR:
${bookingsByHour.map(h => `${h.hour}:00 - ${h.count} bookings`).join('\n') || 'No data available'}

SERVICE REVENUE MIX:
${serviceMix.map(s => `${s.serviceName}: $${s.revenue.toFixed(2)} (${s.percentage.toFixed(1)}%)`).join('\n') || 'No data available'}

TOP SERVICES:
${analytics.topServices.map(s => `${s.serviceName}: $${s.revenue.toFixed(2)} revenue, ${s.count} bookings`).join('\n') || 'No data available'}

CHURN ALERTS:
- Clients inactive 30+ days: ${analytics.churnAlerts.days30}
- Clients inactive 60+ days: ${analytics.churnAlerts.days60}
- Clients inactive 90+ days: ${analytics.churnAlerts.days90}

CONVERSION RATE: ${analytics.conversionRate.toFixed(1)}%

INACTIVE CLIENTS (haven't booked in 30+ days):
${inactiveClients.slice(0, 5).map(c => `${c.clientName}: Last visited ${c.daysSinceVisit} days ago`).join('\n') || 'No inactive clients'}

Based on this data, provide a JSON response with the following structure:
{
  "growthInsights": [
    { "insight": "Brief observation about the data", "recommendation": "Specific actionable recommendation" }
  ],
  "bookingPatterns": [
    { "pattern": "Pattern observed", "analysis": "What this means and how to capitalize on it" }
  ],
  "personalizedTips": [
    "Actionable tip 1",
    "Actionable tip 2",
    "Actionable tip 3"
  ]
}

Provide 3-4 growth insights, 2-3 booking patterns, and 4-5 personalized tips. Focus on:
1. Revenue optimization opportunities
2. Client retention strategies
3. Service mix optimization
4. Peak time utilization
5. Re-engagement strategies for inactive clients

Return ONLY valid JSON, no markdown or additional text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a business analytics AI that provides actionable growth insights for beauty and wellness businesses. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: businessDataPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const responseContent = completion.choices[0]?.message?.content || '{}';
    
    let parsedResponse: { growthInsights?: any[]; bookingPatterns?: any[]; personalizedTips?: string[] };
    try {
      const cleanedResponse = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch {
      parsedResponse = {
        growthInsights: [{ insight: 'Analysis complete', recommendation: 'Review your booking patterns and consider targeted marketing campaigns.' }],
        bookingPatterns: [{ pattern: 'Data collected', analysis: 'Continue gathering data for more detailed insights.' }],
        personalizedTips: ['Focus on client retention', 'Optimize your service offerings', 'Consider promotional campaigns'],
      };
    }

    const insights: AIGrowthInsights = {
      reactivationCandidates,
      growthInsights: parsedResponse.growthInsights || [],
      bookingPatterns: parsedResponse.bookingPatterns || [],
      personalizedTips: parsedResponse.personalizedTips || [],
      generatedAt: new Date(),
    };

    insightsCache.set(businessId, {
      data: insights,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return insights;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    const fallbackInsights: AIGrowthInsights = {
      reactivationCandidates,
      growthInsights: [
        { insight: 'Client retention opportunity', recommendation: 'Reach out to clients who haven\'t visited in over 30 days with a special offer.' },
        { insight: 'Service optimization', recommendation: 'Focus marketing efforts on your top-performing services to maximize revenue.' },
      ],
      bookingPatterns: [
        { pattern: 'Booking distribution', analysis: 'Analyze your peak hours and days to optimize staffing and appointment availability.' },
      ],
      personalizedTips: [
        'Send personalized reminders to inactive clients',
        'Create loyalty rewards for repeat customers',
        'Optimize your scheduling for peak demand hours',
        'Consider bundle packages for popular services',
      ],
      generatedAt: new Date(),
    };

    insightsCache.set(businessId, {
      data: fallbackInsights,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return fallbackInsights;
  }
}
