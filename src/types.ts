export interface Product {
  id: string;
  slug?: string;
  uniqueId?: string;
  title: string;
  price: number;
  originalPrice?: number;
  badge?: '15% OFF' | '20% OFF' | 'Limited Deal' | 'Popular' | 'Best Price' | 'New';
  images: string[];
  category: string;
  categorySlug: string;
  location: string;
  state: string;
  seller: {
    id: string;
    name: string;
    isVerified: boolean;
    rating: number;
    salesCount: number;
    location: string;
    phone?: string;
    avatar?: string;
    joinedYear: string;
    responseRate: string;
  };
  rating: number;
  reviewsCount: number;
  condition: 'Brand New' | 'UK Used' | 'Foreign Used' | 'Nigerian Used' | 'Refurbished';
  description: string;
  features?: string[];
  inStock: boolean;
  isTrending?: boolean;
  isDeal?: boolean;
  isFeaturedAd?: boolean;
  featuredBadgeText?: string;
  boostPlan?: string;
  boostExpiresAt?: string;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  tagline: string;
  isVerified: boolean;
  rating: number;
  salesCount: number;
  location: string;
  state: string;
  avatar: string;
  coverImage: string;
  category: string;
  description: string;
  phone: string;
  email: string;
  joinedDate: string;
  badges: string[];
  totalProducts: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount: number;
  image: string;
  description: string;
  popularSubcategories: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  image: string;
  tags: string[];
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  isVerifiedPurchase: boolean;
  sellerReply?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'seller';
  text: string;
  timestamp: string;
  productId?: string;
}

export type PageType = 
  | 'home' 
  | 'products' 
  | 'product-detail' 
  | 'stores' 
  | 'store-detail' 
  | 'deals' 
  | 'sell' 
  | 'blog' 
  | 'blog-detail' 
  | 'cart' 
  | 'wishlist' 
  | 'account'
  | 'safety'
  | 'about-us'
  | 'track-order';
