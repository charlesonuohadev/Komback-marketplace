// Initial marketplace taxonomy and editorial content.
// Imported verbatim from the previous static catalog so that PostgreSQL can be seeded
// with the live catalog. Consumed only by prisma/seed.ts.
import type { BlogPost, Category, Review, Store } from '../../src/types';

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'phones-tablets',
    name: 'Phones & Tablets',
    slug: 'phones-tablets',
    icon: '📱',
    itemCount: 4280,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
    description: 'Smartphones, Tablets, Smartwatches & Mobile Accessories',
    popularSubcategories: ['iPhones', 'Samsung Galaxy', 'AirPods', 'Power Banks', 'iPads', 'Smartwatches']
  },
  {
    id: 'vehicles',
    name: 'Vehicles & Cars',
    slug: 'vehicles',
    icon: '🚗',
    itemCount: 1850,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80',
    description: 'Tokunbo & Nigerian Used Cars, SUVs, Bikes & Auto Parts',
    popularSubcategories: ['Toyota Camry', 'Lexus RX350', 'Honda Accord', 'Mercedes-Benz', 'Motorcycles', 'Car Parts']
  },
  {
    id: 'fashion',
    name: 'Fashion & Wear',
    slug: 'fashion',
    icon: '👗',
    itemCount: 8940,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80',
    description: 'Men & Women Clothing, Shoes, Bags, Traditional Attires & Jewelry',
    popularSubcategories: ['Agbada & Senator Wear', 'Sneakers', 'Luxury Watches', 'Dresses', 'Handbags', 'Human Hair']
  },
  {
    id: 'electronics',
    name: 'Electronics & Laptops',
    slug: 'electronics',
    icon: '💻',
    itemCount: 3620,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    description: 'Laptops, TVs, Audio Systems, Generators & Solar Inverters',
    popularSubcategories: ['MacBooks', 'HP / Dell Laptops', 'Smart TVs', 'Solar Inverters', 'Bluetooth Speakers', 'Cameras']
  },
  {
    id: 'real-estate',
    name: 'Real Estate & Land',
    slug: 'real-estate',
    icon: '🏠',
    itemCount: 1240,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80',
    description: 'Apartments for Rent, Houses for Sale, Shortlets & Land in Nigeria',
    popularSubcategories: ['Lekki Apartments', 'Abuja Duplexes', 'Land in Ibeju Lekki', 'Shortlet Apartments', 'Commercial Shops']
  },
  {
    id: 'beauty',
    name: 'Beauty & Hair',
    slug: 'beauty',
    icon: '💄',
    itemCount: 5120,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    description: 'Skincare, Fragrances, Human Hair Wigs, Makeup & Grooming',
    popularSubcategories: ['Bone Straight Wigs', 'Original Perfumes', 'Organic Skincare', 'Cosmetics', 'Men Grooming']
  },
  {
    id: 'home-office',
    name: 'Home & Office',
    slug: 'home-office',
    icon: '🛋️',
    itemCount: 2980,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
    description: 'Furniture, Kitchen Appliances, Bedding, Office Chairs & Decor',
    popularSubcategories: ['Living Room Sofas', 'Air Conditioners', 'Orthopedic Mattresses', 'Office Desks', 'Refrigerators']
  },
  {
    id: 'food',
    name: 'Food & Groceries',
    slug: 'food',
    icon: '🍎',
    itemCount: 1670,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    description: 'Fresh Farm Produce, Packaged Goods, Nigerian Spices & Drinks',
    popularSubcategories: ['Tubers of Yam', 'Bags of Rice', 'Palm Oil & Spices', 'Frozen Foods', 'Pastries & Cakes']
  },
  {
    id: 'gaming',
    name: 'Gaming & Consoles',
    slug: 'gaming',
    icon: '🎮',
    itemCount: 1420,
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
    description: 'PlayStation 5, Xbox, Nintendo Switch, Game Discs & Accessories',
    popularSubcategories: ['PS5 Consoles', 'FIFA / EA FC 25', 'PS4 Controllers', 'Gaming Laptops', 'VR Headsets']
  },
  {
    id: 'jobs-services',
    name: 'Jobs & Services',
    slug: 'jobs-services',
    icon: '💼',
    itemCount: 3100,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    description: 'Artisans, Logistics, Tech Freelancers, Cleaning & Job Vacancies',
    popularSubcategories: ['Electricians & AC Tech', 'Graphics & Web Design', 'Dispatch Riders', 'Catering', 'Driver Jobs']
  },
  {
    id: 'education',
    name: 'Education & Books',
    slug: 'education',
    icon: '📚',
    itemCount: 890,
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    description: 'Academic Textbooks, Professional Exam Materials, Courses & Novels',
    popularSubcategories: ['JAMB & WAEC Books', 'ICAN Materials', 'Tech Coding Courses', 'Novels & Self Help']
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    slug: 'sports',
    icon: '⚽',
    itemCount: 1150,
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    description: 'Football Jerseys, Gym Equipment, Dumbbells & Activewear',
    popularSubcategories: ['Club Jerseys', 'Treadmills & Dumbbells', 'Football Boots', 'Yoga Mats', 'Supplements']
  }
];

