import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Clock, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface WaitlistEntry {
  id: string;
  clientId: string;
  businessId: string;
  serviceName: string;
  preferredDate: string | null;
  notified: boolean;
  bookedBookingId: string | null;
  createdAt: string;
}

interface Business {
  id: string;
  name: string;
}

function WaitlistCard({ 
  entry, 
  businessName,
  onRemove 
}: { 
  entry: WaitlistEntry;
  businessName?: string;
  onRemove: (id: string) => void;
}) {
  return (
    <div 
      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-lg border border-blue-100"
      data-testid={`waitlist-card-${entry.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-full">
          <Bell className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-blue-700" data-testid={`waitlist-service-${entry.id}`}>
            {entry.serviceName}
          </p>
          {businessName && (
            <p className="text-sm text-muted-foreground">
              at <span className="font-medium">{businessName}</span>
            </p>
          )}
          {entry.preferredDate && (
            <p className="text-sm text-blue-600 mt-1" data-testid={`waitlist-date-${entry.id}`}>
              Preferred: {format(new Date(entry.preferredDate), "PPP")}
            </p>
          )}
          {entry.notified && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <Bell className="h-3 w-3" />
              Notified - a spot opened up!
            </p>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(entry.id)}
        data-testid={`button-remove-waitlist-${entry.id}`}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function WaitlistWidget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: waitlistEntries, isLoading, error } = useQuery<WaitlistEntry[]>({
    queryKey: ["/api/clients/waitlist"],
    queryFn: async () => {
      const res = await fetch("/api/clients/waitlist", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch waitlist");
      return res.json();
    },
  });

  const { data: businesses } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
    queryFn: async () => {
      const res = await fetch("/api/businesses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch businesses");
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
      queryClient.invalidateQueries({ queryKey: ["/api/clients/waitlist"] });
      toast({
        title: "Removed from Waitlist",
        description: "You've been removed from the waitlist.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from waitlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getBusinessName = (businessId: string) => {
    return businesses?.find(b => b.id === businessId)?.name;
  };

  if (isLoading) {
    return (
      <Card className="border-blue-100 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 mb-6">
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
    return null;
  }

  return (
    <Card 
      className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 mb-6 shadow-sm"
      data-testid="waitlist-widget"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-700 text-xl">
          <Users className="h-5 w-5 text-blue-500" />
          Your Waitlist
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          You'll be notified when a spot opens up at these businesses.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {waitlistEntries.map((entry) => (
          <WaitlistCard
            key={entry.id}
            entry={entry}
            businessName={getBusinessName(entry.businessId)}
            onRemove={(id) => removeMutation.mutate(id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
