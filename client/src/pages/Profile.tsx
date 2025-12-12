import { useParams, Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { MOCK_BUSINESSES, PLANS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Calendar as CalendarIcon, Check, Edit, AlertCircle, Phone, Sparkles, MessageSquare, Send, Lock, X, DollarSign, ThumbsUp, Heart, MessageCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Profile() {
  const params = useParams();
  const [location] = useLocation();
  const { toast } = useToast();
  const id = parseInt(params.id || "1");
  const business = MOCK_BUSINESSES.find(b => b.id === id) || MOCK_BUSINESSES[0];
  const currentPlan = PLANS.find(p => p.id === business.tier) || PLANS[0];
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isTipOpen, setIsTipOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [hasCompletedService, setHasCompletedService] = useState(false); // Mock state for review permission

  // Simulate "Pending" state if accessed from onboarding or via query param
  const isPending = location.includes("pending") || id === 1; 

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
    // For demo purposes, let's simulate a completed booking after a few seconds so we can test the review feature
    setTimeout(() => {
        toast({
            title: "Demo: Service Completed",
            description: "Simulating that you have completed this service. You can now leave a review.",
            duration: 5000,
        });
        setHasCompletedService(true);
    }, 3000);
  };

  const handleEdit = () => {
    toast({
      title: "Edit Mode",
      description: "Opening profile editor...",
    });
  };

  const handleReviewClick = () => {
    if (!hasCompletedService) {
        toast({
            title: "Review Unavailable",
            description: "You must complete a service and have it confirmed by the technician before leaving a review.",
            variant: "destructive"
        });
        return;
    }
    setIsReviewOpen(true);
  }

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewOpen(false);
    toast({
      title: "Review Submitted",
      description: "Thank you for your feedback!",
    });
  };

  const handleSendTip = () => {
    setIsTipOpen(false);
    toast({
      title: "Tip Sent!",
      description: `You sent a $${tipAmount || "0"} tip to ${business.owner}.`,
    });
    setTipAmount("");
  };

  const socialFeaturesEnabled = currentPlan.socialFeatures;
  const photoLimit = currentPlan.photoLimit;
  const portfolioItems = business.portfolio ? business.portfolio.slice(0, photoLimit) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 md:px-6 py-8">
        {/* Breadcrumb-ish */}
        <div className="mb-6">
          <Link href="/search" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to Search
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
                <div className="flex flex-col items-end gap-2">
                   <div className="flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                    <Star className="w-5 h-5 fill-primary text-primary" />
                    <span className="font-bold text-lg text-primary">{business.rating}</span>
                    <span className="text-muted-foreground text-sm ml-1">({business.reviews})</span>
                  </div>
                  
                  {/* Tip Button */}
                  <Dialog open={isTipOpen} onOpenChange={setIsTipOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 shadow-sm">
                        <DollarSign className="w-4 h-4" />
                        Tip Your Tech
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Send a Tip</DialogTitle>
                        <DialogDescription>
                          Show your appreciation for {business.owner}. 100% of the tip goes to them.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-3 gap-2">
                          {['5', '10', '20'].map((amt) => (
                            <Button 
                              key={amt} 
                              variant="outline" 
                              className={tipAmount === amt ? "border-primary bg-pink-50 text-primary" : ""}
                              onClick={() => setTipAmount(amt)}
                            >
                              ${amt}
                            </Button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">$</span>
                          <Input 
                            type="number" 
                            placeholder="Custom amount" 
                            value={tipAmount} 
                            onChange={(e) => setTipAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSendTip} className="w-full bg-green-600 hover:bg-green-700 text-white">
                          Send Tip
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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

            {/* Portfolio / Social Feed */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-serif font-semibold">Portfolio</h2>
                {isPending && (
                  <Button variant="ghost" size="sm" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" /> Manage Photos
                  </Button>
                )}
              </div>
              
              {!socialFeaturesEnabled && (
                 <p className="text-xs text-muted-foreground mb-4 italic">
                    * Showing recent work. Like and comment features not available.
                 </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portfolioItems.map((item) => (
                  <Card key={item.id} className="border-none shadow-md overflow-hidden bg-white">
                    <div className="aspect-square relative group">
                        <img 
                            src={item.url} 
                            alt="Portfolio Work" 
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay Gradient for Text readability if needed, though clean style prefers white space below */}
                    </div>
                    {socialFeaturesEnabled && (
                        <CardFooter className="p-3 border-t bg-pink-50/20 flex justify-between items-center">
                            <div className="flex gap-4">
                                <button className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${item.likedByMe ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'}`}>
                                    <Heart className={`w-5 h-5 ${item.likedByMe ? 'fill-current' : ''}`} />
                                    <span>{item.likes}</span>
                                </button>
                                <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                    <MessageCircle className="w-5 h-5" />
                                    <span>{item.comments}</span>
                                </button>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                <Send className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
              {portfolioItems.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                      <p className="text-muted-foreground">No photos added yet.</p>
                  </div>
              )}
            </section>

            {/* Reviews Section */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-semibold">Client Reviews</h2>
                
                <Button variant="outline" className="gap-2" onClick={handleReviewClick}>
                  <MessageSquare className="w-4 h-4" /> Write a Review
                </Button>

                <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Leave a Review</DialogTitle>
                      <DialogDescription>
                        Share your experience with {business.name}.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitReview} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button type="button" key={star} className="focus:outline-none">
                              <Star className={`w-6 h-6 ${star <= 5 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="review" className="text-sm font-medium">Your Review</label>
                        <Textarea id="review" placeholder="Tell us about your appointment..." required />
                      </div>
                      <DialogFooter>
                        <Button type="submit">Submit Review</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {business.reviewList && business.reviewList.length > 0 ? (
                  business.reviewList.map((review: any) => (
                    <Card key={review.id} className="border-none bg-pink-50/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{review.user[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{review.user}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <div className="flex mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{review.text}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No reviews yet. Be the first to leave one!</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Booking */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-6">
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

              {/* Enhanced Owner Info Card */}
              <Card className="border-none shadow-md bg-gradient-to-br from-white to-pink-50/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${business.id}`} />
                      <AvatarFallback>OW</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">Meet your tech</p>
                      <p className="font-serif font-bold text-xl">{business.owner}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary/70" />
                      <span>{business.address || `${business.location}, Cityville`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0 text-primary/70" />
                      <span>{business.phone || "(555) 123-4567"}</span>
                    </div>
                  </div>

                  {business.funFacts && business.funFacts.length > 0 && (
                    <div className="bg-white/60 p-3 rounded-lg border border-pink-100/50">
                      <div className="flex items-center gap-1.5 mb-2 text-primary font-medium text-xs uppercase tracking-wide">
                        <Sparkles className="w-3 h-3" /> Fun Facts
                      </div>
                      <ul className="space-y-1.5">
                        {business.funFacts.map((fact, i) => (
                          <li key={i} className="text-xs text-muted-foreground italic flex items-start gap-1.5">
                            <span className="text-pink-300">•</span> {fact}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <MessagingSheet business={business} />
                </CardFooter>
              </Card>
              
              {hasCompletedService && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5" />
                    <div>
                        <p className="font-bold">Service Completed</p>
                        <p className="text-xs">Technician confirmed completion. You may now leave a review.</p>
                    </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessagingSheet({ business }: { business: any }) {
  const [messages, setMessages] = useState<{role: 'user' | 'business', text: string, time: string}[]>([
    { role: 'business', text: `Hi there! I'm ${business.owner}. Let me know if you have any questions about my services!`, time: '10:00 AM' }
  ]);
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine if locked based on tier
  // For demo: User is viewing a business. 
  // Requirement: "locked for free plan business users". 
  // If the business is 'free', messaging is locked FOR THE BUSINESS OWNER? Or for everyone?
  // "in app messaging but it should show locked for the free plan business users... All customers should have complete access to messages."
  // This implies customers can ALWAYS message, but business owners on free plans cannot reply or see them?
  // Let's interpret this as: If I am the business owner and on free plan, I can't use it.
  // But here we are viewing the profile as a CLIENT. Clients should have access.
  // However, if the business is on a free plan, maybe they can't receive messages?
  // Let's implement it such that if the business tier is 'free', the feature is restricted/limited.
  
  const isLocked = business.tier === 'free';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Profanity Filter
    const profanityRegex = /badword|profanity|curse|damn|hell/i; // Simple example list
    if (profanityRegex.test(input)) {
      toast({
        title: "Message Blocked",
        description: "Profanity is not allowed. Repeated violations will result in account closure.",
        variant: "destructive",
      });
      return;
    }

    const newMessage = { role: 'user' as const, text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages([...messages, newMessage]);
    setInput("");

    // Simulate reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'business',
        text: isLocked 
          ? "[Auto-Reply] This business is on a Starter plan and may have limited access to messages. Please call them directly for urgent inquiries."
          : "Thanks for your message! I'll get back to you shortly.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-pink-50 text-primary">
          <MessageSquare className="w-4 h-4" />
          Message {business.owner.split(' ')[0]}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col h-full">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${business.id}`} />
              <AvatarFallback>OW</AvatarFallback>
            </Avatar>
            Chat with {business.owner}
          </SheetTitle>
          <SheetDescription>
            Ask about services, availability, or consultations.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4 py-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-muted rounded-tl-none'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-[10px] opacity-70 block text-right mt-1">{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t pt-4 mt-auto">
          {isLocked && (
            <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded mb-2 flex items-center gap-2">
               <Lock className="w-3 h-3" />
               <span>Business has limited messaging access (Free Plan).</span>
            </div>
          )}
          <div className="flex gap-2">
            <Input 
              placeholder="Type a message..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button size="icon" onClick={handleSend} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Profanity is strictly prohibited. Violations may lead to account ban.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
