import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { login, register } from "@/lib/api";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"client" | "business">("client");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  
  const [loginData, setLoginData] = useState({ usernameOrEmail: "", password: "" });
  const [signupData, setSignupData] = useState({ username: "", email: "", password: "", firstName: "", lastName: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await login(loginData.usernameOrEmail, loginData.password);
      await refreshUser();
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.username}`,
      });
      
      if (user.role === 'admin') {
        setLocation('/admin');
      } else if (user.role === 'business_owner') {
        setLocation('/search');
      } else {
        setLocation('/search');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const userRole = role === 'business' ? 'business_owner' : 'client';
      const user = await register(signupData.username, signupData.email, signupData.password, userRole, signupData.firstName, signupData.lastName);
      await refreshUser();
      toast({
        title: "Account created!",
        description: `Welcome, ${user.username}!`,
      });
      
      if (role === 'business') {
        setLocation('/onboarding?type=business');
      } else {
        setLocation('/search');
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-serif font-bold text-primary cursor-pointer">BeautyConnect</h1>
          </Link>
          <p className="text-muted-foreground mt-2">Welcome back to your beauty destination</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/50">
            <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
            <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-none shadow-xl shadow-stone-100">
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your username or email to access your account.</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="usernameOrEmail">Username or Email</Label>
                    <Input 
                      id="usernameOrEmail" 
                      type="text" 
                      placeholder="username or email@example.com" 
                      required 
                      data-testid="input-username-email"
                      value={loginData.usernameOrEmail}
                      onChange={(e) => setLoginData({ ...loginData, usernameOrEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                        Forgot password?
                      </Link>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      required 
                      data-testid="input-password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading} data-testid="button-login">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="border-none shadow-xl shadow-stone-100">
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join our community today.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                        role === 'client' 
                          ? 'border-primary bg-stone-50 text-primary' 
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setRole('client')}
                      data-testid="role-client"
                    >
                      <User className="w-8 h-8 mx-auto mb-2" />
                      <div className="font-medium">Client</div>
                    </div>
                    <div 
                      className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                        role === 'business' 
                          ? 'border-primary bg-stone-50 text-primary' 
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setRole('business')}
                      data-testid="role-business"
                    >
                      <Briefcase className="w-8 h-8 mx-auto mb-2" />
                      <div className="font-medium">Business</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">First Name</Label>
                      <Input 
                        id="signup-firstname" 
                        type="text" 
                        placeholder="John" 
                        data-testid="input-signup-firstname"
                        value={signupData.firstName}
                        onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input 
                        id="signup-lastname" 
                        type="text" 
                        placeholder="Doe" 
                        data-testid="input-signup-lastname"
                        value={signupData.lastName}
                        onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input 
                      id="signup-username" 
                      type="text" 
                      placeholder="your_username" 
                      required 
                      data-testid="input-signup-username"
                      value={signupData.username}
                      onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="hello@example.com" 
                      required 
                      data-testid="input-signup-email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      required 
                      data-testid="input-signup-password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading} data-testid="button-signup">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
