
export const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: 'Free',
    priceValue: 0,
    features: ['Basic Profile', 'Search Listing', 'Accept 5 Bookings/mo'],
    highlight: false
  },
  {
    id: 'bronze',
    name: 'Bronze',
    price: '$0.99',
    priceValue: 0.99,
    features: ['Enhanced Profile', 'Priority Search', 'Accept 20 Bookings/mo'],
    highlight: false
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '$5.00',
    priceValue: 5.00,
    features: ['Photo Gallery (10 images)', 'Top of Search', 'Unlimited Bookings', 'Client Reviews'],
    highlight: true
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '$20.00',
    priceValue: 20.00,
    features: ['Featured Homepage Spot', 'Unlimited Gallery', 'Video Intro', 'Premium Badge', 'Dedicated Support', 'Analytics Dashboard'],
    highlight: true
  }
];

export const MOCK_BUSINESSES = [
  {
    id: 1,
    name: "Luxe Locks Salon",
    owner: "Sarah Jenkins",
    type: "Hair Stylist",
    location: "Downtown",
    rating: 4.8,
    reviews: 124,
    tier: 'gold',
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000",
    description: "Premium hair styling services specializing in color and extensions.",
    approved: true
  },
  {
    id: 2,
    name: "Polished Perfection",
    owner: "Emily Chen",
    type: "Nail Tech",
    location: "Westside",
    rating: 4.9,
    reviews: 89,
    tier: 'silver',
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=1000",
    description: "Detailed nail art and spa pedicures in a relaxing environment.",
    approved: true
  },
  {
    id: 3,
    name: "Glow Bar",
    owner: "Jessica Rivera",
    type: "Esthetician",
    location: "North Hills",
    rating: 4.7,
    reviews: 45,
    tier: 'bronze',
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1000",
    description: "Facials, waxing, and skincare consultations.",
    approved: true
  },
  {
    id: 4,
    name: "The Mane Event",
    owner: "David Miller",
    type: "Barber",
    location: "Downtown",
    rating: 4.6,
    reviews: 210,
    tier: 'free',
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1000",
    description: "Classic cuts and shaves for the modern gentleman.",
    approved: true
  }
];

export const SERVICE_TYPES = [
  "Hair Stylist",
  "Nail Technician",
  "Esthetician",
  "Makeup Artist",
  "Massage Therapist",
  "Barber",
  "Lash Technician"
];
