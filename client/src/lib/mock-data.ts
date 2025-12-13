
export const ALL_FEATURES = [
  { id: 'profile', name: 'Business Profile', category: 'core' },
  { id: 'search', name: 'Search Listing', category: 'core' },
  { id: 'bookings', name: 'Unlimited Bookings', category: 'core' },
  { id: 'reviews', name: 'Client Reviews', category: 'core' },
  { id: 'client_notes', name: 'Client Notes', category: 'core' },
  { id: 'portfolio_5', name: 'Portfolio (5 Photos)', category: 'portfolio' },
  { id: 'portfolio_30', name: 'Portfolio (30 Photos)', category: 'portfolio' },
  { id: 'portfolio_unlimited', name: 'Unlimited Portfolio', category: 'portfolio' },
  { id: 'social', name: 'Social Features (Likes/Comments)', category: 'engagement' },
  { id: 'before_after', name: 'Before & After Gallery', category: 'engagement' },
  { id: 'review_photos', name: 'Reviews with Photos', category: 'engagement' },
  { id: 'waitlist', name: 'Waitlist Management', category: 'booking' },
  { id: 'group_booking', name: 'Group Bookings', category: 'booking' },
  { id: 'no_show', name: 'No-Show Protection', category: 'booking' },
  { id: 'inspiration_board', name: 'Style Inspiration Board', category: 'engagement' },
  { id: 'staff_mgmt', name: 'Staff Management', category: 'business' },
  { id: 'gift_cards', name: 'Online Gift Cards', category: 'business' },
  { id: 'smart_rebook', name: 'Smart Rebooking', category: 'automation' },
  { id: 'auto_followup', name: 'Automated Follow-ups', category: 'automation' },
  { id: 'social_auto', name: 'Social Media Integration', category: 'automation' },
  { id: 'expense_track', name: 'Expense Tracking & Profit', category: 'analytics' },
  { id: 'analytics', name: 'Business Analytics Dashboard', category: 'analytics' },
  { id: 'loyalty', name: 'Loyalty & Referral Program', category: 'marketing' },
  { id: 'priority_booking', name: 'Priority Booking Experience', category: 'marketing' },
  { id: 'vip_spotlight', name: 'VIP Spotlight Placement', category: 'marketing' },
  { id: 'ai_growth', name: 'AI Growth Insights', category: 'analytics' },
];

export const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: 'Free',
    priceValue: 0,
    description: 'Perfect for getting started',
    features: [
      'Business Profile',
      'Search Listing',
      'Unlimited Bookings',
      'Client Reviews',
      'Client Notes',
      'Portfolio (5 Photos)',
    ],
    includedFeatures: ['profile', 'search', 'bookings', 'reviews', 'client_notes', 'portfolio_5'],
    highlight: false,
    photoLimit: 5,
    socialFeatures: false
  },
  {
    id: 'bronze',
    name: 'Bronze',
    price: '$0.99',
    priceValue: 0.99,
    description: 'Great for growing businesses',
    features: [
      'Everything in Starter',
      'Portfolio (30 Photos)',
      'Social Features',
      'Before & After Gallery',
      'Reviews with Photos',
      'Waitlist Management',
      'Group Bookings',
      'No-Show Protection',
      'Style Inspiration Board',
      'Staff Management',
      'Online Gift Cards',
    ],
    includedFeatures: [
      'profile', 'search', 'bookings', 'reviews', 'client_notes', 'portfolio_30',
      'social', 'before_after', 'review_photos', 'waitlist', 'group_booking',
      'no_show', 'inspiration_board', 'staff_mgmt', 'gift_cards'
    ],
    highlight: false,
    photoLimit: 30,
    socialFeatures: true
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '$5.00',
    priceValue: 5.00,
    description: 'For established professionals',
    features: [
      'Everything in Bronze',
      'Unlimited Portfolio',
      'Top of Search Results',
    ],
    includedFeatures: [
      'profile', 'search', 'bookings', 'reviews', 'client_notes', 'portfolio_unlimited',
      'social', 'before_after', 'review_photos', 'waitlist', 'group_booking',
      'no_show', 'inspiration_board', 'staff_mgmt', 'gift_cards'
    ],
    highlight: false,
    photoLimit: 9999,
    socialFeatures: true
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '$20.00',
    priceValue: 20.00,
    description: 'Premium features for top performers',
    features: [
      'Everything in Silver',
      'Smart Rebooking',
      'Automated Follow-ups',
      'Social Media Integration',
      'Expense Tracking & Profit',
      'Business Analytics Dashboard',
      'Loyalty & Referral Program',
      'Priority Booking Experience',
      'VIP Spotlight Placement',
      'AI Growth Insights',
    ],
    includedFeatures: [
      'profile', 'search', 'bookings', 'reviews', 'client_notes', 'portfolio_unlimited',
      'social', 'before_after', 'review_photos', 'waitlist', 'group_booking',
      'no_show', 'inspiration_board', 'staff_mgmt', 'gift_cards',
      'smart_rebook', 'auto_followup', 'social_auto', 'expense_track',
      'analytics', 'loyalty', 'priority_booking', 'vip_spotlight', 'ai_growth'
    ],
    highlight: true,
    photoLimit: 9999,
    socialFeatures: true
  }
];

