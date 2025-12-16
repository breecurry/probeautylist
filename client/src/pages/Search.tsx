import { useState } from "react";
import { Link } from "wouter";
import { MOCK_BUSINESSES, SERVICE_TYPES } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search as SearchIcon, Star, Filter, Loader2, Navigation, Crown } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  const handleUseLocation = () => {
    setIsLocating(true);
    
    // Simulate geo-location API delay
    setTimeout(() => {
      setIsLocating(false);
      setSearchTerm("Downtown"); // Mock result of finding location
      toast({
        title: "Location Found",
        description: "Showing professionals near Downtown, Cityville",
      });
    }, 1500);
  };

  const filteredBusinesses = MOCK_BUSINESSES.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || b.type === selectedType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    // Basic sorting logic to simulate tiered search results
    // Gold > Silver > Bronze > Free
    const tierOrder = { gold: 4, silver: 3, bronze: 2, free: 1 };
    // @ts-ignore
    return tierOrder[b.tier] - tierOrder[a.tier];
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <Link key={business.id} href={`/profile/${business.id}`}>
              <Card className={`h-full overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
                business.tier === 'gold' ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border'
              }`}>
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={business.image} 
                    alt={business.name} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
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
                      <p className="text-sm text-muted-foreground mt-1">{business.type}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-md">
                        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                        <span className="font-medium text-sm">{business.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">{business.reviews} reviews</span>
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
      </div>
    </div>
  );
}
