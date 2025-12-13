import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS, MOCK_BUSINESSES } from "@/lib/mock-data";
import { Check, Star, MapPin, Calendar, MessageCircle, TrendingUp, Users, Sparkles, Heart, Clock, Shield, Crown } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import heroImage from "@assets/generated_images/elegant_beauty_salon_interior_with_soft_pink_and_white_tones..png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section - UNCHANGED */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-foreground font-serif">
                  Beauty Services, <br />
                  <span className="text-primary italic">Elevated.</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl font-light leading-relaxed">
                  Discover top-rated hair stylists, nail artists, and beauty professionals in your area. Book your next appointment with ease.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all" asChild>
                  <Link href="/search">
                    Find a Professional
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full border-2 hover:bg-pink-50" asChild>
                  <Link href="/auth?type=business">
                    List Your Business
                  </Link>
                </Button>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mx-auto w-full max-w-[500px] lg:max-w-none"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl shadow-pink-200/50">
                <img 
                  src={heroImage} 
                  alt="Luxury Salon Interior" 
                  className="object-cover w-full h-full transform hover:scale-105 transition-duration-700 transition-transform duration-700 ease-out"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl animate-in slide-in-from-bottom-10 fade-in duration-1000">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center text-primary font-bold text-xl">
                    4.9
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Top Rated</p>
                    <p className="text-sm text-muted-foreground">Professionals</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] bg-pink-50/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] bg-rose-50/50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4" />
      </section>

      {/* Why You Need BeautyConnect - For Clients */}
      <section className="py-20 bg-white">
        <div className="container px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-rose-400 font-medium text-sm uppercase tracking-wider">For Clients</span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif mt-2">Your Beauty, Your Way</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
              Stop scrolling through endless social media pages. Find verified, reviewed professionals in seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: "Local Discovery",
                description: "Find talented beauty professionals right in your neighborhood. No more guessing who's actually good."
              },
              {
                icon: Star,
                title: "Verified Reviews",
                description: "Real reviews from real clients who've actually had appointments. Only completed bookings can leave reviews."
              },
              {
                icon: Calendar,
                title: "Easy Booking",
                description: "Book appointments instantly. See real availability, pick your time, and confirm in seconds."
              },
              {
                icon: Heart,
                title: "Portfolio Browsing",
                description: "Browse stunning work portfolios. Like your favorites and save them for inspiration."
              },
              {
                icon: MessageCircle,
                title: "Direct Messaging",
                description: "Chat directly with professionals before booking. Ask questions, discuss your vision."
              },
              {
                icon: Sparkles,
                title: "Tip Your Tech",
                description: "Show appreciation with seamless in-app tipping. Make your stylist's day!"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-rose-50/30">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-rose-400" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Professionals Need This */}
      <section className="py-20 bg-gradient-to-br from-rose-50/50 to-pink-50/30">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="text-rose-400 font-medium text-sm uppercase tracking-wider">For Professionals</span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif mt-2 mb-6">
                Stop Leaving Money on the Table
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                You're incredible at what you do. But are clients finding you? Social media algorithms change constantly. 
                Your Instagram reach is dropping. Word of mouth only goes so far.
              </p>
              <p className="text-foreground font-medium text-lg mb-8">
                BeautyConnect puts you in front of clients actively looking to book—right now, in your area.
              </p>

              <div className="space-y-4">
                {[
                  "Get discovered by clients searching for exactly what you offer",
                  "Build a stunning portfolio that showcases your best work",
                  "Collect verified reviews that build trust instantly",
                  "Manage bookings without the back-and-forth DMs",
                  "Accept tips and payments seamlessly"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>

              <Button size="lg" className="mt-8 h-12 px-8 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-200" asChild>
                <Link href="/auth?type=business">
                  Start Growing Your Business
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { number: "10K+", label: "Active Clients", icon: Users },
                { number: "500+", label: "Professionals", icon: Sparkles },
                { number: "4.9", label: "Average Rating", icon: Star },
                { number: "24/7", label: "Booking Access", icon: Clock }
              ].map((stat, index) => (
                <Card key={index} className="border-none shadow-lg bg-white">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="h-8 w-8 text-rose-400 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-rose-500">{stat.number}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Gold Professionals - VIP Spotlight Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-orange-50/20">
        <div className="container px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4 shadow-lg">
              <Crown className="w-4 h-4" />
              <span>VIP SPOTLIGHT</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif mt-2">Featured Professionals</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
              Our top-rated Gold tier professionals offering exceptional service and premium experiences.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_BUSINESSES.filter(b => b.tier === 'gold').map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={`/profile/${business.id}`}>
                  <Card className="h-full border-2 border-amber-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group bg-white ring-2 ring-amber-100/50" data-testid={`card-featured-${business.id}`}>
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img 
                        src={business.image} 
                        alt={business.name} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" />
                        <span>GOLD</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <CardHeader className="p-5 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-serif">{business.name}</CardTitle>
                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-amber-600">{business.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{business.type}</p>
                    </CardHeader>
                    <CardContent className="p-5 pt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        {business.location}
                      </div>
                      <p className="text-sm text-muted-foreground/80 line-clamp-2">{business.description}</p>
                      <div className="mt-4 pt-3 border-t border-amber-100">
                        <span className="text-xs text-amber-600 font-medium">{business.reviews} verified reviews</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button className="rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-600 text-white shadow-lg shadow-amber-200/50 px-8" asChild>
              <Link href="/search">
                <Crown className="w-4 h-4 mr-2" />
                View All Featured Professionals
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* The Problem & Solution */}
      <section className="py-20 bg-white">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif mb-6">
              The Old Way is Broken
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <h3 className="font-semibold text-lg mb-4 text-gray-500">Without BeautyConnect</h3>
                <ul className="space-y-3 text-left">
                  {[
                    "Scrolling through 50 Instagram accounts",
                    "No way to know if reviews are real",
                    "Endless DMs to check availability",
                    "No-shows and last-minute cancellations",
                    "Cash-only tips, awkward payment moments"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-500">
                      <span className="text-red-400">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100">
                <h3 className="font-semibold text-lg mb-4 text-rose-500">With BeautyConnect</h3>
                <ul className="space-y-3 text-left">
                  {[
                    "Search by location, service, and rating",
                    "Verified reviews from completed bookings only",
                    "Real-time availability and instant booking",
                    "Professional booking management",
                    "Seamless in-app tipping and payments"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-rose-400">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section className="py-24 bg-rose-50/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif">Trending Professionals</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Highly rated stylists and artists making waves in your city.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_BUSINESSES.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={`/profile/${business.id}`}>
                  <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group bg-white">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img 
                        src={business.image} 
                        alt={business.name} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-serif">{business.name}</CardTitle>
                        <div className="flex items-center gap-1 bg-pink-50 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          <span className="text-xs font-medium text-primary">{business.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{business.type}</p>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" />
                        {business.location}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" className="rounded-full border-rose-200 text-rose-500 hover:bg-rose-50" asChild>
              <Link href="/search">View All Professionals</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-rose-400 font-medium text-sm uppercase tracking-wider">Pricing</span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif">Plans That Grow With You</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade when you're ready to unlock your full potential.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`h-full flex flex-col relative overflow-hidden transition-all duration-300 ${
                  plan.highlight 
                    ? 'border-rose-300 shadow-xl scale-105 z-10' 
                    : 'border-border/50 shadow-md hover:shadow-lg'
                }`}>
                  {plan.highlight && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-300 via-rose-400 to-rose-300" />
                  )}
                  <CardHeader>
                    <h3 className="text-xl font-bold font-serif">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">/mo</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className={`w-full rounded-full ${plan.highlight ? 'bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white' : 'bg-white hover:bg-gray-50 text-foreground border border-input'}`} asChild>
                      <Link href={`/auth?plan=${plan.id}&type=business`}>
                        Choose {plan.name}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-rose-100 to-pink-100">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif mb-4">
              Ready to Transform Your Beauty Experience?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Whether you're looking for your next favorite stylist or ready to grow your beauty business, 
              BeautyConnect is where it all happens.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-white text-rose-500 hover:bg-rose-50 shadow-lg" asChild>
                <Link href="/auth">
                  Get Started Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full border-2 border-white/50 text-rose-600 hover:bg-white/20" asChild>
                <Link href="/search">
                  Browse Professionals
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-rose-100">
        <div className="container px-4 md:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 BeautyConnect. Elevating beauty, one appointment at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
