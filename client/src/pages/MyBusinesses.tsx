import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Store, DollarSign, Clock, Save, Crown, Users, Bell, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { LoyaltySettings } from "@/components/LoyaltySettings";

interface Business {
  id: string;
  ownerId: string;
  name: string;
  serviceType: string;
  description: string;
  location: string;
  depositRequired: boolean;
  depositAmount: string | null;
  advanceNoticeHours: number;
  tier: string;
}

interface BusinessSettings {
  depositRequired: boolean;
  depositAmount: string;
  advanceNoticeHours: number;
}

function BusinessCard({ business }: { business: Business }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<BusinessSettings>({
    depositRequired: business.depositRequired,
    depositAmount: business.depositAmount || "0",
    advanceNoticeHours: business.advanceNoticeHours,
  });
  
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = 
      settings.depositRequired !== business.depositRequired ||
      settings.depositAmount !== (business.depositAmount || "0") ||
      settings.advanceNoticeHours !== business.advanceNoticeHours;
    setHasChanges(changed);
  }, [settings, business]);

  const updateMutation = useMutation({
    mutationFn: async (data: BusinessSettings) => {
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "Settings saved",
        description: "Your business deposit settings have been updated.",
      });
      setHasChanges(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  return (
    <Card 
      className="border-rose-100 shadow-md hover:shadow-lg transition-shadow"
      data-testid={`business-card-${business.id}`}
    >
      <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-rose-700">
          <Store className="h-5 w-5" />
          <span data-testid={`business-name-${business.id}`}>{business.name}</span>
          {business.tier === 'gold' && (
            <Badge className="bg-yellow-500 text-white" data-testid={`badge-gold-${business.id}`}>
              <Crown className="h-3 w-3 mr-1" />
              Gold
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{business.serviceType} • {business.location}</p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor={`deposit-toggle-${business.id}`} className="text-base font-medium">
              Require Deposit
            </Label>
            <p className="text-sm text-muted-foreground">
              Clients must pay a deposit when booking
            </p>
          </div>
          <Switch
            id={`deposit-toggle-${business.id}`}
            data-testid={`toggle-deposit-${business.id}`}
            checked={settings.depositRequired}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, depositRequired: checked }))
            }
          />
        </div>

        {settings.depositRequired && (
          <div className="space-y-4 pl-4 border-l-2 border-rose-200">
            <div className="space-y-2">
              <Label htmlFor={`deposit-amount-${business.id}`} className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-rose-500" />
                Deposit Amount ($)
              </Label>
              <Input
                id={`deposit-amount-${business.id}`}
                data-testid={`input-deposit-amount-${business.id}`}
                type="number"
                min="0"
                step="0.01"
                value={settings.depositAmount}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, depositAmount: e.target.value }))
                }
                className="max-w-[200px] border-rose-200 focus:border-rose-400 focus:ring-rose-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`advance-notice-${business.id}`} className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-500" />
                Advance Notice (hours)
              </Label>
              <Input
                id={`advance-notice-${business.id}`}
                data-testid={`input-advance-notice-${business.id}`}
                type="number"
                min="0"
                value={settings.advanceNoticeHours}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, advanceNoticeHours: parseInt(e.target.value) || 0 }))
                }
                className="max-w-[200px] border-rose-200 focus:border-rose-400 focus:ring-rose-400"
              />
              <p className="text-xs text-muted-foreground">
                How many hours in advance clients must book
              </p>
            </div>
          </div>
        )}

        {hasChanges && (
          <Button
            data-testid={`button-save-${business.id}`}
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface WaitlistEntry {
  id: string;
  clientId: string;
  businessId: string;
  serviceName: string;
  preferredDate: string | null;
  notified: boolean;
  bookedBookingId: string | null;
  createdAt: string;
  client?: {
    id: string;
    username: string;
    email: string;
  };
}

function BusinessWaitlistSection({ businessId, businessName }: { businessId: string; businessName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: waitlistEntries, isLoading, error } = useQuery<WaitlistEntry[]>({
    queryKey: [`/api/businesses/${businessId}/waitlist`],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${businessId}/waitlist`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch waitlist");
      return res.json();
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/waitlist/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove from waitlist");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/waitlist`] });
      toast({
        title: "Entry Removed",
        description: "The waitlist entry has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove waitlist entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card 
        className="border-blue-100 bg-gradient-to-r from-blue-50/30 to-indigo-50/30"
        data-testid={`waitlist-section-loading-${businessId}`}
      >
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (error || !waitlistEntries || waitlistEntries.length === 0) {
    return (
      <Card 
        className="border-blue-100 bg-gradient-to-r from-blue-50/30 to-indigo-50/30"
        data-testid={`waitlist-section-empty-${businessId}`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
            <Users className="h-5 w-5 text-blue-500" />
            Waitlist - {businessName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No clients on the waitlist yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shadow-sm"
      data-testid={`waitlist-section-${businessId}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
          <Users className="h-5 w-5 text-blue-500" />
          Waitlist - {businessName}
          <Badge 
            variant="secondary" 
            className="bg-blue-100 text-blue-700 ml-2"
            data-testid={`waitlist-count-${businessId}`}
          >
            {waitlistEntries.length} {waitlistEntries.length === 1 ? 'client' : 'clients'}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Clients waiting for availability at your business.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {waitlistEntries.map((entry) => (
          <div 
            key={entry.id}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-lg border border-blue-100"
            data-testid={`business-waitlist-entry-${entry.id}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p 
                  className="font-medium text-blue-700"
                  data-testid={`waitlist-entry-service-${entry.id}`}
                >
                  {entry.serviceName}
                </p>
                {entry.client && (
                  <p className="text-sm text-muted-foreground" data-testid={`waitlist-entry-client-${entry.id}`}>
                    Client: <span className="font-medium">{entry.client.username}</span>
                    {entry.client.email && (
                      <span className="text-xs ml-1">({entry.client.email})</span>
                    )}
                  </p>
                )}
                {entry.preferredDate && (
                  <p 
                    className="text-sm text-blue-600 mt-1 flex items-center gap-1"
                    data-testid={`waitlist-entry-date-${entry.id}`}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    Preferred: {format(new Date(entry.preferredDate), "PPP")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Joined: {format(new Date(entry.createdAt), "PPP")}
                </p>
                {entry.notified ? (
                  <Badge 
                    className="mt-2 bg-green-100 text-green-700 hover:bg-green-100"
                    data-testid={`waitlist-entry-notified-${entry.id}`}
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Notified
                  </Badge>
                ) : (
                  <Badge 
                    variant="secondary" 
                    className="mt-2 bg-blue-100 text-blue-700"
                    data-testid={`waitlist-entry-pending-${entry.id}`}
                  >
                    Waiting
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeMutation.mutate(entry.id)}
              disabled={removeMutation.isPending}
              data-testid={`button-remove-business-waitlist-${entry.id}`}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function MyBusinesses() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: businesses, isLoading, error } = useQuery<Business[]>({
    queryKey: ["/api/businesses", { ownerId: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/businesses?ownerId=${user?.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch businesses");
      return res.json();
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold font-serif text-rose-700"
            data-testid="page-title"
          >
            My Businesses
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your business deposit settings and booking requirements
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2" data-testid="loading-skeleton">
            {[1, 2].map((i) => (
              <Card key={i} className="border-rose-100">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-10 w-48" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50" data-testid="error-message">
            <CardContent className="p-6">
              <p className="text-red-600">Failed to load businesses. Please try again.</p>
            </CardContent>
          </Card>
        ) : businesses && businesses.length > 0 ? (
          <div className="space-y-8" data-testid="businesses-list">
            {businesses.map((business) => (
              <div key={business.id} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <BusinessCard business={business} />
                </div>
                
                {/* Waitlist Section */}
                <BusinessWaitlistSection businessId={business.id} businessName={business.name} />

                {business.tier === 'gold' && (
                  <div data-testid={`loyalty-section-${business.id}`}>
                    <h2 className="text-xl font-semibold text-rose-700 mb-4 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Loyalty & Referral Engine - {business.name}
                    </h2>
                    <LoyaltySettings businessId={business.id} businessName={business.name} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-rose-100" data-testid="no-businesses">
            <CardContent className="p-12 text-center">
              <Store className="h-12 w-12 text-rose-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-rose-700 mb-2">No Businesses Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any businesses. Start by registering your first business.
              </p>
              <Button 
                data-testid="button-create-business"
                onClick={() => setLocation("/onboarding?type=business")}
                className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500"
              >
                Create Your First Business
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
