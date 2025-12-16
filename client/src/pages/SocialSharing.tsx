import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Share2, Crown, Instagram, Facebook, Twitter, Copy, Check, 
  Trash2, ExternalLink, Sparkles, Link2, Calendar
} from "lucide-react";
import { format } from "date-fns";

interface Business {
  id: string;
  name: string;
  tier: string;
  category: string;
}

interface SocialPost {
  id: string;
  businessId: string;
  content: string;
  imageUrl: string | null;
  sharedTo: string[];
  createdAt: string;
}

export default function SocialSharing() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [postContent, setPostContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: businesses, isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses/owner"],
    queryFn: async () => {
      const res = await fetch("/api/businesses");
      if (!res.ok) throw new Error("Failed to fetch businesses");
      const allBusinesses = await res.json();
      return allBusinesses.filter((b: Business & { ownerId: string }) => b.ownerId === user?.id);
    },
    enabled: !!user?.id,
  });

  const goldBusinesses = businesses?.filter(b => b.tier === 'gold') || [];

  useEffect(() => {
    if (goldBusinesses.length > 0 && !selectedBusinessId) {
      setSelectedBusinessId(goldBusinesses[0].id);
    }
  }, [goldBusinesses, selectedBusinessId]);

  const selectedBusiness = businesses?.find(b => b.id === selectedBusinessId);

  const { data: posts, isLoading: postsLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/businesses", selectedBusinessId, "social-posts"],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${selectedBusinessId}/social-posts`);
      if (!res.ok) throw new Error("Failed to fetch social posts");
      return res.json();
    },
    enabled: !!selectedBusinessId && selectedBusiness?.tier === 'gold',
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/businesses/${selectedBusinessId}/social-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", selectedBusinessId, "social-posts"] });
      setPostContent("");
      toast({ title: "Post created!", description: "Now share it to your social platforms." });
    },
  });

  const updateSharedToMutation = useMutation({
    mutationFn: async ({ postId, sharedTo }: { postId: string; sharedTo: string[] }) => {
      const res = await fetch(`/api/social-posts/${postId}/shared`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedTo }),
      });
      if (!res.ok) throw new Error("Failed to update post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", selectedBusinessId, "social-posts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/social-posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", selectedBusinessId, "social-posts"] });
      toast({ title: "Post deleted" });
    },
  });

  const getBusinessUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/search?business=${selectedBusinessId}`;
  };

  const generateShareUrl = (platform: string, post: SocialPost) => {
    const businessUrl = getBusinessUrl();
    const text = encodeURIComponent(`${post.content}\n\nBook now: ${businessUrl}`);
    const url = encodeURIComponent(businessUrl);
    
    switch (platform) {
      case 'instagram':
        return null;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${text}`;
      default:
        return null;
    }
  };

  const handleShare = async (platform: string, post: SocialPost) => {
    if (platform === 'instagram') {
      await navigator.clipboard.writeText(`${post.content}\n\nBook now: ${getBusinessUrl()}`);
      toast({ 
        title: "Text copied for Instagram!", 
        description: "Paste this in your Instagram post or story caption."
      });
    } else {
      const shareUrl = generateShareUrl(platform, post);
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    }
    
    const newSharedTo = [...(post.sharedTo || [])];
    if (!newSharedTo.includes(platform)) {
      newSharedTo.push(platform);
      updateSharedToMutation.mutate({ postId: post.id, sharedTo: newSharedTo });
    }
  };

  const copyBusinessLink = async () => {
    await navigator.clipboard.writeText(getBusinessUrl());
    setCopiedId("link");
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied!", description: "Share your booking link anywhere." });
  };

  if (authLoading || businessesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50/50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  if (user?.role !== 'business_owner') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50/50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Business Owner Access Only</h1>
          <p className="text-gray-600 mt-2">This feature is available to business owners.</p>
        </div>
      </div>
    );
  }

  if (goldBusinesses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50/50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="text-center">
              <Crown className="h-12 w-12 text-amber-500 mx-auto mb-2" />
              <CardTitle className="text-amber-900">Pro Premier Tier Required</CardTitle>
              <CardDescription className="text-amber-700">
                Social sharing is a premium feature available exclusively for Pro Premier tier businesses.
                Upgrade to Pro Premier to promote your services on social media.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setLocation("/my-businesses")} className="bg-amber-500 hover:bg-amber-600">
                Upgrade to Pro Premier
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50/50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2" data-testid="text-page-title">
                Social Sharing
                <Crown className="h-5 w-5 text-amber-500" />
              </h1>
              <p className="text-gray-600 text-sm">Share your business updates to social media</p>
            </div>
          </div>
          
          {goldBusinesses.length > 1 && (
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="w-[250px]" data-testid="select-business">
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                {goldBusinesses.map(b => (
                  <SelectItem key={b.id} value={b.id} data-testid={`option-business-${b.id}`}>
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      {b.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-teal-400" />
                  Create a Post
                </CardTitle>
                <CardDescription>
                  Write an update about your services, promotions, or availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="What would you like to share with your followers? Try: 'New appointments available this week! Book now for a fresh look.'"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="min-h-[120px]"
                  data-testid="input-post-content"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Your booking link will be automatically added when sharing
                  </p>
                  <Button
                    onClick={() => createPostMutation.mutate(postContent)}
                    disabled={!postContent.trim() || createPostMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700"
                    data-testid="button-create-post"
                  >
                    {createPostMutation.isPending ? "Creating..." : "Create Post"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Posts</h2>
              {postsLoading ? (
                <Card className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto" />
                </Card>
              ) : posts?.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                  <Share2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No posts yet. Create your first post above!</p>
                </Card>
              ) : (
                posts?.map(post => (
                  <Card key={post.id} className="overflow-hidden" data-testid={`card-post-${post.id}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-gray-900 whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
                          {post.content}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => deletePostMutation.mutate(post.id)}
                          data-testid={`button-delete-post-${post.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        {post.sharedTo?.length > 0 && (
                          <>
                            <span className="mx-1">•</span>
                            Shared to:
                            {post.sharedTo.map(platform => (
                              <Badge key={platform} variant="secondary" className="text-xs capitalize">
                                {platform}
                              </Badge>
                            ))}
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 hover:from-teal-600 hover:to-emerald-600"
                          onClick={() => handleShare('instagram', post)}
                          data-testid={`button-share-instagram-${post.id}`}
                        >
                          <Instagram className="h-4 w-4 mr-1" />
                          Instagram
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-600 text-white border-0 hover:bg-blue-700"
                          onClick={() => handleShare('facebook', post)}
                          data-testid={`button-share-facebook-${post.id}`}
                        >
                          <Facebook className="h-4 w-4 mr-1" />
                          Facebook
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-black text-white border-0 hover:bg-gray-800"
                          onClick={() => handleShare('twitter', post)}
                          data-testid={`button-share-twitter-${post.id}`}
                        >
                          <Twitter className="h-4 w-4 mr-1" />
                          X / Twitter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Link2 className="h-5 w-5" />
                  Your Booking Link
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Share this link anywhere for instant bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-3 mb-3">
                  <code className="text-xs text-gray-600 break-all" data-testid="text-booking-link">
                    {getBusinessUrl()}
                  </code>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={copyBusinessLink}
                  data-testid="button-copy-link"
                >
                  {copiedId === "link" ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-700">Tips for Great Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-2">
                  <span className="text-teal-400">•</span>
                  <p>Announce new services or seasonal promotions</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-teal-400">•</span>
                  <p>Share last-minute availability openings</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-teal-400">•</span>
                  <p>Post about special occasions and holiday hours</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-teal-400">•</span>
                  <p>Include a call-to-action like "Book now!"</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-stone-50 to-white">
              <CardContent className="pt-6 text-center">
                <Crown className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 mb-1">Pro Premier Member Benefit</p>
                <p className="text-xs text-gray-600">
                  Social sharing helps you reach more clients and fill your appointment book faster.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