export const SEED_STORES: Store[] = [
  {
    id: 'store-jenny-phones',
    name: 'Jenny Phones & Gadgets',
    tagline: 'Direct UK & US Apple, Samsung & Google Pixel Importers',
    isVerified: true,
    rating: 4.9,
    salesCount: 1250,
    location: 'Computer Village, Ikeja, Lagos',
    state: 'Lagos',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000&auto=format&fit=crop&q=80',
    category: 'Phones & Tablets',
    description: 'Top rated gadget vendor in Computer Village Ikeja for 6+ years. 100% genuine factory unlocked devices with full warranty & receipt.',
    phone: '+234 803 456 7890',
    email: 'sales@jennyphones.ng',
    joinedDate: '2020',
    badges: ['Verified Merchant', 'Physical Store', 'Same Day Delivery Lagos', '7-Day Return Policy'],
    totalProducts: 48
  },
  {
    id: 'store-autohub-ng',
    name: 'AutoHub Nigeria',
    tagline: 'Tokunbo & Clean Nigerian Used Luxury Vehicles',
    isVerified: true,
    rating: 4.8,
    salesCount: 340,
    location: 'Victoria Island, Lagos',
    state: 'Lagos',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop&q=80',
    category: 'Vehicles & Cars',
    description: 'Customs cleared, zero-accident Tokunbo cars inspected by certified automobile mechanics. Test drives available.',
    phone: '+234 812 999 4433',
    email: 'contact@autohub.ng',
    joinedDate: '2019',
    badges: ['Verified Dealer', 'Customs Duty Paid', 'Inspection Report Provided'],
    totalProducts: 24
  },
  {
    id: 'store-glamour-heritage',
    name: 'Glamour Heritage Fashion',
    tagline: 'Luxury Native Attires, Designer Sneakers & Ready-to-Wear',
    isVerified: true,
    rating: 4.9,
    salesCount: 890,
    location: 'Lekki Phase 1, Lagos',
    state: 'Lagos',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&auto=format&fit=crop&q=80',
    category: 'Fashion & Wear',
    description: 'Premium Nigerian handcrafted Senator wears, luxury Agbada, imported designer sneakers and luxury accessories.',
    phone: '+234 701 234 5678',
    email: 'info@glamourheritage.com',
    joinedDate: '2021',
    badges: ['Verified Brand', 'Bespoke Tailoring', 'Nationwide Waybill'],
    totalProducts: 65
  },
  {
    id: 'store-techbazaar-abuja',
    name: 'TechBazaar Abuja',
    tagline: 'Laptops, Inverters, Gaming & Pro Computing Workstations',
    isVerified: true,
    rating: 4.7,
    salesCount: 620,
    location: 'Wuse II, Abuja (FCT)',
    state: 'Abuja (FCT)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80',
    category: 'Electronics & Laptops',
    description: 'The preferred computing and tech solution hub in the Federal Capital Territory. MacBooks, Dell XPS, Gaming Rigs & Solar Backup.',
    phone: '+234 809 111 2233',
    email: 'abuja@techbazaar.ng',
    joinedDate: '2021',
    badges: ['Verified Vendor', 'Abuja Showroom', '1 Year Warranty'],
    totalProducts: 36
  },
  {
    id: 'store-gadgetzone-onitsha',
    name: 'GadgetZone Onitsha',
    tagline: 'Wholesale & Retail Mobile Accessories & Electronics',
    isVerified: true,
    rating: 4.8,
    salesCount: 1450,
    location: 'Main Market, Onitsha, Anambra',
    state: 'Onitsha (Anambra)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1000&auto=format&fit=crop&q=80',
    category: 'Electronics & Laptops',
    description: 'Leading wholesale distributor of fast chargers, power banks, screen guards, audio speakers in the South East.',
    phone: '+234 806 777 8899',
    email: 'support@gadgetzone.ng',
    joinedDate: '2018',
    badges: ['Verified Wholesaler', 'Fast Waybill Across East'],
    totalProducts: 72
  },
  {
    id: 'store-prime-properties-ph',
    name: 'Prime Heritage Properties',
    tagline: 'Verified Lands, Luxury Duplexes & Shortlets in Niger Delta',
    isVerified: true,
    rating: 4.9,
    salesCount: 180,
    location: 'GRA Phase 2, Port Harcourt, Rivers',
    state: 'Port Harcourt (Rivers)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80',
    category: 'Real Estate & Land',
    description: 'Registered real estate firm with verified Governor’s Consent titles, C of O lands, and luxury residential apartments.',
    phone: '+234 802 888 9900',
    email: 'info@primeheritage.ng',
    joinedDate: '2020',
    badges: ['Verified Real Estate Agency', 'Legal Title Checked'],
    totalProducts: 19
  }
];

