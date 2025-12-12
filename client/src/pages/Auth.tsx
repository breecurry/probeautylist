import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase } from "lucide-react";

export default function Auth() {
  const [location, setLocation] = useLocation();
  const [role, setRole] = useState<"client" | "business">("client");
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - redirect to appropriate dashboard/home
    if (role === 'business') {
      // If business, maybe check if onboarding is needed
      setLocation('/onboarding?type=business');
    } else {
      setLocation('/search');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock signup - redirect to onboarding
    setLocation(`/onboarding?type=${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-serif font-bold text-primary cursor-pointer">BeautyConnect</h1>
          </Link>
          <p className="text-muted-foreground mt-2">Welcome back to your beauty destination</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/50">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-none shadow-xl shadow-pink-100">
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="hello@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="border-none shadow-xl shadow-pink-100">
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join our community today.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-6">
                  {/* Role Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                        role === 'client' 
                          ? 'border-primary bg-pink-50 text-primary' 
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setRole('client')}
                    >
                      <User className="w-8 h-8 mx-auto mb-2" />
                      <div className="font-medium">Client</div>
                    </div>
                    <div 
                      className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                        role === 'business' 
                          ? 'border-primary bg-pink-50 text-primary' 
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setRole('business')}
                    >
                      <Briefcase className="w-8 h-8 mx-auto mb-2" />
                      <div className="font-medium">Business</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="hello@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    Continue as {role === 'client' ? 'Client' : 'Business Owner'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
