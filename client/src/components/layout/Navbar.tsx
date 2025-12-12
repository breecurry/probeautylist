import { Link, useLocation } from "wouter";
import { Scissors, User, Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Find a Pro", href: "/search" },
    { name: "For Business", href: "/auth?type=business" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-pink-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-primary">
            <Scissors className="h-6 w-6" />
            <span>BeautyConnect</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
                {link.name}
            </Link>
          ))}
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-pink-50" asChild>
              <Link href="/auth">
                Log In
              </Link>
            </Button>
            <Button className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-pink-200" asChild>
              <Link href="/auth?mode=signup">
                Get Started
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="text-lg font-medium py-2 hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                    {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4">
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsOpen(false)} asChild>
                  <Link href="/auth">
                    Log In
                  </Link>
                </Button>
                <Button className="w-full justify-start" onClick={() => setIsOpen(false)} asChild>
                  <Link href="/auth?mode=signup">
                    Sign Up
                  </Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
