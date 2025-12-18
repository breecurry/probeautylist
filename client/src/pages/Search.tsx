import { useState } from "react";
import { Link } from "wouter";
import { SERVICE_TYPES } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search as SearchIcon, Star, Filter, Loader2, Navigation, Crown, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Business {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  phone: string;
  tier: string;
  approved: boolean;
  ownerId: string;
  image?: string;
  serviceType: string;
}

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  const { data: businesses = [], isLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
    queryFn: async () => {
      const res = await fetch("/api/businesses");
      if (!res.ok) throw new Error("Failed to fetch businesses");
      return res.json();
    },
  });

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get city name from coordinates
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'User-Agent': 'ProBeautyList/1.0' } }
          );
          if (!response.ok) {
            throw new Error('Geocoding service unavailable');
          }
          const data = await response.json();
          
          // Extract city or town name
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
          const state = data.address?.state || "";
          const locationText = city ? (state ? `${city}, ${state}` : city) : "";
          
          setSearchTerm(locationText);
          setIsLocating(false);
          toast({
            title: "Location Found",
            description: locationText ? `Showing professionals near ${locationText}` : "Location detected",
          });
        } catch (error) {
          setIsLocating(false);
          toast({
            title: "Location Error",
            description: "Couldn't determine your city. Please enter it manually.",
            variant: "destructive",
          });
        }
      },
      (error) => {
        setIsLocating(false);
        let message = "Unable to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access denied. Please enable it in your browser settings.";
        }
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const filteredBusinesses = businesses.filter(b => {
    const search = searchTerm.toLowerCase().trim();
    // Match by name, location, address, or service type
    const matchesSearch = !search || 
                          b.name.toLowerCase().includes(search) || 
                          (b.location && b.location.toLowerCase().includes(search)) ||
                          (b.address && b.address.toLowerCase().includes(search)) ||
                          (b.serviceType && b.serviceType.toLowerCase().includes(search)) ||
                          (b.description && b.description.toLowerCase().includes(search));
    const matchesType = selectedType === "all" || b.serviceType === selectedType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    const tierOrder: Record<string, number> = { gold: 4, silver: 3, bronze: 2, free: 1 };
    return (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Search Header */}
      <div className="bg-stone-50/50 border-b border-stone-100 py-8">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-serif font-bold mb-6">Find Beauty Professionals</h1>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or location..." 
                  className="pl-10 h-12 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                className="h-12 w-12 shrink-0 bg-white border-input hover:bg-gray-50 text-muted-foreground"
                onClick={handleUseLocation}
                disabled={isLocating}
                title="Use my location"
              >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              </Button>
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-12 bg-white">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {SERVICE_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="h-12 px-8 bg-primary hover:bg-primary/90">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container px-4 md:px-6 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading professionals...</p>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 mb-4">
              <Users className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-xl font-serif font-semibold text-foreground mb-2">No Professionals Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto" data-testid="empty-search-message">
              No professionals found yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <Link key={business.id} href={`/profile/${business.id}`}>
                <Card className={`h-full overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
                  business.tier === 'gold' ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border'
                }`}>
                  <div className="aspect-video relative overflow-hidden">
                    {business.image ? (
                      <img 
                        src={business.image} 
                        alt={business.name} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <Users className="w-12 h-12 text-stone-400" />
                      </div>
                    )}
                    {business.tier === 'gold' && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5" data-testid={`badge-gold-${business.id}`}>
                        <Crown className="w-3.5 h-3.5" />
                        <span>GOLD</span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="font-serif text-xl">{business.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{business.serviceType}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      {business.location}
                    </div>
                    <p className="text-sm line-clamp-2 text-muted-foreground/80">
                      {business.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
