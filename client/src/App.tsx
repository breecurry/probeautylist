import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Search from "@/pages/Search";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import MyBusinesses from "@/pages/MyBusinesses";
import Bookings from "@/pages/Bookings";
import CustomerProfile from "@/pages/CustomerProfile";
import AccountSettings from "@/pages/AccountSettings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/search" component={Search} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route path="/my-businesses" component={MyBusinesses} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/customer/:id" component={CustomerProfile} />
      <Route path="/settings" component={AccountSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