export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'Top Phones to Buy in Nigeria in 2026: The Ultimate Value & Flagship Guide',
    excerpt: 'From budget warriors under ₦250,000 to powerhouse flagships like the iPhone 17 Pro Max and Samsung S25 Ultra, here are the top smartphone picks for Nigerian users.',
    content: `Nigeria's smartphone market is moving faster than ever. In 2026, buyers are looking for devices that deliver exceptional battery endurance for long days on the move, high-resolution cameras for social content and business listings, and strong 5G connectivity across all Nigerian telecom networks (MTN, Airtel, Glo).

### Flagship Category: The Premium Titans
For buyers prioritizing uncompromising speed, camera quality, and longevity:
- **Apple iPhone 17 Pro Max**: Outstanding battery longevity, titanium lightweight chassis, and unrivaled video capture for content creators and business owners.
- **Samsung Galaxy S25 Ultra**: Built-in S-Pen, 200MP camera zoom capabilities, and on-device AI translations for seamless international business communications.

### Mid-Range & Budget Kings
For great performance without spending millions of Naira:
- **Redmi Note 14 Pro+ & Tecno Camon 30 Premier**: Delivering 120Hz AMOLED displays, 100W+ fast charging, and clean designs under ₦400,000.

Always verify your vendor and inspect original IMEI numbers before completing delivery!`,
    category: 'Tech & Gadgets',
    date: 'Aug 14, 2026',
    readTime: '5 min read',
    author: {
      name: 'Chinedu Okafor',
      role: 'Senior Tech Editor at Komback',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
    },
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
    tags: ['iPhones', 'Samsung', 'Smartphones', 'Buying Guide']
  },
  {
    id: 'blog-2',
    title: 'How to Start an Online Business in Nigeria: Step-by-Step Playbook for 2026',
    excerpt: 'Discover how thousands of Nigerian merchants turn everyday products into sustainable monthly profits using multivendor marketplaces and social commerce.',
    content: `Starting an e-commerce business in Nigeria no longer requires millions in upfront capital for a physical showroom. Today, vendors across Lagos, Abuja, Onitsha, Kano, and Aba are scaling profitable ventures directly from home.

### 1. Identify High-Demand Niche Products
Products with consistent repeat purchase rates perform best:
- Mobile accessories & fast charging gadgets
- Native fashion and curated footwear
- Skincare, cosmetics, and human hair extensions
- Solar inverter accessories & power backup

### 2. Leverage Marketplace Trust Infrastructure
Instead of asking cold buyers to transfer money to unfamiliar bank accounts, listing on verified platforms like Komback gives your brand instant credibility:
- Verified seller badges build buyer trust
- Direct buyer messaging helps close sales in minutes
- Clear return policies protect both parties

### 3. Mastering Logistics & Delivery
Partner with reliable dispatch services in major metropolitan hubs like Lagos (GIG, Fez, local dispatch riders) and Interstate Waybill services for nationwide reach.`,
    category: 'Business & Seller Guide',
    date: 'Aug 11, 2026',
    readTime: '6 min read',
    author: {
      name: 'Amina Bello',
      role: 'Marketplace Growth Lead',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
    },
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    tags: ['Selling', 'E-commerce', 'Nigeria Business', 'Side Hustles']
  },
  {
    id: 'blog-3',
    title: 'Best Side Hustles That Pay Daily in Nigeria: 7 Proven Ideas',
    excerpt: 'Explore realistic, flexible side hustles you can run in your spare time in Nigeria to generate extra cash flow alongside your 9-to-5.',
    content: `With inflation and economic shifts, having multiple streams of income has transformed from a luxury into a vital necessity. Here are 7 practical side hustles that can generate steady Naira inflows daily:

1. **Dropshipping Gadgets & Fashion**: Curate listings from wholesalers in Computer Village or Trade Fair and mark up your profit.
2. **Shortlet Property Management**: Manage check-ins and cleaning for property owners in Lekki, Ikoyi, or Abuja.
3. **Dispatch & Interstate Waybill Coordination**: Bridge buyers outside Lagos with trusted merchants.
4. **Artisan & AC Repair Contracting**: High demand in major estates across Lagos and Port Harcourt.
5. **Catering & Healthy Meal Prep**: Daily lunch delivery for office workers in business districts.
6. **Social Media Listing Specialist**: Help local traditional market traders photograph and post their inventory online.
7. **Graphic Design & Digital Marketing**: Brand packages for new Nigerian small businesses.`,
    category: 'Finance & Hustle',
    date: 'Aug 08, 2026',
    readTime: '4 min read',
    author: {
      name: 'Tunde Adeleke',
      role: 'Financial Analyst',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
    },
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&auto=format&fit=crop&q=80',
    tags: ['Income', 'Side Hustle', 'Daily Pay', 'Freelance']
  },
  {
    id: 'blog-4',
    title: 'How to Buy Safely Online in Nigeria and Avoid Marketplace Scams',
    excerpt: 'Essential safety rules every Nigerian online shopper must follow: verifying sellers, avoiding fraudulent payment links, and safe meetup spots.',
    content: `Safety is the cornerstone of great online shopping. While the vast majority of sellers are genuine, hardworking entrepreneurs, caution is essential. Follow these rules for a worry-free experience:

### The Golden Rule of Online Safety
**Never transfer money directly to private unverified personal accounts without escrow protection or physical verification of high-value goods.**

### Key Checklist for Buyers:
- **Look for the Green Verified Seller Badge 🟢**: This means the seller’s identity, business premises, and phone number have been validated by Komback.
- **Inspect Before Handover**: When purchasing used cars, laptops, or smartphones, test the device thoroughly in public locations.
- **Communicate within the Platform**: Use Komback’s built-in seller chat to maintain records of price agreements and condition descriptions.
- **Price Check**: If a brand new iPhone 17 is listed for ₦300,000, it is almost certainly fraudulent. If a deal sounds too good to be true, it usually is!`,
    category: 'Safety & Trust',
    date: 'Aug 05, 2026',
    readTime: '4 min read',
    author: {
      name: 'Ngozi Eze',
      role: 'Trust & Safety Director',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80'
    },
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop&q=80',
    tags: ['Safety', 'Security', 'Anti-Scam', 'Verified Sellers']
  }
];

