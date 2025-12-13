import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, DollarSign, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface GroupBookingGuest {
  id: string;
  name: string;
  email: string | null;
  serviceName: string;
  servicePrice: string;
  notes: string | null;
}

interface GroupBooking {
  id: string;
  businessId: string;
  organizerId: string;
  scheduledAt: string;
  locationNote: string | null;
  specialRequests: string | null;
  totalPrice: string;
  depositRequired: boolean;
  depositAmount: string | null;
  depositPaid: boolean;
  status: string;
  createdAt: string;
  guests: GroupBookingGuest[];
}

interface Business {
  id: string;
  name: string;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; icon: React.ReactNode }> = {
    pending: { 
      className: "bg-yellow-100 text-yellow-700 border-yellow-200", 
      icon: <Clock className="h-3 w-3 mr-1" /> 
    },
    confirmed: { 
      className: "bg-blue-100 text-blue-700 border-blue-200", 
      icon: <CheckCircle className="h-3 w-3 mr-1" /> 
    },
    completed: { 
      className: "bg-green-100 text-green-700 border-green-200", 
      icon: <CheckCircle className="h-3 w-3 mr-1" /> 
    },
    cancelled: { 
      className: "bg-red-100 text-red-700 border-red-200", 
      icon: <XCircle className="h-3 w-3 mr-1" /> 
    },
  };

  const variant = variants[status] || variants.pending;

  return (
    <Badge variant="outline" className={`${variant.className} flex items-center`}>
      {variant.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function GroupBookingCard({ booking, businessName }: { booking: GroupBooking; businessName?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card 
      className="border-purple-100 hover:shadow-md transition-shadow"
      data-testid={`group-booking-card-${booking.id}`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-purple-700 font-semibold">
                  <Users className="h-4 w-4" />
                  Group Booking
                </div>
                <StatusBadge status={booking.status} />
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {booking.guests.length} Guests
                </Badge>
              </div>
              {businessName && (
                <p 
                  className="text-sm text-muted-foreground"
                  data-testid={`group-booking-business-${booking.id}`}
                >
                  at {businessName}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span data-testid={`group-booking-date-${booking.id}`}>
                    {format(new Date(booking.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span 
                    className="font-semibold text-purple-700"
                    data-testid={`group-booking-total-${booking.id}`}
                  >
                    ${booking.totalPrice}
                  </span>
                </span>
              </div>
              {booking.locationNote && (
                <p className="text-xs text-muted-foreground italic">
                  Location: {booking.locationNote}
                </p>
              )}
            </div>
            
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                data-testid={`button-expand-group-${booking.id}`}
              >
                {isOpen ? (
                  <>Hide Guests <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>View Guests <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div 
              className="mt-4 pt-4 border-t space-y-2"
              data-testid={`group-booking-guests-${booking.id}`}
            >
              <h4 className="text-sm font-medium text-muted-foreground">Guest Details</h4>
              {booking.guests.map((guest, index) => (
                <div 
                  key={guest.id} 
                  className="flex justify-between items-center p-2 bg-purple-50/50 rounded"
                  data-testid={`guest-row-${guest.id}`}
                >
                  <div>
                    <span className="font-medium">{guest.name}</span>
                    {guest.email && (
                      <span className="text-xs text-muted-foreground ml-2">({guest.email})</span>
                    )}
                    <p className="text-sm text-muted-foreground">{guest.serviceName}</p>
                    {guest.notes && (
                      <p className="text-xs text-muted-foreground italic">{guest.notes}</p>
                    )}
                  </div>
                  <span className="font-medium text-purple-600">{guest.servicePrice}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

export function GroupBookingsWidget() {
  const { data: groupBookings, isLoading, error } = useQuery<GroupBooking[]>({
    queryKey: ["/api/group-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/group-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch group bookings");
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

  const getBusinessName = (businessId: string) => {
    return businesses?.find(b => b.id === businessId)?.name;
  };

  if (isLoading) {
    return (
      <Card className="mb-6 border-purple-100" data-testid="group-bookings-loading">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (error || !groupBookings || groupBookings.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-purple-100 bg-gradient-to-r from-purple-50/50 to-pink-50/30" data-testid="group-bookings-widget">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Users className="h-5 w-5" />
          My Group Bookings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groupBookings.map((booking) => (
          <GroupBookingCard 
            key={booking.id} 
            booking={booking} 
            businessName={getBusinessName(booking.businessId)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
