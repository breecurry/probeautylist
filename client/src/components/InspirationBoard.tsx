import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Bookmark, Trash2, Edit2, ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

interface InspirationBoardItem {
  id: string;
  clientId: string;
  portfolioItemId: string;
  businessId: string;
  note: string | null;
  createdAt: string;
}

interface PortfolioItem {
  id: string;
  businessId: string;
  imageUrl: string;
  caption: string | null;
}

interface Business {
  id: string;
  name: string;
  image: string | null;
}

export function InspirationBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<InspirationBoardItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: boardItems = [], isLoading } = useQuery<InspirationBoardItem[]>({
    queryKey: ["/api/inspiration-board"],
    queryFn: async () => {
      const res = await fetch("/api/inspiration-board", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch inspiration board");
      return res.json();
    },
  });

  const { data: portfolioData } = useQuery<Record<string, PortfolioItem>>({
    queryKey: ["/api/portfolio-items", boardItems.map(i => i.portfolioItemId)],
    queryFn: async () => {
      const portfolioItems: Record<string, PortfolioItem> = {};
      for (const item of boardItems) {
        try {
          const res = await fetch(`/api/businesses/${item.businessId}/portfolio`, { credentials: "include" });
          if (res.ok) {
            const portfolio = await res.json();
            const found = portfolio.find((p: PortfolioItem) => p.id === item.portfolioItemId);
            if (found) {
              portfolioItems[item.portfolioItemId] = found;
            }
          }
        } catch (e) {
          console.error("Error fetching portfolio:", e);
        }
      }
      return portfolioItems;
    },
    enabled: boardItems.length > 0,
  });

  const { data: businessData } = useQuery<Record<string, Business>>({
    queryKey: ["/api/businesses-for-board", boardItems.map(i => i.businessId)],
    queryFn: async () => {
      const businesses: Record<string, Business> = {};
      const uniqueBusinessIds = [...new Set(boardItems.map(i => i.businessId))];
      for (const businessId of uniqueBusinessIds) {
        try {
          const res = await fetch(`/api/businesses/${businessId}`, { credentials: "include" });
          if (res.ok) {
            businesses[businessId] = await res.json();
          }
        } catch (e) {
          console.error("Error fetching business:", e);
        }
      }
      return businesses;
    },
    enabled: boardItems.length > 0,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inspiration-board/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspiration-board"] });
      toast({
        title: "Removed",
        description: "Item removed from your inspiration board.",
      });
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const res = await fetch(`/api/inspiration-board/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("Failed to update note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspiration-board"] });
      toast({
        title: "Updated",
        description: "Your note has been saved.",
      });
      setEditingItem(null);
      setNoteText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditNote = (item: InspirationBoardItem) => {
    setEditingItem(item);
    setNoteText(item.note || "");
  };

  const handleSaveNote = () => {
    if (editingItem) {
      updateNoteMutation.mutate({ id: editingItem.id, note: noteText });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-amber-600" />
          Style Inspiration Board
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (boardItems.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-amber-600" />
          Style Inspiration Board
        </h2>
        <Card className="border-dashed border-2 border-stone-200 bg-stone-50/30">
          <CardContent className="p-8 text-center">
            <Bookmark className="w-12 h-12 text-amber-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-700 mb-2">
              Your inspiration board is empty
            </h3>
            <p className="text-muted-foreground text-sm">
              Browse stylist portfolios and save looks you love! Click the bookmark icon on any portfolio photo to add it here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-amber-600 fill-amber-600" />
        Style Inspiration Board
        <span className="text-sm font-normal text-muted-foreground ml-2">
          ({boardItems.length} saved)
        </span>
      </h2>
      <p className="text-sm text-muted-foreground">
        Share these saved looks with your stylist at your next appointment!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boardItems.map((item) => {
          const portfolio = portfolioData?.[item.portfolioItemId];
          const business = businessData?.[item.businessId];

          return (
            <Card
              key={item.id}
              className="overflow-hidden border-stone-100 hover:shadow-lg transition-shadow"
              data-testid={`inspiration-item-${item.id}`}
            >
              <div className="aspect-square relative group bg-gray-100">
                {portfolio?.imageUrl ? (
                  <img
                    src={portfolio.imageUrl}
                    alt={portfolio.caption || "Saved inspiration"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Bookmark className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => handleEditNote(item)}
                    data-testid={`button-edit-note-${item.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full"
                    onClick={() => setDeleteConfirmId(item.id)}
                    data-testid={`button-remove-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3 bg-stone-50/30">
                <div className="flex items-center justify-between mb-1">
                  <Link href={`/profile/${item.businessId}`}>
                    <span className="text-sm font-medium text-amber-700 hover:underline cursor-pointer flex items-center gap-1">
                      {business?.name || "Business"}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
                {item.note && (
                  <p className="text-xs text-muted-foreground italic line-clamp-2">
                    "{item.note}"
                  </p>
                )}
                {!item.note && (
                  <button
                    onClick={() => handleEditNote(item)}
                    className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1"
                    data-testid={`button-add-note-${item.id}`}
                  >
                    <Edit2 className="w-3 h-3" />
                    Add a note
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]" data-testid="edit-note-dialog">
          <DialogHeader>
            <DialogTitle className="text-amber-700">Edit Note</DialogTitle>
            <DialogDescription>
              Add a note to remind yourself why you saved this look.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Love the balayage technique, want this for summer!"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[100px] border-stone-200 focus:border-amber-500 focus:ring-amber-500"
              data-testid="input-inspiration-note"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingItem(null)}
              data-testid="button-cancel-note"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={updateNoteMutation.isPending}
              className="bg-gradient-to-r from-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-600"
              data-testid="button-save-note"
            >
              {updateNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[350px]" data-testid="delete-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Remove from Board?</DialogTitle>
            <DialogDescription>
              This will remove this look from your inspiration board.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && removeMutation.mutate(deleteConfirmId)}
              disabled={removeMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
