import { useState, useRef } from "react";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Onboarding() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Parse query params manually since wouter doesn't provide a hook for it
  const searchParams = new URLSearchParams(window.location.search);
  const type = searchParams.get("type") || "client";
  const planId = searchParams.get("plan");

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Profile Created!",
        description: type === 'business' 
          ? "Your business profile is under review. We'll notify you once approved."
          : "Welcome! Your preferences have been saved.",
      });
      setLocation(type === 'business' ? '/profile/1' : '/search');
    }, 1500);
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
            <BusinessOnboardingForm onSubmit={onSubmit} initialPlan={planId} />
          ) : (
            <ClientOnboardingForm onSubmit={onSubmit} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

function BusinessOnboardingForm({ onSubmit, initialPlan }: { onSubmit: (data: any) => void, initialPlan: string | null }) {
  const { register, handleSubmit, setValue } = useForm();
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || 'free');
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
    if (!uploadedFile) {
      toast({
        title: "Certification Required",
        description: "Please upload your cosmetology license or certificate",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = {
        ...data,
        serviceType,
        tier: selectedPlan,
        certificationFileName: uploadedFile.name
      };
      
      await onSubmit(formData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
            data-testid="button-submit"
          >
            {isSubmitting ? "Submitting..." : "Submit for Approval"}
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
