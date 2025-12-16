import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }
      
      setEmailSent(true);
      toast({
        title: "Check your email",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50/30 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl font-serif font-bold text-primary cursor-pointer">BeautyConnect</h1>
            </Link>
          </div>

          <Card className="border-none shadow-xl shadow-stone-100">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                If an account exists with {email}, you'll receive a password reset link shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              <p>The link will expire in 1 hour for security reasons.</p>
              <p className="mt-2">Didn't receive an email? Check your spam folder or try again.</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setEmailSent(false)}
                data-testid="button-try-again"
              >
                Try Another Email
              </Button>
              <Link href="/auth" className="w-full">
                <Button variant="ghost" className="w-full" data-testid="button-back-login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-serif font-bold text-primary cursor-pointer">BeautyConnect</h1>
          </Link>
          <p className="text-muted-foreground mt-2">Reset your password</p>
        </div>

        <Card className="border-none shadow-xl shadow-stone-100">
          <CardHeader>
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-center">Forgot Password?</CardTitle>
            <CardDescription className="text-center">
              No worries! Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  required 
                  data-testid="input-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={isLoading} 
                data-testid="button-send-reset"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Reset Link
              </Button>
              <Link href="/auth" className="w-full">
                <Button variant="ghost" className="w-full" data-testid="button-back-login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
