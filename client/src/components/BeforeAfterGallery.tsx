import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Check, X, ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface BeforeAfterPhoto {
  id: string;
  bookingId: string;
  clientId: string;
  businessId: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  caption: string | null;
  approved: boolean;
  createdAt: string;
}

interface Booking {
  id: string;
  serviceName: string;
  date: string;
  completedByBusiness: boolean;
  businessId: string;
}

interface BeforeAfterGalleryProps {
  businessId: string;
  isOwner?: boolean;
  showUpload?: boolean;
}

function BeforeAfterSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg cursor-col-resize select-none">
      <div className="absolute inset-0">
        <img 
          src={afterUrl} 
          alt="After" 
          className="w-full h-full object-cover"
        />
      </div>
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeUrl} 
          alt="Before" 
          className="w-full h-full object-cover"
          style={{ width: `${10000 / sliderPosition}%`, maxWidth: 'none' }}
        />
      </div>
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={(e) => {
          const rect = e.currentTarget.parentElement?.getBoundingClientRect();
          if (!rect) return;
          
          const handleMove = (moveEvent: MouseEvent) => {
            const x = moveEvent.clientX - rect.left;
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            setSliderPosition(percentage);
          };
          
          const handleUp = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
          };
          
          document.addEventListener('mousemove', handleMove);
          document.addEventListener('mouseup', handleUp);
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-amber-600" />
          <ChevronRight className="w-4 h-4 text-amber-600" />
        </div>
      </div>
      <div className="absolute top-2 left-2 bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium">
        Before
      </div>
      <div className="absolute top-2 right-2 bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium">
        After
      </div>
    </div>
  );
}

function UploadDialog({ businessId, onSuccess }: { businessId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string>("");
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [caption, setCaption] = useState("");
  const { toast } = useToast();

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const completedBookings = bookings?.filter(
    (b) => b.completedByBusiness && b.businessId === businessId
  ) || [];

  const uploadMutation = useMutation({
    mutationFn: async (data: { bookingId: string; beforePhotoUrl: string; afterPhotoUrl: string; caption?: string }) => {
      return apiRequest("POST", `/api/bookings/${data.bookingId}/before-after`, {
        beforePhotoUrl: data.beforePhotoUrl,
        afterPhotoUrl: data.afterPhotoUrl,
        caption: data.caption,
      });
    },
    onSuccess: () => {
      toast({
        title: "Photos Uploaded",
        description: "Your before/after photos have been submitted for approval.",
      });
      setOpen(false);
      setSelectedBooking("");
      setBeforeUrl("");
      setAfterUrl("");
      setCaption("");
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photos",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !beforeUrl || !afterUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate({
      bookingId: selectedBooking,
      beforePhotoUrl: beforeUrl,
      afterPhotoUrl: afterUrl,
      caption: caption || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-stone-200 text-amber-600 hover:bg-stone-50" data-testid="button-upload-before-after">
          <Camera className="w-4 h-4" />
          Share Your Transformation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Share Your Before & After
          </DialogTitle>
          <DialogDescription>
            Upload photos of your transformation to inspire others!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {completedBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>You don't have any completed services at this business yet.</p>
              <p className="text-sm mt-2">Complete a service to share your transformation!</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Service</label>
                <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                  <SelectTrigger data-testid="select-booking">
                    <SelectValue placeholder="Choose a completed service" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedBookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.serviceName} - {format(new Date(booking.date), "MMM d, yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Before Photo URL</label>
                <Input
                  placeholder="https://example.com/before.jpg"
                  value={beforeUrl}
                  onChange={(e) => setBeforeUrl(e.target.value)}
                  data-testid="input-before-url"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">After Photo URL</label>
                <Input
                  placeholder="https://example.com/after.jpg"
                  value={afterUrl}
                  onChange={(e) => setAfterUrl(e.target.value)}
                  data-testid="input-after-url"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Caption (Optional)</label>
                <Textarea
                  placeholder="Share your experience..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  data-testid="input-caption"
                />
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!selectedBooking || !beforeUrl || !afterUrl || uploadMutation.isPending}
                  data-testid="button-submit-photos"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Submit for Approval"}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PendingPhotoCard({ photo, onApprove, onDelete }: { photo: BeforeAfterPhoto; onApprove: () => void; onDelete: () => void }) {
  return (
    <Card className="border-yellow-200 bg-yellow-50/30">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(photo.createdAt), "MMM d, yyyy")}
          </span>
        </div>
        
        <BeforeAfterSlider beforeUrl={photo.beforePhotoUrl} afterUrl={photo.afterPhotoUrl} />
        
        {photo.caption && (
          <p className="text-sm text-muted-foreground italic">"{photo.caption}"</p>
        )}
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 bg-amber-600 hover:bg-amber-700"
            onClick={onApprove}
            data-testid={`button-approve-${photo.id}`}
          >
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={onDelete}
            data-testid={`button-delete-${photo.id}`}
          >
            <X className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BeforeAfterGallery({ businessId, isOwner = false, showUpload = false }: BeforeAfterGalleryProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: approvedPhotos, isLoading: loadingApproved } = useQuery<BeforeAfterPhoto[]>({
    queryKey: [`/api/businesses/${businessId}/before-after`],
  });

  const { data: pendingPhotos, isLoading: loadingPending } = useQuery<BeforeAfterPhoto[]>({
    queryKey: [`/api/businesses/${businessId}/before-after/pending`],
    enabled: isOwner,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/before-after/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/before-after`] });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/before-after/pending`] });
      toast({
        title: "Photo Approved",
        description: "The transformation photo is now visible to the public.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/before-after/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/before-after`] });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/before-after/pending`] });
      toast({
        title: "Photo Deleted",
        description: "The transformation photo has been removed.",
      });
    },
  });

  const refreshPhotos = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/before-after`] });
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-semibold">Transformations</h2>
        {showUpload && (
          <UploadDialog businessId={businessId} onSuccess={refreshPhotos} />
        )}
      </div>

      {isOwner && pendingPhotos && pendingPhotos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-yellow-700 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Approval ({pendingPhotos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPhotos.map((photo) => (
              <PendingPhotoCard
                key={photo.id}
                photo={photo}
                onApprove={() => approveMutation.mutate(photo.id)}
                onDelete={() => deleteMutation.mutate(photo.id)}
              />
            ))}
          </div>
        </div>
      )}

      {loadingApproved ? (
        <div className="text-center py-8 text-muted-foreground">Loading transformations...</div>
      ) : approvedPhotos && approvedPhotos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {approvedPhotos.map((photo) => (
            <Card key={photo.id} className="border-none shadow-md overflow-hidden" data-testid={`before-after-${photo.id}`}>
              <CardContent className="p-4 space-y-3">
                <BeforeAfterSlider beforeUrl={photo.beforePhotoUrl} afterUrl={photo.afterPhotoUrl} />
                {photo.caption && (
                  <p className="text-sm text-muted-foreground italic">"{photo.caption}"</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(photo.createdAt), "MMMM d, yyyy")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-stone-50/30 rounded-lg border border-dashed border-stone-200">
          <Sparkles className="w-10 h-10 text-amber-300 mx-auto mb-3" />
          <p className="text-muted-foreground">No transformations yet.</p>
          {showUpload && (
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to share your before & after!
            </p>
          )}
        </div>
      )}
    </section>
  );
}