export const FEATURE_COMPARISON = [
  { category: 'Core Features', features: [
    { name: 'Business Profile', free: true, bronze: true, silver: true, gold: true },
    { name: 'Search Listing', free: true, bronze: true, silver: true, gold: true },
    { name: 'Unlimited Bookings', free: true, bronze: true, silver: true, gold: true },
    { name: 'Client Reviews', free: true, bronze: true, silver: true, gold: true },
    { name: 'Client Notes', free: true, bronze: true, silver: true, gold: true },
  ]},
  { category: 'Portfolio', features: [
    { name: 'Portfolio Photos', free: '5', bronze: '30', silver: 'Unlimited', gold: 'Unlimited' },
    { name: 'Social Features (Likes/Comments)', free: false, bronze: true, silver: true, gold: true },
  ]},
  { category: 'Booking Features', features: [
    { name: 'Before & After Gallery', free: false, bronze: true, silver: true, gold: true },
    { name: 'Waitlist Management', free: false, bronze: true, silver: true, gold: true },
    { name: 'Group Bookings', free: false, bronze: true, silver: true, gold: true },
    { name: 'No-Show Protection', free: false, bronze: true, silver: true, gold: true },
    { name: 'Style Inspiration Board', free: false, bronze: true, silver: true, gold: true },
    { name: 'Reviews with Photos', free: false, bronze: true, silver: true, gold: true },
  ]},
  { category: 'Business Tools', features: [
    { name: 'Staff Management', free: false, bronze: true, silver: true, gold: true },
    { name: 'Online Gift Cards', free: false, bronze: true, silver: true, gold: true },
  ]},
  { category: 'Automation (Gold Only)', features: [
    { name: 'Smart Rebooking', free: false, bronze: false, silver: false, gold: true },
    { name: 'Automated Follow-ups', free: false, bronze: false, silver: false, gold: true },
    { name: 'Social Media Integration', free: false, bronze: false, silver: false, gold: true },
  ]},
  { category: 'Analytics & Growth (Gold Only)', features: [
    { name: 'Expense Tracking & Profit', free: false, bronze: false, silver: false, gold: true },
    { name: 'Business Analytics Dashboard', free: false, bronze: false, silver: false, gold: true },
    { name: 'Loyalty & Referral Program', free: false, bronze: false, silver: false, gold: true },
    { name: 'AI Growth Insights', free: false, bronze: false, silver: false, gold: true },
  ]},
  { category: 'Premium Perks (Gold Only)', features: [
    { name: 'VIP Spotlight Placement', free: false, bronze: false, silver: false, gold: true },
    { name: 'Priority Booking Experience', free: false, bronze: false, silver: false, gold: true },
  ]},
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
    ],
    portfolio: [
      { id: 1, url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80", likes: 45, comments: 12, likedByMe: false },
      { id: 2, url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80", likes: 89, comments: 24, likedByMe: true },
      { id: 3, url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80", likes: 32, comments: 5, likedByMe: false },
      { id: 4, url: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80", likes: 112, comments: 31, likedByMe: true },
      { id: 5, url: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80", likes: 67, comments: 8, likedByMe: false },
      { id: 6, url: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80", likes: 23, comments: 2, likedByMe: false },
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
    ],
    portfolio: [
      { id: 1, url: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80", likes: 120, comments: 45, likedByMe: false },
      { id: 2, url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80", likes: 98, comments: 22, likedByMe: true },
      { id: 3, url: "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?auto=format&fit=crop&w=800&q=80", likes: 56, comments: 10, likedByMe: false },
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
    ],
    portfolio: [
       { id: 1, url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80", likes: 12, comments: 1, likedByMe: false },
       { id: 2, url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=800&q=80", likes: 8, comments: 0, likedByMe: false }
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
    ],
    portfolio: [
       { id: 1, url: "https://images.unsplash.com/photo-1593702295094-aea8c5c13d7e?auto=format&fit=crop&w=800&q=80", likes: 5, comments: 0, likedByMe: false },
       { id: 2, url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80", likes: 8, comments: 0, likedByMe: false },
       { id: 3, url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80", likes: 3, comments: 0, likedByMe: false }
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
