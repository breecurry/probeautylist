
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
    approved: true,
    phone: "(555) 123-4567",
    address: "123 Main St, Suite 101, Downtown, Cityville",
    funFacts: [
      "I've been styling hair for over 10 years!",
      "I was a finalist in the National Hair Awards 2023.",
      "I love creating custom color blends for my clients."
    ],
    reviewList: [
      { id: 1, user: "Jessica M.", rating: 5, date: "2 days ago", text: "Sarah is amazing! My hair has never looked better. The color is exactly what I wanted." },
      { id: 2, user: "Ashley T.", rating: 5, date: "1 week ago", text: "Best salon in downtown. Professional, clean, and friendly staff." },
      { id: 3, user: "Michelle K.", rating: 4, date: "2 weeks ago", text: "Great cut, but took a bit longer than expected." }
    ]
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
    approved: true,
    phone: "(555) 987-6543",
    address: "456 West Ave, Westside, Cityville",
    funFacts: [
      "I can hand-paint tiny characters on nails!",
      "My favorite nail shape is almond.",
      "I use only non-toxic, vegan polishes."
    ],
    reviewList: [
      { id: 1, user: "Lauren P.", rating: 5, date: "3 days ago", text: "Emily is a true artist! Her designs are incredible." },
      { id: 2, user: "Sarah W.", rating: 5, date: "1 week ago", text: "My manicure lasted 3 weeks without chipping. Highly recommend!" }
    ]
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
    approved: true,
    phone: "(555) 555-0199",
    address: "789 North Blvd, North Hills, Cityville",
    funFacts: [
      "I'm a certified organic skincare specialist.",
      "I believe great skin starts from within."
    ],
    reviewList: [
      { id: 1, user: "Amanda B.", rating: 5, date: "1 week ago", text: "My skin is glowing! Jessica really knows her stuff." }
    ]
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
    approved: true,
    phone: "(555) 246-8101",
    address: "321 Central St, Downtown, Cityville",
    funFacts: [
      "I specialize in vintage-style cuts.",
      "I'm a huge sports fan!"
    ],
    reviewList: [
      { id: 1, user: "Tom H.", rating: 5, date: "1 day ago", text: "Best fade in the city. David is a pro." },
      { id: 2, user: "Mike R.", rating: 4, date: "3 weeks ago", text: "Good cut, fair price." }
    ]
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
