import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Gift, Users, Copy, Plus, Percent, Hash, Cake } from "lucide-react";

interface LoyaltyProgram {
  id?: string;
  businessId?: string;
  enabled: boolean;
  visitThreshold: number;
  discountPercent: number;
}

interface ReferralCode {
  id: string;
  businessId: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

interface BirthdayClient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
}

interface LoyaltySettingsProps {
  businessId: string;
  businessName: string;
}

export function LoyaltySettings({ businessId, businessName }: LoyaltySettingsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltyProgram>({
    enabled: false,
    visitThreshold: 10,
    discountPercent: 20,
  });

  const [newCode, setNewCode] = useState({
    code: "",
    discountPercent: 10,
    maxUses: "",
  });

  const { data: loyaltyProgram, isLoading: loadingLoyalty } = useQuery<LoyaltyProgram>({
    queryKey: ["/api/businesses", businessId, "loyalty"],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${businessId}/loyalty`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch loyalty program");
      return res.json();
    },
  });

  const { data: referralCodes = [], isLoading: loadingCodes } = useQuery<ReferralCode[]>({
    queryKey: ["/api/businesses", businessId, "referral-codes"],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${businessId}/referral-codes`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch referral codes");
      return res.json();
    },
  });

  const { data: birthdayClients = [] } = useQuery<BirthdayClient[]>({
    queryKey: ["/api/businesses", businessId, "birthdays"],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${businessId}/birthdays`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch birthdays");
      return res.json();
    },
  });

  useEffect(() => {
    if (loyaltyProgram) {
      setLoyaltySettings(loyaltyProgram);
    }
  }, [loyaltyProgram]);

  const saveLoyaltyMutation = useMutation({
    mutationFn: async (data: LoyaltyProgram) => {
      const res = await fetch(`/api/businesses/${businessId}/loyalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save loyalty settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", businessId, "loyalty"] });
      toast({
        title: "Loyalty program saved",
        description: "Your loyalty program settings have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save loyalty settings.",
        variant: "destructive",
      });
    },
  });

  const createCodeMutation = useMutation({
    mutationFn: async (data: { code: string; discountPercent: number; maxUses: number | null }) => {
      const res = await fetch(`/api/businesses/${businessId}/referral-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create referral code");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", businessId, "referral-codes"] });
      setNewCode({ code: "", discountPercent: 10, maxUses: "" });
      toast({
        title: "Referral code created",
        description: "Your new referral code is ready to share.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleCodeMutation = useMutation({
    mutationFn: async ({ codeId, active }: { codeId: string; active: boolean }) => {
      const res = await fetch(`/api/businesses/${businessId}/referral-codes/${codeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to update referral code");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", businessId, "referral-codes"] });
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Referral code "${code}" copied to clipboard.`,
    });
  };

  const handleSaveLoyalty = () => {
    saveLoyaltyMutation.mutate(loyaltySettings);
  };

  const handleCreateCode = () => {
    if (!newCode.code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a referral code.",
        variant: "destructive",
      });
      return;
    }
    createCodeMutation.mutate({
      code: newCode.code.toUpperCase().trim(),
      discountPercent: newCode.discountPercent,
      maxUses: newCode.maxUses ? parseInt(newCode.maxUses) : null,
    });
  };

  if (loadingLoyalty || loadingCodes) {
    return (
      <Card className="border-stone-100">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-stone-100 rounded w-1/3"></div>
            <div className="h-10 bg-stone-100 rounded"></div>
            <div className="h-10 bg-stone-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-stone-100 shadow-md" data-testid={`loyalty-card-${businessId}`}>
        <CardHeader className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Gift className="h-5 w-5" />
            Loyalty Program
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Reward repeat customers with discounts after a set number of visits
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={`loyalty-toggle-${businessId}`} className="text-base font-medium">
                Enable Loyalty Program
              </Label>
              <p className="text-sm text-muted-foreground">
                Clients earn rewards after completing visits
              </p>
            </div>
            <Switch
              id={`loyalty-toggle-${businessId}`}
              data-testid={`toggle-loyalty-${businessId}`}
              checked={loyaltySettings.enabled}
              onCheckedChange={(checked) =>
                setLoyaltySettings((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          {loyaltySettings.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-stone-200">
              <div className="space-y-2">
                <Label htmlFor={`visit-threshold-${businessId}`} className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-amber-600" />
                  Visits Required for Reward
                </Label>
                <Input
                  id={`visit-threshold-${businessId}`}
                  data-testid={`input-visit-threshold-${businessId}`}
                  type="number"
                  min="1"
                  value={loyaltySettings.visitThreshold}
                  onChange={(e) =>
                    setLoyaltySettings((prev) => ({
                      ...prev,
                      visitThreshold: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="max-w-[200px] border-stone-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`discount-percent-${businessId}`} className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-amber-600" />
                  Discount Percentage
                </Label>
                <Input
                  id={`discount-percent-${businessId}`}
                  data-testid={`input-discount-percent-${businessId}`}
                  type="number"
                  min="1"
                  max="100"
                  value={loyaltySettings.discountPercent}
                  onChange={(e) =>
                    setLoyaltySettings((prev) => ({
                      ...prev,
                      discountPercent: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="max-w-[200px] border-stone-200 focus:border-amber-500 focus:ring-amber-500"
                />
                <p className="text-xs text-muted-foreground">
                  Discount applied after {loyaltySettings.visitThreshold} visits
                </p>
              </div>
            </div>
          )}

          <Button
            data-testid={`button-save-loyalty-${businessId}`}
            onClick={handleSaveLoyalty}
            disabled={saveLoyaltyMutation.isPending}
            className="bg-gradient-to-r from-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-600"
          >
            {saveLoyaltyMutation.isPending ? "Saving..." : "Save Loyalty Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-stone-100 shadow-md" data-testid={`referral-card-${businessId}`}>
        <CardHeader className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Users className="h-5 w-5" />
            Referral Codes
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create unique codes for clients to share and earn rewards
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`new-code-${businessId}`}>Referral Code</Label>
                <Input
                  id={`new-code-${businessId}`}
                  data-testid={`input-new-code-${businessId}`}
                  placeholder="e.g., LUXE20"
                  value={newCode.code}
                  onChange={(e) =>
                    setNewCode((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  className="border-stone-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`new-discount-${businessId}`}>Discount %</Label>
                <Input
                  id={`new-discount-${businessId}`}
                  data-testid={`input-new-discount-${businessId}`}
                  type="number"
                  min="1"
                  max="100"
                  value={newCode.discountPercent}
                  onChange={(e) =>
                    setNewCode((prev) => ({ ...prev, discountPercent: parseInt(e.target.value) || 1 }))
                  }
                  className="border-stone-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`new-max-uses-${businessId}`}>Max Uses (empty = unlimited)</Label>
                <Input
                  id={`new-max-uses-${businessId}`}
                  data-testid={`input-new-max-uses-${businessId}`}
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={newCode.maxUses}
                  onChange={(e) => setNewCode((prev) => ({ ...prev, maxUses: e.target.value }))}
                  className="border-stone-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>
            <Button
              data-testid={`button-create-code-${businessId}`}
              onClick={handleCreateCode}
              disabled={createCodeMutation.isPending}
              className="bg-gradient-to-r from-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createCodeMutation.isPending ? "Creating..." : "Create Code"}
            </Button>
          </div>

          {referralCodes.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-amber-700">Active Codes</h4>
              <div className="space-y-2">
                {referralCodes.map((code) => (
                  <div
                    key={code.id}
                    data-testid={`referral-code-${code.id}`}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={code.active ? "default" : "secondary"}
                        className={code.active ? "bg-stone-500" : ""}
                      >
                        {code.code}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {code.discountPercent}% off
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {code.usedCount}/{code.maxUses || "∞"} uses
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-copy-code-${code.id}`}
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Switch
                        data-testid={`toggle-code-active-${code.id}`}
                        checked={code.active}
                        onCheckedChange={(active) =>
                          toggleCodeMutation.mutate({ codeId: code.id, active })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {birthdayClients.length > 0 && (
        <Card className="border-stone-100 shadow-md" data-testid={`birthdays-card-${businessId}`}>
          <CardHeader className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Cake className="h-5 w-5" />
              Upcoming Birthdays
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Clients with birthdays in the next 7 days
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              {birthdayClients.map((client) => (
                <div
                  key={client.id}
                  data-testid={`birthday-client-${client.id}`}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Cake className="h-4 w-4 text-amber-600" />
                    <span className="font-medium">
                      {client.firstName || ""} {client.lastName || ""}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {client.birthDate
                      ? new Date(client.birthDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
