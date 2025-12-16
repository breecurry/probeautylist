import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CalendarPlus, Clock, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

interface RebookingSuggestion {
  id: string;
  clientId: string;
  businessId: string;
  lastBookingId: string;
  serviceName: string;
  suggestedRebookDate: string;
  reminderSent: boolean;
  rebookingLink: string | null;
  createdAt: string;
  businessName: string;
  daysSinceBooking: number;
}

function RebookCard({ 
  suggestion, 
  onRebook 
}: { 
  suggestion: RebookingSuggestion;
  onRebook: (bookingId: string, date: Date) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const weeksSince = Math.floor(suggestion.daysSinceBooking / 7);

  const handleRebook = () => {
    if (selectedDate) {
      onRebook(suggestion.lastBookingId, selectedDate);
      setDialogOpen(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <>
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-stone-50/80 to-stone-100/80 rounded-lg border border-stone-100"
        data-testid={`rebooking-card-${suggestion.id}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-stone-100 rounded-full">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-amber-700" data-testid={`rebooking-service-${suggestion.id}`}>
              {suggestion.serviceName}
            </p>
            <p className="text-sm text-muted-foreground">
              at <span className="font-medium">{suggestion.businessName}</span>
            </p>
            <p className="text-sm text-amber-600 mt-1" data-testid={`rebooking-time-${suggestion.id}`}>
              {weeksSince > 0 
                ? `It's been ${weeksSince} week${weeksSince !== 1 ? 's' : ''} since your last visit`
                : `It's been ${suggestion.daysSinceBooking} day${suggestion.daysSinceBooking !== 1 ? 's' : ''} since your last visit`
              }
            </p>
          </div>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          data-testid={`button-rebook-${suggestion.id}`}
          className="bg-gradient-to-r from-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-600"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Book Again
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" data-testid="rebook-dialog">
          <DialogHeader>
            <DialogTitle className="text-amber-700 flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Rebook {suggestion.serviceName}
            </DialogTitle>
            <DialogDescription>
              Choose a date to book your {suggestion.serviceName} at {suggestion.businessName} again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < minDate}
              className="rounded-md border border-stone-100"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-testid="button-cancel-rebook"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRebook}
              disabled={!selectedDate}
              data-testid="button-confirm-rebook"
              className="bg-gradient-to-r from-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-600"
            >
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RebookingWidget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suggestions, isLoading, error } = useQuery<RebookingSuggestion[]>({
    queryKey: ["/api/clients/rebooking-suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/clients/rebooking-suggestions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch rebooking suggestions");
      return res.json();
    },
  });

  const rebookMutation = useMutation({
    mutationFn: async ({ bookingId, date }: { bookingId: string; date: Date }) => {
      const res = await fetch(`/api/bookings/quick-rebook/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date: date.toISOString() }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to rebook" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/rebooking-suggestions"] });
      toast({
        title: "Booking Requested!",
        description: "Your rebooking has been submitted. You'll receive a confirmation soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rebooking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRebook = (bookingId: string, date: Date) => {
    rebookMutation.mutate({ bookingId, date });
  };

  if (isLoading) {
    return (
      <Card className="border-stone-100 bg-gradient-to-r from-stone-50/30 to-stone-100/30 mb-6">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (error || !suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card 
      className="border-stone-200 bg-gradient-to-r from-stone-50/50 to-stone-100/50 mb-6 shadow-sm"
      data-testid="rebooking-widget"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-700 text-xl">
          <Calendar className="h-5 w-5 text-amber-600" />
          Time to Rebook?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on your booking history, you might be ready for these services again.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.slice(0, 3).map((suggestion) => (
          <RebookCard
            key={suggestion.id}
            suggestion={suggestion}
            onRebook={handleRebook}
          />
        ))}
        {suggestions.length > 3 && (
          <p className="text-sm text-muted-foreground text-center pt-2">
            And {suggestions.length - 3} more services due for rebooking...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
