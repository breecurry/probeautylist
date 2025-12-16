import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, Users, Clock, Calendar, Award, ArrowUpRight, Crown, Sparkles, Brain, RefreshCw, Lightbulb, UserMinus } from "lucide-react";

interface Business {
  id: string;
  name: string;
  tier: string;
}

interface Analytics {
  monthlyRevenue: { month: string; revenue: number }[];
  churnAlerts: { days30: number; days60: number; days90: number };
  peakHours: { hour: number; count: number }[];
  peakDays: { day: number; dayName: string; count: number }[];
  topServices: { serviceName: string; revenue: number; count: number }[];
  conversionRate: number;
}

interface AIGrowthInsights {
  reactivationCandidates: { clientName: string; lastVisit: string; daysSinceVisit: number }[];
  growthInsights: { insight: string; recommendation: string }[];
  bookingPatterns: { pattern: string; analysis: string }[];
  personalizedTips: string[];
  generatedAt: string;
}

const COLORS = ['#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'];
const AI_COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

export default function BusinessAnalytics() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: businesses, isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses/owner"],
    queryFn: async () => {
      const res = await fetch("/api/businesses");
      if (!res.ok) throw new Error("Failed to fetch businesses");
      const allBusinesses = await res.json();
      return allBusinesses.filter((b: Business & { ownerId: string }) => b.ownerId === user?.id);
    },
    enabled: !!user?.id,
  });

  const goldBusinesses = businesses?.filter(b => b.tier === 'gold') || [];

  useEffect(() => {
    if (goldBusinesses.length > 0 && !selectedBusinessId) {
      setSelectedBusinessId(goldBusinesses[0].id);
    }
  }, [goldBusinesses, selectedBusinessId]);

  const selectedBusiness = businesses?.find(b => b.id === selectedBusinessId);

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery<Analytics>({
    queryKey: ["/api/businesses", selectedBusinessId, "analytics"],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${selectedBusinessId}/analytics`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch analytics");
      }
      return res.json();
    },
    enabled: !!selectedBusinessId && selectedBusiness?.tier === 'gold',
  });

  const { data: aiInsights, isLoading: aiInsightsLoading } = useQuery<AIGrowthInsights | null>({
    queryKey: ["/api/businesses", selectedBusinessId, "ai-growth"],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${selectedBusinessId}/ai-growth`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch AI insights");
      }
      return res.json();
    },
    enabled: !!selectedBusinessId && selectedBusiness?.tier === 'gold',
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/businesses/${selectedBusinessId}/ai-growth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate AI insights");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", selectedBusinessId, "ai-growth"] });
    },
  });

  if (authLoading || businessesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50/50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  if (user?.role !== 'business_owner') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50/50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 text-teal-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Business Owners Only</h2>
              <p className="text-muted-foreground mb-4">
                Analytics are only available for business owners.
              </p>
              <Button onClick={() => setLocation("/onboarding?type=business")} data-testid="button-become-business-owner">
                Become a Business Owner
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50/50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-12 w-12 text-teal-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Businesses Found</h2>
              <p className="text-muted-foreground mb-4">
                Create a business to access analytics.
              </p>
              <Button onClick={() => setLocation("/onboarding?type=business")} data-testid="button-create-business">
                Create a Business
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (goldBusinesses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50/50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-6 text-center">
              <Crown className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Pro Premier Tier Required</h2>
              <p className="text-muted-foreground mb-4">
                Business Intelligence Dashboard is an exclusive feature for Pro Premier tier businesses.
                Upgrade to unlock powerful analytics and insights.
              </p>
              <Button 
                onClick={() => setLocation(`/profile/${businesses[0].id}`)} 
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                data-testid="button-upgrade-gold"
              >
                Upgrade to Pro Premier
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50/50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-analytics-title">Business Intelligence</h1>
            <p className="text-muted-foreground">Insights and analytics for your Pro Premier tier business</p>
          </div>
          
          {goldBusinesses.length > 1 && (
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="w-[250px]" data-testid="select-business">
                <SelectValue placeholder="Select a business" />
              </SelectTrigger>
              <SelectContent>
                {goldBusinesses.map((business) => (
                  <SelectItem key={business.id} value={business.id} data-testid={`select-business-${business.id}`}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
          </div>
        ) : analyticsError ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-red-500" data-testid="text-analytics-error">Failed to load analytics</p>
            </CardContent>
          </Card>
        ) : analytics ? (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card data-testid="card-conversion-rate">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-teal-600" data-testid="text-conversion-rate">
                    {analytics.conversionRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Completed vs Total Bookings</p>
                </CardContent>
              </Card>

              <Card data-testid="card-churn-30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    At Risk (30 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600" data-testid="text-churn-30">
                    {analytics.churnAlerts.days30}
                  </div>
                  <p className="text-xs text-muted-foreground">Clients inactive 30+ days</p>
                </CardContent>
              </Card>

              <Card data-testid="card-churn-60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    At Risk (60 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600" data-testid="text-churn-60">
                    {analytics.churnAlerts.days60}
                  </div>
                  <p className="text-xs text-muted-foreground">Clients inactive 60+ days</p>
                </CardContent>
              </Card>

              <Card data-testid="card-churn-90">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    At Risk (90 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600" data-testid="text-churn-90">
                    {analytics.churnAlerts.days90}
                  </div>
                  <p className="text-xs text-muted-foreground">Clients inactive 90+ days</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-revenue-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-teal-500" />
                    Revenue Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.monthlyRevenue.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#14b8a6" 
                          strokeWidth={2}
                          dot={{ fill: '#14b8a6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-top-services">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-teal-500" />
                    Top Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topServices.length > 0 ? (
                    <div className="flex flex-col lg:flex-row items-center gap-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={analytics.topServices}
                            dataKey="revenue"
                            nameKey="serviceName"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ serviceName }) => serviceName.substring(0, 15)}
                          >
                            {analytics.topServices.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No service data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-peak-hours">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-teal-500" />
                    Peak Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.peakHours.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.peakHours}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tickFormatter={formatHour} />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(hour: number) => formatHour(hour)}
                          formatter={(value: number) => [value, 'Bookings']}
                        />
                        <Bar dataKey="count" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No booking hour data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-peak-days">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-teal-500" />
                    Peak Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.peakDays.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.peakDays}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dayName" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [value, 'Bookings']} />
                        <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No booking day data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50" data-testid="card-ai-growth">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      AI Growth Autopilot
                    </span>
                  </CardTitle>
                  <Button
                    onClick={() => generateInsightsMutation.mutate()}
                    disabled={generateInsightsMutation.isPending}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    data-testid="button-refresh-insights"
                  >
                    {generateInsightsMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {aiInsights ? 'Refresh Insights' : 'Generate Insights'}
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  {generateInsightsMutation.isPending || aiInsightsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Brain className="h-12 w-12 text-violet-500 animate-pulse mb-4" />
                      <p className="text-violet-600 font-medium">AI is analyzing your business data...</p>
                      <p className="text-sm text-muted-foreground mt-1">This may take a few moments</p>
                    </div>
                  ) : aiInsights ? (
                    <div className="grid gap-6">
                      {aiInsights.generatedAt && (
                        <p className="text-xs text-muted-foreground">
                          Last generated: {new Date(aiInsights.generatedAt).toLocaleString()}
                        </p>
                      )}

                      {aiInsights.growthInsights.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-violet-800 mb-3 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Growth Insights
                          </h3>
                          <div className="grid gap-3">
                            {aiInsights.growthInsights.map((insight, index) => (
                              <Card key={index} className="border-violet-100 bg-white/80" data-testid={`card-insight-${index}`}>
                                <CardContent className="pt-4">
                                  <p className="font-medium text-violet-900">{insight.insight}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{insight.recommendation}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiInsights.reactivationCandidates.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-violet-800 mb-3 flex items-center gap-2">
                            <UserMinus className="h-4 w-4" />
                            Reactivation Candidates
                          </h3>
                          <Card className="border-violet-100 bg-white/80" data-testid="card-reactivation">
                            <CardContent className="pt-4">
                              <div className="space-y-2">
                                {aiInsights.reactivationCandidates.slice(0, 5).map((client, index) => (
                                  <div key={index} className="flex justify-between items-center py-2 border-b border-violet-50 last:border-0" data-testid={`row-client-${index}`}>
                                    <span className="font-medium">{client.clientName}</span>
                                    <span className="text-sm text-muted-foreground">
                                      Last visit: {client.lastVisit} ({client.daysSinceVisit} days ago)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {aiInsights.bookingPatterns.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-violet-800 mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Booking Patterns
                          </h3>
                          <div className="grid gap-3">
                            {aiInsights.bookingPatterns.map((pattern, index) => (
                              <Card key={index} className="border-violet-100 bg-white/80" data-testid={`card-pattern-${index}`}>
                                <CardContent className="pt-4">
                                  <p className="font-medium text-violet-900">{pattern.pattern}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{pattern.analysis}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiInsights.personalizedTips.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-violet-800 mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Personalized Tips
                          </h3>
                          <Card className="border-violet-100 bg-white/80" data-testid="card-tips">
                            <CardContent className="pt-4">
                              <ul className="space-y-2">
                                {aiInsights.personalizedTips.map((tip, index) => (
                                  <li key={index} className="flex items-start gap-2" data-testid={`tip-${index}`}>
                                    <span className="text-violet-500 mt-1">•</span>
                                    <span className="text-sm">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Brain className="h-12 w-12 text-violet-300 mb-4" />
                      <h3 className="font-semibold text-violet-800 mb-2">No AI Insights Generated Yet</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Click "Generate Insights" to let AI analyze your business data and provide personalized growth recommendations.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
