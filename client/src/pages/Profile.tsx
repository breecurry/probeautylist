import { useParams, Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { MOCK_BUSINESSES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Calendar as CalendarIcon, Check, Edit, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Profile() {
  const params = useParams();
  const [location] = useLocation();
  const { toast } = useToast();
  const id = parseInt(params.id || "1");
  const business = MOCK_BUSINESSES.find(b => b.id === id) || MOCK_BUSINESSES[0];
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Simulate "Pending" state if accessed from onboarding or via query param
  const isPending = location.includes("pending") || id === 1; // For demo purposes, let's say ID 1 is the one we just created or is pending

  const services = [
    { name: "Full Service Cut & Style", price: "$65", duration: "60 min" },
    { name: "Root Touch Up", price: "$85", duration: "90 min" },
    { name: "Balayage / Ombre", price: "$180+", duration: "180 min" },
    { name: "Blowout", price: "$45", duration: "45 min" },
  ];

  const handleBooking = () => {
    toast({
      title: "Booking Request Sent",
      description: `Request sent to ${business.name} for ${date?.toLocaleDateString()}`,
    });
  };

  const handleEdit = () => {
    toast({
      title: "Edit Mode",
      description: "Opening profile editor...",
    });
    // In a real app, this would redirect to /onboarding?mode=edit or similar
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 md:px-6 py-8">
        {/* Breadcrumb-ish */}
        <div className="mb-6">
          <Link href="/search">
            <a className="text-sm text-muted-foreground hover:text-primary transition-colors">← Back to Search</a>
          </Link>
        </div>

        {/* Pending Approval Banner */}
        {isPending && (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50 text-yellow-900">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle>Pending Approval</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>
                Your profile is currently under review. It is not yet visible to the public, but you can still make changes.
              </span>
              <Button size="sm" variant="outline" className="bg-white border-yellow-300 hover:bg-yellow-100 text-yellow-900 ml-4" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Info */}
            <div className="space-y-4">
              <div className="aspect-[21/9] rounded-2xl overflow-hidden shadow-lg relative group">
                <img src={business.image} alt={business.name} className="w-full h-full object-cover" />
                {isPending && (
                   <Button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleEdit}>
                     <Edit className="w-4 h-4 mr-2" /> Change Cover
                   </Button>
                )}
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-serif font-bold text-foreground">{business.name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{business.location}</span>
                    <span className="mx-2">•</span>
                    <span>{business.type}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                    <Star className="w-5 h-5 fill-primary text-primary" />
                    <span className="font-bold text-lg text-primary">{business.rating}</span>
                    <span className="text-muted-foreground text-sm ml-1">({business.reviews})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <section className="relative group">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-serif font-semibold">About</h2>
                {isPending && (
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={handleEdit}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {business.description} Welcome to our premium salon experience. We are dedicated to providing the highest quality service with top-tier products. Our team of experts is here to make you look and feel your absolute best.
              </p>
            </section>

            {/* Services List */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-serif font-semibold">Services</h2>
                {isPending && (
                  <Button variant="ghost" size="sm" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" /> Manage Services
                  </Button>
                )}
              </div>
              
              <div className="grid gap-4">
                {services.map((service, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedService === service.name 
                        ? 'border-primary bg-pink-50' 
                        : 'border-border hover:border-pink-200'
                    }`}
                    onClick={() => setSelectedService(service.name)}
                  >
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {service.duration}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">{service.price}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedService === service.name ? 'bg-primary border-primary' : 'border-gray-300'
                      }`}>
                        {selectedService === service.name && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Gallery Mockup */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-serif font-semibold">Portfolio</h2>
                {isPending && (
                  <Button variant="ghost" size="sm" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" /> Manage Photos
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="aspect-square rounded-lg bg-gray-100 overflow-hidden relative group">
                    <img 
                      src={`https://images.unsplash.com/photo-${i === 1 ? '1562322140-8baeececf3df' : '1560066984-138dadb4c035'}?auto=format&fit=crop&w=400&q=80`} 
                      alt="Portfolio" 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border-none shadow-xl shadow-pink-100/50">
                <CardHeader>
                  <CardTitle className="font-serif">Book Appointment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" /> Select Date
                    </h3>
                    <div className="border rounded-md p-2 bg-white flex justify-center">
                       <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                      />
                    </div>
                  </div>
                  
                  {selectedService ? (
                    <div className="bg-pink-50 p-3 rounded-lg text-sm">
                      <span className="font-medium">Selected:</span> {selectedService}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      Please select a service from the list
                    </div>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full h-12 text-lg shadow-lg shadow-primary/20" 
                        disabled={!selectedService || !date}
                      >
                        Request Booking
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Booking Request</DialogTitle>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Service</span>
                          <span className="font-medium">{selectedService}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-medium">{date?.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Location</span>
                          <span className="font-medium">{business.location}</span>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800">
                          Note: This is a request. The business will confirm the exact time with you shortly.
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleBooking}>Send Request</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Owner Info Mockup */}
              <Card className="mt-6 border-none shadow-md">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${business.id}`} />
                    <AvatarFallback>OW</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">Owner</p>
                    <p className="font-serif font-bold">{business.owner}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
