import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Store, DollarSign, Clock, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

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
          <div className="grid gap-6 md:grid-cols-2" data-testid="businesses-list">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
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
