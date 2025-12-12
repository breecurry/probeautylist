import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS, MOCK_BUSINESSES } from "@/lib/mock-data";
import { Check, Star, MapPin } from "lucide-react";
// Import the generated image using the alias
import heroImage from "@assets/generated_images/elegant_beauty_salon_interior_with_soft_pink_and_white_tones..png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
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
                <Link href="/search">
                  <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all">
                    Find a Professional
                  </Button>
                </Link>
                <Link href="/auth?type=business">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full border-2 hover:bg-pink-50">
                    List Your Business
                  </Button>
                </Link>
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
              {/* Floating Badge */}
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
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] bg-pink-50/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] bg-rose-50/50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4" />
      </section>

      {/* Featured Businesses Section */}
      <section className="py-24 bg-white">
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
                  <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
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
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-pink-50/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif">Grow Your Business</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of beauty professionals growing their clientele with BeautyConnect.
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
                    ? 'border-primary shadow-xl scale-105 z-10' 
                    : 'border-border/50 shadow-md hover:shadow-lg'
                }`}>
                  {plan.highlight && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-300 via-primary to-pink-300" />
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
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/auth?plan=${plan.id}&type=business`}>
                      <Button className={`w-full ${plan.highlight ? 'bg-primary hover:bg-primary/90' : 'bg-white hover:bg-gray-50 text-foreground border border-input'}`}>
                        Choose {plan.name}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
