import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, User, Calendar } from "lucide-react";
import { format } from "date-fns";

interface CustomerReview {
  id: string;
  businessName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface CustomerProfileData {
  id: string;
  displayName: string;
  profilePhoto: string | null;
  reviews: CustomerReview[];
}

export default function CustomerProfile() {
  const params = useParams();
  const customerId = params.id;

  const { data: profile, isLoading, error } = useQuery<CustomerProfileData>({
    queryKey: ["customerProfile", customerId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${customerId}/profile`);
      if (!response.ok) {
        throw new Error("Failed to load profile");
      }
      return response.json();
    },
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container px-4 md:px-6 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading profile...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container px-4 md:px-6 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Profile Not Found</h1>
            <p className="text-muted-foreground">The customer profile you're looking for doesn't exist.</p>
            <Link href="/" className="text-primary hover:underline mt-4 inline-block">
              Go back home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 md:px-6 py-8">
        <div className="mb-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex flex-col items-center text-center space-y-4" data-testid="customer-profile-header">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg" data-testid="profile-avatar">
              {profile.profilePhoto ? (
                <AvatarImage src={profile.profilePhoto} alt={profile.displayName} data-testid="profile-photo" />
              ) : null}
              <AvatarFallback className="bg-gray-200" data-testid="profile-avatar-fallback">
                <User className="h-16 w-16 text-gray-400" />
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-3xl font-serif font-bold text-foreground" data-testid="profile-display-name">
              {profile.displayName}
            </h1>
          </div>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-6 text-center" data-testid="reviews-section-title">
              Reviews from Businesses
            </h2>

            {profile.reviews.length === 0 ? (
              <div className="text-center py-12 bg-stone-50/30 rounded-lg border border-dashed border-stone-200" data-testid="no-reviews-message">
                <p className="text-muted-foreground">No reviews yet.</p>
              </div>
            ) : (
              <div className="grid gap-4" data-testid="reviews-list">
                {profile.reviews.map((review) => (
                  <Card key={review.id} className="border-none bg-stone-50/30 shadow-sm" data-testid={`review-card-${review.id}`}>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-semibold text-foreground" data-testid={`review-business-name-${review.id}`}>
                            {review.businessName}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`review-date-${review.id}`}>
                          <Calendar className="h-3 w-3" />
                          {format(new Date(review.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      
                      <div className="flex mb-3" data-testid={`review-rating-${review.id}`}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      
                      <p className="text-sm text-muted-foreground" data-testid={`review-comment-${review.id}`}>
                        {review.comment}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
