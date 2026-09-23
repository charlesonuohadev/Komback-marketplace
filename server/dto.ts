/**
 * Server-side response DTOs. Catalog DTOs intentionally match the shapes in
 * `src/types.ts` so the React client keeps working unchanged.
 */

export interface TransactionDTO {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  account: string;
}

export interface WalletDTO {
  availableBalance: number;
  escrowLocked: number;
  totalSettled: number;
  transactions: TransactionDTO[];
}

export interface SellerOrderDTO {
  id: string;
  itemTitle: string;
  itemImage: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCityState: string;
  amount: number;
  date: string;
  status: string;
  courier: string;
  waybillNumber: string;
  pinRequired: boolean;
  pinVerified: boolean;
  escrowReleaseDate: string;
}

export interface OrderMilestoneDTO {
  title: string;
  subtitle: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending';
  location: string;
}

export interface OrderTrackingDTO {
  orderNumber: string;
  waybillNumber: string;
  courier: string;
  courierLogo: string;
  statusText: string;
  statusBadge: 'in-transit' | 'out-for-delivery' | 'delivered';
  estimatedDelivery: string;
  origin: string;
  destination: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  riderName: string;
  riderPhone: string;
  handoverPin: string;
  item: {
    title: string;
    image: string;
    sellerName: string;
    isVerified: boolean;
    unitPrice: number;
    shippingFee: number;
    totalAmount: number;
    productRefId: string;
  };
  milestones: OrderMilestoneDTO[];
  logs: { time: string; date: string; location: string; description: string }[];
}

export interface MessageThreadDTO {
  id: string;
  buyerName: string;
  buyerAvatar: string;
  productTitle: string;
  productPrice: number;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: { sender: 'buyer' | 'seller'; text: string; time: string }[];
}

export interface SellerStatsDTO {
  totalRevenue: number;
  pendingEscrow: number;
  availablePayout: number;
  completedOrders: number;
  weeklySalesData: { day: string; amount: number; orders: number }[];
  totalVolume: number;
  avgOrderValue: number;
  storeVisits: number;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  avatar: string | null;
  location: string | null;
  state: string | null;
  storeId: string | null;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
