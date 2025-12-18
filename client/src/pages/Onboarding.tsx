import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SERVICE_TYPES, PLANS } from "@/lib/mock-data";
import { Upload, CheckCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createBusiness, createSubscriptionCheckout } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export default function Onboarding() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Parse query params manually since wouter doesn't provide a hook for it
  const searchParams = new URLSearchParams(window.location.search);
  const type = searchParams.get("type") || "client";
  const planId = searchParams.get("plan");

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onBusinessSubmit = async (data: any) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to create a business",
        variant: "destructive"
      });
      setLocation('/auth?type=business');
      return;
    }

    setIsSubmitting(true);
    try {
      // Map plan IDs to tier names for the database
      const tierMapping: Record<string, string> = {
        'free': 'free',
        'bronze': 'bronze',
        'silver': 'silver', 
        'gold': 'gold'
      };
      const selectedTier = tierMapping[data.tier] || 'free';
      
      // Create the business in database - start as free, Stripe webhook will upgrade
      const business = await createBusiness({
        name: data.businessName,
        description: data.bio || '',
        serviceType: data.serviceType,
        tier: 'free', // Always start as free, Stripe will upgrade on successful payment
        ownerId: user.id,
        approved: false,
        location: data.location || '',
        address: data.location || '',
        phone: '',
      });

      // If paid plan selected, redirect to Stripe checkout
      console.log('[onboarding] Business created, tier from form:', data.tier, 'selectedTier:', selectedTier, 'business id:', business.id);
      if (selectedTier && selectedTier !== 'free') {
        console.log('[onboarding] Attempting Stripe checkout for tier:', selectedTier);
        try {
          const checkoutResult = await createSubscriptionCheckout(business.id, selectedTier);
          console.log('[onboarding] Checkout result:', checkoutResult);
          if (checkoutResult.url) {
            console.log('[onboarding] Redirecting to:', checkoutResult.url);
            window.location.href = checkoutResult.url;
            return;
          }
        } catch (checkoutError: any) {
          console.error('[onboarding] Checkout error:', checkoutError);
          toast({
            title: "Checkout Error",
            description: "Business created but couldn't start checkout. You can upgrade from your profile.",
            variant: "destructive"
          });
        }
      } else {
        console.log('[onboarding] Free tier selected, skipping checkout');
      }

      // For free plan, just show success and redirect
      toast({
        title: "Business Created!",
        description: "Your business profile is under review. We'll notify you once approved.",
      });
      setLocation(`/profile/${business.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create business. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onClientSubmit = (data: any) => {
    toast({
      title: "Welcome!",
      description: "Your preferences have been saved.",
    });
    setLocation('/search');
  };

  return (
    <div className="min-h-screen bg-stone-50/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif font-bold text-foreground">
            {type === 'business' ? 'Setup Your Business' : 'Personalize Your Experience'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {type === 'business' 
              ? 'Tell us about your services and get verified.' 
              : 'Help us find the perfect beauty professionals for you.'}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {type === 'business' ? (
            <BusinessOnboardingForm onSubmit={onBusinessSubmit} initialPlan={planId} isSubmitting={isSubmitting} />
          ) : (
            <ClientOnboardingForm onSubmit={onClientSubmit} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

function BusinessOnboardingForm({ onSubmit, initialPlan, isSubmitting: parentIsSubmitting }: { onSubmit: (data: any) => Promise<void>, initialPlan: string | null, isSubmitting: boolean }) {
  const { register, handleSubmit, setValue } = useForm();
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || 'free');
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync selectedPlan when initialPlan changes (only on mount or when initialPlan changes)
  useEffect(() => {
    if (initialPlan) {
      console.log('[onboarding] Setting plan from URL param:', initialPlan);
      setSelectedPlan(initialPlan);
    }
  }, [initialPlan]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleFormSubmit = async (data: any) => {
    console.log('[onboarding] Form submitting, selectedPlan state:', selectedPlan);
    console.log('[onboarding] initialPlan prop:', initialPlan);
    
    const formData = {
      ...data,
      serviceType,
      tier: selectedPlan,
      certificationFileName: uploadedFile?.name || null
    };
    
    console.log('[onboarding] Form data being submitted:', formData);
    await onSubmit(formData);
  };

  return (
    <Card className="border-none shadow-xl shadow-stone-100">
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input 
              id="businessName" 
              placeholder="e.g. Glow Beauty Studio" 
              required 
              {...register("businessName")} 
              data-testid="input-business-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              placeholder="e.g. Los Angeles, CA" 
              required 
              {...register("location")} 
              data-testid="input-location"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger data-testid="select-service-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} data-testid={`option-service-${t}`}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsExp">Years of Experience</Label>
              <Input 
                id="yearsExp" 
                type="number" 
                min="0" 
                placeholder="e.g. 5" 
                {...register("yearsExp")} 
                data-testid="input-years-exp"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Business Bio</Label>
            <Textarea 
              id="bio" 
              placeholder="Tell clients about your style and expertise..." 
              className="min-h-[100px]" 
              {...register("bio")} 
              data-testid="input-bio"
            />
          </div>

          <div className="space-y-2">
            <Label>Certification / License (Required)</Label>
            <div 
              onClick={handleFileClick}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                uploadedFile 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-primary/50 bg-gray-50/50'
              }`}
              data-testid="upload-certification"
            >
              {uploadedFile ? (
                <>
                  <FileText className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm font-medium text-primary">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to change file</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload your cosmetology license or certificate</p>
                </>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                data-testid="input-file"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              * Your profile will not be public until an admin verifies your credentials.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Subscription Plan</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {PLANS.map((plan) => (
                <div 
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? 'border-primary bg-stone-50 ring-2 ring-primary' 
                      : 'hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  data-testid={`plan-${plan.id}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{plan.name}</span>
                    <span className="text-sm font-bold">{plan.price}</span>
                  </div>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {plan.features.slice(0, 2).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                  {selectedPlan === plan.id && (
                    <div className="mt-2 flex items-center text-primary text-xs font-medium">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
            disabled={parentIsSubmitting}
            data-testid="button-submit"
          >
            {parentIsSubmitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function ClientOnboardingForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { register, handleSubmit } = useForm();
  
  const interests = [
    "Hair Styling", "Nail Art", "Skincare", "Makeup", "Massage", "Barbering", "Eyelashes"
  ];

  return (
    <Card className="border-none shadow-xl shadow-stone-100">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Jane" required {...register("firstName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" required {...register("lastName")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Your Location</Label>
            <Input id="location" placeholder="City, Zip, or Neighborhood" required {...register("location")} />
          </div>

          <div className="space-y-3">
            <Label>What services are you interested in?</Label>
            <div className="grid grid-cols-2 gap-3">
              {interests.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox id={`interest-${interest}`} />
                  <label
                    htmlFor={`interest-${interest}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {interest}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12 text-lg">
            Find Professionals
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
