import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, CalendarIcon, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Guest {
  name: string;
  email: string;
  serviceName: string;
  servicePrice: string;
  notes: string;
}

interface GroupBookingDialogProps {
  businessId: string;
  businessName: string;
  services: { name: string; price: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupBookingDialog({ businessId, businessName, services, open, onOpenChange }: GroupBookingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [locationNote, setLocationNote] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [guests, setGuests] = useState<Guest[]>([
    { name: "", email: "", serviceName: "", servicePrice: "", notes: "" }
  ]);

  const addGuest = () => {
    setGuests([...guests, { name: "", email: "", serviceName: "", servicePrice: "", notes: "" }]);
  };

  const removeGuest = (index: number) => {
    if (guests.length > 1) {
      setGuests(guests.filter((_, i) => i !== index));
    }
  };

  const updateGuest = (index: number, field: keyof Guest, value: string) => {
    const updatedGuests = [...guests];
    updatedGuests[index][field] = value;
    if (field === "serviceName") {
      const service = services.find(s => s.name === value);
      if (service) {
        updatedGuests[index].servicePrice = service.price;
      }
    }
    setGuests(updatedGuests);
  };

  const totalPrice = guests.reduce((sum, guest) => {
    const price = parseFloat(guest.servicePrice.replace(/[^0-9.]/g, '')) || 0;
    return sum + price;
  }, 0);

  const createGroupBookingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/group-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessId,
          scheduledAt: date?.toISOString(),
          locationNote: locationNote || null,
          specialRequests: specialRequests || null,
          depositRequired: false,
          depositAmount: null,
          guests: guests.map(g => ({
            name: g.name,
            email: g.email || null,
            serviceName: g.serviceName,
            servicePrice: g.servicePrice,
            notes: g.notes || null,
          })),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create group booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-bookings"] });
      toast({
        title: "Group Booking Created!",
        description: `Your group booking for ${guests.length} guests has been submitted.`,
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setStep(1);
    setDate(undefined);
    setLocationNote("");
    setSpecialRequests("");
    setGuests([{ name: "", email: "", serviceName: "", servicePrice: "", notes: "" }]);
  };

  const canProceedStep1 = date !== undefined;
  const canProceedStep2 = guests.every(g => g.name && g.serviceName && g.servicePrice);
  const canSubmit = canProceedStep1 && canProceedStep2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="group-booking-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <Users className="w-5 h-5" />
            Group Booking - {businessName}
          </DialogTitle>
          <DialogDescription>
            Book an appointment for multiple guests (e.g., bridal parties, group events)
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 ${step > s ? "bg-amber-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium">Step 1: Select Date & Details</h3>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date()}
                className="rounded-md border"
                data-testid="group-booking-calendar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationNote">Location Notes (optional)</Label>
              <Input
                id="locationNote"
                data-testid="input-location-note"
                placeholder="e.g., Hotel room 205, Bride's house"
                value={locationNote}
                onChange={(e) => setLocationNote(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests (optional)</Label>
              <Textarea
                id="specialRequests"
                data-testid="input-special-requests"
                placeholder="Any special requirements or notes..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Step 2: Add Guests & Services</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addGuest}
                data-testid="button-add-guest"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Guest
              </Button>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {guests.map((guest, index) => (
                <Card key={index} className="border-stone-100">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="bg-stone-50 text-amber-700">
                        Guest {index + 1}
                      </Badge>
                      {guests.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGuest(index)}
                          data-testid={`button-remove-guest-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Name *</Label>
                        <Input
                          data-testid={`input-guest-name-${index}`}
                          placeholder="Guest name"
                          value={guest.name}
                          onChange={(e) => updateGuest(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <Input
                          data-testid={`input-guest-email-${index}`}
                          type="email"
                          placeholder="guest@email.com"
                          value={guest.email}
                          onChange={(e) => updateGuest(index, "email", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Service *</Label>
                      <Select
                        value={guest.serviceName}
                        onValueChange={(value) => updateGuest(index, "serviceName", value)}
                      >
                        <SelectTrigger data-testid={`select-guest-service-${index}`}>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.name} value={service.name}>
                              {service.name} - {service.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Notes</Label>
                      <Input
                        data-testid={`input-guest-notes-${index}`}
                        placeholder="Any specific requests for this guest"
                        value={guest.notes}
                        onChange={(e) => updateGuest(index, "notes", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium">Step 3: Review & Confirm</h3>
            
            <Card className="bg-stone-50/50 border-stone-100">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {date?.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Number of Guests</span>
                  <Badge>{guests.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Price</span>
                  <span className="font-bold text-lg text-amber-700">${totalPrice.toFixed(2)}</span>
                </div>
                {locationNote && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Location: {locationNote}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Guest Summary</h4>
              {guests.map((guest, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{guest.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">{guest.serviceName}</span>
                  </div>
                  <span className="text-amber-600 font-medium">{guest.servicePrice}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)}
              data-testid="button-previous-step"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              data-testid="button-next-step"
              className="bg-amber-600 hover:bg-amber-700"
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => createGroupBookingMutation.mutate()}
              disabled={!canSubmit || createGroupBookingMutation.isPending}
              data-testid="button-submit-group-booking"
              className="bg-gradient-to-r from-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-600"
            >
              {createGroupBookingMutation.isPending ? "Creating..." : "Confirm Group Booking"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
