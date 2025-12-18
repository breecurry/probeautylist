import { Link, useLocation } from "wouter";
import { Scissors, Menu, LogOut, Calendar, Search, Settings, Shield, LucideIcon, Home, Store, BarChart3, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/NotificationBell";

interface NavLink {
  name: string;
  href: string;
  icon?: LucideIcon;
}

interface Business {
  id: string;
  tier: string;
  ownerId: string;
}

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const { data: businesses } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
    queryFn: async () => {
      const res = await fetch("/api/businesses");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated && user?.role === 'business_owner',
  });

  const hasGoldBusiness = businesses?.some(b => b.ownerId === user?.id && b.tier === 'gold') ?? false;

  const handleNavigation = (href: string) => {
    if (!isAuthenticated && href !== '/') {
      setLocation('/auth');
    } else {
      setLocation(href);
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  const publicLinks: NavLink[] = [
    { name: "Home", href: "/", icon: Home },
  ];

  const authenticatedLinks: NavLink[] = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Bookings", href: "/bookings", icon: Calendar },
  ];

  const businessOwnerLinks: NavLink[] = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "My Businesses", href: "/my-businesses", icon: Store },
    { name: "Bookings", href: "/bookings", icon: Calendar },
  ];

  const isBusinessOwner = user?.role === 'business_owner';
  const navLinks: NavLink[] = !isAuthenticated 
    ? publicLinks 
    : isBusinessOwner 
      ? businessOwnerLinks 
      : authenticatedLinks;
  const showAdmin = user?.role === 'admin';

  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-white via-stone-50/30 to-white border-b border-stone-200/50 backdrop-blur-md">
      <div className="container mx-auto flex h-12 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-1.5 font-serif text-lg font-semibold text-amber-600 hover:text-amber-700 transition-colors">
          <Scissors className="h-4 w-4" />
          <span className="tracking-wide">Pro Beauty List</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button 
              key={link.href} 
              onClick={() => handleNavigation(link.href)}
              className={`text-xs font-medium tracking-wide uppercase transition-colors hover:text-amber-600 ${
                location === link.href ? "text-amber-600" : "text-gray-500"
              }`}
            >
              {link.name}
            </button>
          ))}
          
          {showAdmin && (
            <button 
              onClick={() => handleNavigation('/admin')}
              className={`text-xs font-medium tracking-wide uppercase transition-colors hover:text-amber-600 ${
                location === '/admin' ? "text-amber-600" : "text-gray-500"
              }`}
            >
              Admin
            </button>
          )}

          {!isAuthenticated ? (
            <Button 
              size="sm" 
              className="h-8 px-4 text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-600 text-white border-0 shadow-sm shadow-stone-200/50 rounded-full"
              asChild
            >
              <Link href="/auth">Login</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-stone-50">
                  <Avatar className="h-7 w-7 border border-stone-200">
                    <AvatarFallback className="bg-gradient-to-br from-stone-100 to-stone-200 text-amber-600 text-xs font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/search')}>
                  <Search className="mr-2 h-4 w-4" />
                  Find Services
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/bookings')} data-testid="dropdown-my-bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  My Bookings
                </DropdownMenuItem>
                {user?.role === 'client' && (
                  <DropdownMenuItem onClick={() => setLocation('/onboarding')} data-testid="dropdown-register-business">
                    <Store className="mr-2 h-4 w-4" />
                    Register Your Business
                  </DropdownMenuItem>
                )}
                {user?.role === 'business_owner' && (
                  <>
                    <DropdownMenuItem onClick={() => setLocation('/my-businesses')} data-testid="dropdown-my-businesses">
                      <Store className="mr-2 h-4 w-4" />
                      My Businesses
                    </DropdownMenuItem>
                    {hasGoldBusiness && (
                      <>
                        <DropdownMenuItem onClick={() => setLocation('/analytics')} data-testid="dropdown-analytics">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLocation('/social-sharing')} data-testid="dropdown-social-sharing">
                          <Share2 className="mr-2 h-4 w-4" />
                          Social Sharing
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => setLocation('/onboarding?type=business')} data-testid="dropdown-add-business">
                      <Settings className="mr-2 h-4 w-4" />
                      Add Business
                    </DropdownMenuItem>
                  </>
                )}
                {showAdmin && (
                  <DropdownMenuItem onClick={() => setLocation('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setLocation('/settings')} data-testid="dropdown-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-stone-50">
              <Menu className="h-5 w-5 text-amber-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-gradient-to-b from-white to-stone-50/30">
            <div className="flex flex-col gap-1 mt-8">
              {isAuthenticated && (
                <div className="mb-6 pb-4 border-b border-stone-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-stone-200">
                        <AvatarFallback className="bg-gradient-to-br from-stone-100 to-stone-200 text-amber-600 font-medium">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user?.username}</p>
                        <p className="text-xs text-muted-foreground">{user?.role?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <NotificationBell />
                  </div>
                </div>
              )}

              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button 
                    key={link.href} 
                    onClick={() => handleNavigation(link.href)}
                    className="flex items-center gap-3 text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-stone-50 text-gray-600 hover:text-amber-600 transition-colors text-left"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {link.name}
                  </button>
                );
              })}
              
              {showAdmin && (
                <button 
                  onClick={() => handleNavigation('/admin')}
                  className="flex items-center gap-3 text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-stone-50 text-gray-600 hover:text-amber-600 transition-colors text-left"
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </button>
              )}

              {user?.role === 'client' && (
                <button 
                  onClick={() => handleNavigation('/onboarding')}
                  className="flex items-center gap-3 text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-stone-50 text-gray-600 hover:text-amber-600 transition-colors text-left"
                  data-testid="mobile-register-business"
                >
                  <Store className="h-4 w-4" />
                  Register Your Business
                </button>
              )}

              {hasGoldBusiness && (
                <>
                  <button 
                    onClick={() => handleNavigation('/analytics')}
                    className="flex items-center gap-3 text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-stone-50 text-gray-600 hover:text-amber-600 transition-colors text-left"
                    data-testid="mobile-analytics"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </button>
                  <button 
                    onClick={() => handleNavigation('/social-sharing')}
                    className="flex items-center gap-3 text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-stone-50 text-gray-600 hover:text-amber-600 transition-colors text-left"
                    data-testid="mobile-social-sharing"
                  >
                    <Share2 className="h-4 w-4" />
                    Social Sharing
                  </button>
                </>
              )}
              
              {isAuthenticated && (
                <button 
                  onClick={() => handleNavigation('/settings')}
                  className="flex items-center gap-3 text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-stone-50 text-gray-600 hover:text-amber-600 transition-colors text-left"
                  data-testid="mobile-settings"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-stone-200">
                {!isAuthenticated ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-600 text-white rounded-full"
                    onClick={() => { setIsOpen(false); setLocation('/auth'); }}
                  >
                    Login
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full border-stone-200 text-red-500 hover:bg-stone-50 rounded-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