export const SEED_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    author: 'Samuel A.',
    location: 'Lekki, Lagos',
    rating: 5,
    date: '3 days ago',
    comment: 'I found exactly what I was looking for and the seller Jenny Phones was very responsive. The iPhone 17 Pro Max came factory sealed with receipt. Same day delivery in Lekki!',
    isVerifiedPurchase: true,
    sellerReply: 'Thank you for shopping with Jenny Phones! Enjoy your new device!'
  },
  {
    id: 'rev-2',
    productId: 'prod-2',
    author: 'Joy M.',
    location: 'Maitama, Abuja',
    rating: 5,
    date: '1 week ago',
    comment: 'Komback made it easy for me to discover verified sellers from Lagos and get my Nike Air Max delivered to Abuja in under 48 hours. Legit sneakers!',
    isVerifiedPurchase: true
  },
  {
    id: 'rev-3',
    productId: 'prod-4',
    author: 'Emeka N.',
    location: 'Independence Layout, Enugu',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Bought the M3 MacBook Pro from TechBazaar. Waybill to Enugu was smooth and safe. The packaging was top-notch with tamper-proof security seals.',
    isVerifiedPurchase: true,
    sellerReply: 'Appreciate the feedback Emeka! Wishing you smooth productivity with the M3 Pro.'
  },
  {
    id: 'rev-4',
    productId: 'prod-6',
    author: 'Babatunde K.',
    location: 'Ikeja, Lagos',
    rating: 5,
    date: '2 weeks ago',
    comment: 'PS5 Slim works like a charm. Tested with EA FC 25 and graphics are breathtaking. Very honest seller and transparent pricing.',
    isVerifiedPurchase: true
  }
];
