import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, DollarSign, Star, CheckCircle, Clock, XCircle, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { RebookingWidget } from "@/components/RebookingWidget";
import { WaitlistWidget } from "@/components/WaitlistWidget";
import { GroupBookingsWidget } from "@/components/GroupBookingsWidget";
import { InspirationBoard } from "@/components/InspirationBoard";

interface Booking {
  id: string;
  clientId: string;
  businessId: string;
  serviceName: string;
  servicePrice: string;
  date: string;
  status: string;
  completedByBusiness: boolean;
  depositPaid: boolean;
  depositAmount: string | null;
  priority: boolean;
  noShow: boolean;
}

interface Business {
  id: string;
  name: string;
}

interface ClientReview {
  id: string;
  bookingId: string;
  businessId: string;
  clientId: string;
  rating: number;
  comment: string;
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
    no_show: { 
      className: "bg-orange-100 text-orange-700 border-orange-200", 
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

function StarRating({ 
  rating, 
  onRatingChange 
}: { 
  rating: number; 
  onRatingChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-1" data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          data-testid={`star-${star}`}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300 hover:text-yellow-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewClientDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const reviewMutation = useMutation({
    mutationFn: async (data: { bookingId: string; businessId: string; clientId: string; rating: number; comment: string }) => {
      const res = await fetch("/api/client-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to submit review" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "Review submitted",
        description: "Your client review has been saved.",
      });
      onOpenChange(false);
      setRating(5);
      setComment("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!comment.trim()) {
      toast({
        title: "Error",
        description: "Please add a comment for your review.",
        variant: "destructive",
      });
      return;
    }

    reviewMutation.mutate({
      bookingId: booking.id,
      businessId: booking.businessId,
      clientId: booking.clientId,
      rating,
      comment,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="review-dialog">
        <DialogHeader>
          <DialogTitle className="text-rose-700">Review Client</DialogTitle>
          <DialogDescription>
            Share your experience with this client for the {booking.serviceName} service.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              data-testid="input-review-comment"
              placeholder="Share your experience with this client..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] border-rose-200 focus:border-rose-400 focus:ring-rose-400"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-review"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reviewMutation.isPending}
            data-testid="button-submit-review"
            className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500"
          >
            {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookingCard({ 
  booking, 
  isBusinessOwner,
  clientReviews,
  businessName,
}: { 
  booking: Booking; 
  isBusinessOwner: boolean;
  clientReviews: ClientReview[];
  businessName?: string;
}) {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  
  const hasClientReview = clientReviews.some(r => r.bookingId === booking.id);
  const canReviewClient = isBusinessOwner && booking.completedByBusiness && !hasClientReview;

  return (
    <>
      <Card 
        className={`shadow-sm hover:shadow-md transition-shadow ${
          booking.priority 
            ? "border-amber-200 bg-gradient-to-r from-amber-50/30 to-white" 
            : "border-rose-100"
        }`}
        data-testid={`booking-card-${booking.id}`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 
                  className="font-semibold text-rose-700"
                  data-testid={`booking-service-${booking.id}`}
                >
                  {booking.serviceName}
                </h3>
                <StatusBadge status={booking.status} />
              </div>
              {businessName && (
                <p className="text-sm text-muted-foreground">at {businessName}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span data-testid={`booking-date-${booking.id}`}>
                    {format(new Date(booking.date), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span data-testid={`booking-price-${booking.id}`}>
                    ${booking.servicePrice}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {booking.depositPaid ? (
                  <Badge 
                    variant="outline" 
                    className="bg-green-50 text-green-700 border-green-200"
                    data-testid={`deposit-paid-${booking.id}`}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Deposit Paid ${booking.depositAmount || "0"}
                  </Badge>
                ) : booking.depositAmount && parseFloat(booking.depositAmount) > 0 ? (
                  <Badge 
                    variant="outline" 
                    className="bg-yellow-50 text-yellow-700 border-yellow-200"
                    data-testid={`deposit-pending-${booking.id}`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Deposit Required ${booking.depositAmount}
                  </Badge>
                ) : null}
                {booking.completedByBusiness && (
                  <Badge 
                    variant="outline" 
                    className="bg-rose-50 text-rose-700 border-rose-200"
                    data-testid={`completed-badge-${booking.id}`}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {booking.priority && (
                  <Badge 
                    variant="outline" 
                    className="bg-amber-50 text-amber-700 border-amber-200"
                    data-testid={`priority-badge-${booking.id}`}
                  >
                    <Crown className="h-3 w-3 mr-1 fill-amber-500" />
                    Priority
                  </Badge>
                )}
              </div>
            </div>
            
            {canReviewClient && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewDialogOpen(true)}
                data-testid={`button-review-client-${booking.id}`}
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                <Star className="h-4 w-4 mr-1" />
                Review Client
              </Button>
            )}
            
            {hasClientReview && (
              <Badge 
                variant="outline" 
                className="bg-purple-50 text-purple-700 border-purple-200"
                data-testid={`reviewed-badge-${booking.id}`}
              >
                <Star className="h-3 w-3 mr-1 fill-purple-500" />
                Client Reviewed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      <ReviewClientDialog
        booking={booking}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
      />
    </>
  );
}

export default function Bookings() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const isBusinessOwner = user?.role === "business_owner";

  const { data: userBookings, isLoading: bookingsLoading, error: bookingsError } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const res = await fetch("/api/bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
    enabled: !!user && !isBusinessOwner,
  });

  const { data: businesses } = useQuery<Business[]>({
    queryKey: ["/api/businesses", { ownerId: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/businesses?ownerId=${user?.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch businesses");
      return res.json();
    },
    enabled: !!user?.id && isBusinessOwner,
  });

  const { data: businessBookings, isLoading: businessBookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/businesses/bookings", businesses?.map(b => b.id)],
    queryFn: async () => {
      if (!businesses || businesses.length === 0) return [];
      const allBookings: Booking[] = [];
      for (const business of businesses) {
        const res = await fetch(`/api/businesses/${business.id}/bookings`, {
          credentials: "include",
        });
        if (res.ok) {
          const bookings = await res.json();
          allBookings.push(...bookings);
        }
      }
      return allBookings;
    },
    enabled: !!businesses && businesses.length > 0 && isBusinessOwner,
  });

  const { data: clientReviews = [] } = useQuery<ClientReview[]>({
    queryKey: ["/api/client-reviews"],
    queryFn: async () => {
      if (!businesses || businesses.length === 0) return [];
      const allReviews: ClientReview[] = [];
      for (const business of businesses) {
        try {
          const res = await fetch(`/api/businesses/${business.id}/client-reviews`, {
            credentials: "include",
          });
          if (res.ok) {
            const reviews = await res.json();
            allReviews.push(...reviews);
          }
        } catch {
          // Ignore if endpoint doesn't exist
        }
      }
      return allReviews;
    },
    enabled: isBusinessOwner && !!businesses && businesses.length > 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const isLoading = authLoading || bookingsLoading || (isBusinessOwner && businessBookingsLoading);
  const bookings = isBusinessOwner ? businessBookings : userBookings;
  const error = bookingsError;

  const getBusinessName = (businessId: string) => {
    return businesses?.find(b => b.id === businessId)?.name;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
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
            {isBusinessOwner ? "Business Bookings" : "My Bookings"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isBusinessOwner 
              ? "View and manage bookings for your businesses" 
              : "View your upcoming and past appointments"}
          </p>
        </div>

        {!isBusinessOwner && (
          <>
            <InspirationBoard />
            <RebookingWidget />
            <WaitlistWidget />
            <GroupBookingsWidget />
          </>
        )}

        {isLoading ? (
          <div className="space-y-4" data-testid="loading-skeleton">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-rose-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50" data-testid="error-message">
            <CardContent className="p-6">
              <p className="text-red-600">Failed to load bookings. Please try again.</p>
            </CardContent>
          </Card>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-4" data-testid="bookings-list">
            {bookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                isBusinessOwner={isBusinessOwner}
                clientReviews={clientReviews}
                businessName={isBusinessOwner ? getBusinessName(booking.businessId) : undefined}
              />
            ))}
          </div>
        ) : (
          <Card className="border-rose-100" data-testid="no-bookings">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-rose-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-rose-700 mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-4">
                {isBusinessOwner 
                  ? "You don't have any bookings for your businesses yet." 
                  : "You haven't made any bookings yet. Find a professional and book your first appointment!"}
              </p>
              {!isBusinessOwner && (
                <Button 
                  data-testid="button-find-services"
                  onClick={() => setLocation("/search")}
                  className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500"
                >
                  Find Services
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
