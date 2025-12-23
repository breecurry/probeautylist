import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plus, RefreshCw, ChevronLeft, ChevronRight, Clock, ExternalLink, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  description?: string;
  htmlLink?: string;
}

interface Booking {
  id: string;
  serviceName: string;
  date: string;
  businessId: string;
  status: string;
}

interface Business {
  id: string;
  name: string;
  services: string;
}

export function BookingsCalendar({ bookings = [] }: { bookings?: Booking[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createBookingDialogOpen, setCreateBookingDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("10:00");
  const [newBookingService, setNewBookingService] = useState("");
  const [newBookingPrice, setNewBookingPrice] = useState("");
  const [newBookingTime, setNewBookingTime] = useState("10:00");
  const [newBookingNotes, setNewBookingNotes] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isBusinessOwner = user?.role === 'business_owner' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const { data: userBusinesses = [] } = useQuery<Business[]>({
    queryKey: ["/api/my-businesses"],
    queryFn: async () => {
      const res = await fetch("/api/my-businesses", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isBusinessOwner,
  });

  useEffect(() => {
    if (userBusinesses.length === 1 && !selectedBusinessId) {
      setSelectedBusinessId(userBusinesses[0].id);
    }
  }, [userBusinesses, selectedBusinessId]);

  const { data: calendarEvents = [], isLoading: eventsLoading, error: eventsError, refetch } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events", currentMonth.toISOString()],
    queryFn: async () => {
      const timeMin = startOfMonth(currentMonth).toISOString();
      const timeMax = endOfMonth(currentMonth).toISOString();
      const res = await fetch(`/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to fetch events" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    retry: false,
    enabled: isAdmin,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: { title: string; date: string }) => {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to create event" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "Your event has been added to Google Calendar.",
      });
      setCreateDialogOpen(false);
      setNewEventTitle("");
      setSelectedDate(null);
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/calendar/sync-booking/${bookingId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to sync booking" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Synced",
        description: "Your booking has been added to Google Calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to delete event" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "The event has been removed from Google Calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: { businessId: string; serviceName: string; servicePrice: string; date: string; notes?: string }) => {
      const res = await fetch(`/api/businesses/${data.businessId}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to create booking" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Added",
        description: "The appointment has been added to your calendar.",
      });
      setCreateBookingDialogOpen(false);
      setNewBookingService("");
      setNewBookingPrice("");
      setNewBookingNotes("");
      setSelectedDate(null);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateBooking = () => {
    if (!selectedDate || !newBookingService.trim() || !newBookingPrice.trim() || !selectedBusinessId) return;
    
    const [hours, minutes] = newBookingTime.split(':').map(Number);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(hours, minutes, 0, 0);

    createBookingMutation.mutate({
      businessId: selectedBusinessId,
      serviceName: newBookingService,
      servicePrice: newBookingPrice,
      date: bookingDate.toISOString(),
      notes: newBookingNotes || undefined,
    });
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPadding = monthStart.getDay();
  const paddedDays = Array(startPadding).fill(null).concat(daysInMonth);

  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter((event) => {
      const eventDate = event.start?.dateTime || event.start?.date;
      if (!eventDate) return false;
      return isSameDay(parseISO(eventDate), day);
    });
  };

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking) => {
      return isSameDay(new Date(booking.date), day);
    });
  };

  const handleCreateEvent = () => {
    if (!selectedDate || !newEventTitle.trim()) return;
    
    const [hours, minutes] = newEventTime.split(':').map(Number);
    const eventDate = new Date(selectedDate);
    eventDate.setHours(hours, minutes, 0, 0);

    createEventMutation.mutate({
      title: newEventTitle,
      date: eventDate.toISOString(),
    });
  };

  const isCalendarConnected = isAdmin ? !eventsError : true;

  return (
    <Card className="border-stone-100 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-amber-700 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={eventsLoading}
                data-testid="button-refresh-calendar"
              >
                <RefreshCw className={`h-4 w-4 ${eventsLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {isAdmin && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-amber-600 to-amber-600"
                    disabled={!isCalendarConnected}
                    data-testid="button-add-event"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Event
                  </Button>
                </DialogTrigger>
              <DialogContent data-testid="create-event-dialog">
                <DialogHeader>
                  <DialogTitle className="text-amber-700">Create Calendar Event</DialogTitle>
                  <DialogDescription>
                    Add a new event to your Google Calendar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-title">Event Title</Label>
                    <Input
                      id="event-title"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="e.g., Hair Appointment"
                      data-testid="input-event-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                      data-testid="input-event-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-time">Time</Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      data-testid="input-event-time"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateEvent}
                    disabled={!selectedDate || !newEventTitle.trim() || createEventMutation.isPending}
                    className="bg-gradient-to-r from-amber-600 to-amber-600"
                    data-testid="button-create-event"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isCalendarConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-amber-700 text-sm">
              Connect your Google Calendar to sync bookings and create events.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold text-stone-700" data-testid="calendar-month-title">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-stone-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {paddedDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayEvents = getEventsForDay(day);
            const dayBookings = getBookingsForDay(day);
            const isToday = isSameDay(day, new Date());
            const hasEvents = dayEvents.length > 0 || dayBookings.length > 0;

            return (
              <Dialog key={day.toISOString()}>
                <DialogTrigger asChild>
                  <button
                    className={`aspect-square p-1 text-sm rounded-lg transition-colors relative
                      ${isToday ? 'bg-amber-100 font-bold text-amber-700' : 'hover:bg-stone-100'}
                      ${!isSameMonth(day, currentMonth) ? 'text-stone-300' : 'text-stone-700'}
                    `}
                    data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasEvents && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {dayEvents.length > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                        {dayBookings.length > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        )}
                      </div>
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md" data-testid={`day-details-${format(day, 'yyyy-MM-dd')}`}>
                  <DialogHeader>
                    <DialogTitle className="text-amber-700">
                      {format(day, "EEEE, MMMM d, yyyy")}
                    </DialogTitle>
                    <DialogDescription>
                      {dayEvents.length + dayBookings.length} event(s)
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-80">
                    <div className="space-y-3 py-4">
                      {dayBookings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-amber-600">Bookings</h4>
                          {dayBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100"
                            >
                              <div>
                                <p className="font-medium text-sm">{booking.serviceName}</p>
                                <p className="text-xs text-stone-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(booking.date), "h:mm a")}
                                </p>
                              </div>
                              {isCalendarConnected && isBusinessOwner && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => syncBookingMutation.mutate(booking.id)}
                                  disabled={syncBookingMutation.isPending}
                                  data-testid={`button-sync-booking-${booking.id}`}
                                >
                                  <RefreshCw className={`h-3 w-3 mr-1 ${syncBookingMutation.isPending ? 'animate-spin' : ''}`} />
                                  Sync
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {isAdmin && dayEvents.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-blue-600">Google Calendar</h4>
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100"
                            >
                              <div>
                                <p className="font-medium text-sm">{event.summary || "Untitled Event"}</p>
                                {event.start?.dateTime && (
                                  <p className="text-xs text-stone-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(parseISO(event.start.dateTime), "h:mm a")}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {event.htmlLink && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(event.htmlLink, '_blank')}
                                    data-testid={`button-open-event-${event.id}`}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteEventMutation.mutate(event.id)}
                                  disabled={deleteEventMutation.isPending}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  data-testid={`button-delete-event-${event.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {dayEvents.length === 0 && dayBookings.length === 0 && (
                        <p className="text-center text-stone-500 text-sm py-4">
                          No events on this day
                        </p>
                      )}
                    </div>
                  </ScrollArea>

                  {isBusinessOwner && userBusinesses.length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setSelectedDate(day);
                          if (userBusinesses.length === 1) {
                            setSelectedBusinessId(userBusinesses[0].id);
                          }
                          setCreateBookingDialogOpen(true);
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        data-testid={`button-add-appointment-${format(day, 'yyyy-MM-dd')}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Appointment
                      </Button>
                      {isAdmin && isCalendarConnected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDate(day);
                            setCreateDialogOpen(true);
                          }}
                          className="w-full"
                          data-testid={`button-add-event-${format(day, 'yyyy-MM-dd')}`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Calendar Event
                        </Button>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Bookings</span>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Google Calendar</span>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={createBookingDialogOpen} onOpenChange={setCreateBookingDialogOpen}>
        <DialogContent data-testid="create-booking-dialog">
          <DialogHeader>
            <DialogTitle className="text-amber-700">Add Appointment</DialogTitle>
            <DialogDescription>
              Add a new appointment to your calendar for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "the selected day"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {userBusinesses.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="booking-business">Business</Label>
                <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                  <SelectTrigger data-testid="select-business">
                    <SelectValue placeholder="Select a business" />
                  </SelectTrigger>
                  <SelectContent>
                    {userBusinesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="booking-service">Service</Label>
              <Input
                id="booking-service"
                value={newBookingService}
                onChange={(e) => setNewBookingService(e.target.value)}
                placeholder="e.g., Haircut, Manicure, Massage"
                data-testid="input-booking-service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-price">Price ($)</Label>
              <Input
                id="booking-price"
                type="number"
                value={newBookingPrice}
                onChange={(e) => setNewBookingPrice(e.target.value)}
                placeholder="e.g., 50"
                data-testid="input-booking-price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-time">Time</Label>
              <Input
                id="booking-time"
                type="time"
                value={newBookingTime}
                onChange={(e) => setNewBookingTime(e.target.value)}
                data-testid="input-booking-time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-notes">Notes (optional)</Label>
              <Input
                id="booking-notes"
                value={newBookingNotes}
                onChange={(e) => setNewBookingNotes(e.target.value)}
                placeholder="e.g., Client name or special requests"
                data-testid="input-booking-notes"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBooking}
              disabled={!selectedDate || !newBookingService.trim() || !newBookingPrice.trim() || !selectedBusinessId || createBookingMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
              data-testid="button-create-booking"
            >
              {createBookingMutation.isPending ? "Adding..." : "Add Appointment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
