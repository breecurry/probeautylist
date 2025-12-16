
export const ALL_FEATURES = [
  { id: 'profile', name: 'Business Profile', category: 'core' },
  { id: 'search', name: 'Search Listing', category: 'core' },
  { id: 'bookings', name: 'Unlimited Bookings', category: 'core' },
  { id: 'reviews', name: 'Client Reviews', category: 'core' },
  { id: 'client_notes', name: 'Client Notes', category: 'core' },
  { id: 'portfolio_5', name: 'Portfolio (5 Photos)', category: 'portfolio' },
  { id: 'portfolio_15', name: 'Portfolio (15 Photos)', category: 'portfolio' },
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

// Yearly discount percentage
export const YEARLY_DISCOUNT = 0.15; // 15% discount

export const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: 'Free',
    priceValue: 0,
    yearlyPriceValue: 0,
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
    name: 'Growth',
    price: '$0.99',
    priceValue: 0.99,
    yearlyPriceValue: 10.09, // $0.99 * 12 * 0.85 = $10.09/year ($0.84/mo)
    description: 'Great for growing businesses',
    features: [
      'Everything in Starter',
      'Portfolio (15 Photos)',
      'Social Features',
      'Before & After Gallery',
      'Reviews with Photos',
      'Group Bookings',
      'No-Show Protection',
      'Online Gift Cards',
    ],
    includedFeatures: [
      'profile', 'search', 'bookings', 'reviews', 'client_notes', 'portfolio_15',
      'social', 'before_after', 'review_photos', 'group_booking',
      'no_show', 'gift_cards'
    ],
    highlight: false,
    photoLimit: 15,
    socialFeatures: true
  },
  {
    id: 'silver',
    name: 'Pro',
    price: '$5.00',
    priceValue: 5.00,
    yearlyPriceValue: 51.00, // $5.00 * 12 * 0.85 = $51.00/year ($4.25/mo)
    description: 'For established professionals',
    features: [
      'Everything in Growth',
      'Portfolio (30 Photos)',
      'Waitlist Management',
      'Style Inspiration Board',
      'Staff Management',
      'Top of Search Results',
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
    id: 'gold',
    name: 'Pro Premier 👑',
    price: '$20.00',
    priceValue: 20.00,
    yearlyPriceValue: 204.00, // $20.00 * 12 * 0.85 = $204.00/year ($17.00/mo)
    description: 'Premium features for top performers',
    features: [
      'Everything in Pro',
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
    { name: 'Portfolio Photos', free: '5', bronze: '15', silver: '30', gold: 'Unlimited' },
    { name: 'Social Features (Likes/Comments)', free: false, bronze: true, silver: true, gold: true },
  ]},
  { category: 'Booking Features', features: [
    { name: 'Before & After Gallery', free: false, bronze: true, silver: true, gold: true },
    { name: 'Waitlist Management', free: false, bronze: false, silver: true, gold: true },
    { name: 'Group Bookings', free: false, bronze: true, silver: true, gold: true },
    { name: 'No-Show Protection', free: false, bronze: true, silver: true, gold: true },
    { name: 'Style Inspiration Board', free: false, bronze: false, silver: true, gold: true },
    { name: 'Reviews with Photos', free: false, bronze: true, silver: true, gold: true },
  ]},
  { category: 'Business Tools', features: [
    { name: 'Staff Management', free: false, bronze: false, silver: true, gold: true },
    { name: 'Online Gift Cards', free: false, bronze: true, silver: true, gold: true },
  ]},
  { category: 'Automation (Pro Premier Only)', features: [
    { name: 'Smart Rebooking', free: false, bronze: false, silver: false, gold: true },
    { name: 'Automated Follow-ups', free: false, bronze: false, silver: false, gold: true },
    { name: 'Social Media Integration', free: false, bronze: false, silver: false, gold: true },
  ]},
  { category: 'Analytics & Growth (Pro Premier Only)', features: [
    { name: 'Expense Tracking & Profit', free: false, bronze: false, silver: false, gold: true },
    { name: 'Business Analytics Dashboard', free: false, bronze: false, silver: false, gold: true },
    { name: 'Loyalty & Referral Program', free: false, bronze: false, silver: false, gold: true },
    { name: 'AI Growth Insights', free: false, bronze: false, silver: false, gold: true },
  ]},
  { category: 'Premium Perks (Pro Premier Only)', features: [
    { name: 'VIP Spotlight Placement', free: false, bronze: false, silver: false, gold: true },
    { name: 'Priority Booking Experience', free: false, bronze: false, silver: false, gold: true },
  ]},
];

export const MOCK_BUSINESSES: any[] = [];

export const SERVICE_TYPES = [
  "Hair Stylist",
  "Nail Technician",
  "Esthetician",
  "Makeup Artist",
  "Massage Therapist",
  "Barber",
  "Lash Technician"
];
