/**
 * Domain reference data shared by the API and the seed script.
 * Nothing here is presentation data — it is validation/reference data only.
 */

export const NIGERIAN_STATES = [
  'All Nigeria',
  'Lagos',
  'Abuja (FCT)',
  'Port Harcourt (Rivers)',
  'Enugu',
  'Onitsha (Anambra)',
  'Benin City (Edo)',
  'Ibadan (Oyo)',
  'Aba (Abia)',
  'Kano',
  'Kaduna',
  'Asaba (Delta)',
  'Owerri (Imo)',
  'Uyo (Akwa Ibom)',
  'Calabar (Cross River)',
];

export const NIGERIAN_BANKS = [
  'Access Bank Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'Zenith Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Microfinance Bank',
  'Moniepoint Microfinance Bank',
  'OPay Digital Services',
  'Stanbic IBTC Bank',
  'Fidelity Bank',
  'Wema Bank / ALAT',
  'Union Bank of Nigeria',
  'Sterling Bank',
  'Polaris Bank',
];

export const COURIERS = ['GIG Logistics', 'Speedaf Express', 'DHL Express Nigeria'] as const;

export const PRODUCT_CONDITIONS = [
  'Brand New',
  'UK Used',
  'Foreign Used',
  'Nigerian Used',
  'Refurbished',
] as const;

export const PRODUCT_BADGES = [
  '15% OFF',
  '20% OFF',
  'Limited Deal',
  'Popular',
  'Best Price',
  'New',
] as const;

export type CourierName = (typeof COURIERS)[number];
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];
export type ProductBadge = (typeof PRODUCT_BADGES)[number];

/**
 * Escrow waybill pricing per delivery state, in Naira. `default` applies to any
 * state without an explicit entry. This is the single source of truth used by
 * both checkout (order creation) and the storefront order summary.
 */
export const SHIPPING_FEES: Record<string, number> = {
  Lagos: 3500,
  'Abuja (FCT)': 3500,
  Abuja: 3500,
  'Port Harcourt (Rivers)': 6500,
  Rivers: 6500,
  'Ibadan (Oyo)': 4500,
  Oyo: 4500,
  Enugu: 6500,
  Kano: 6500,
  Kaduna: 6500,
  'Benin City (Edo)': 6000,
  Edo: 6000,
  'Onitsha (Anambra)': 6000,
  Anambra: 6000,
  'Aba (Abia)': 6000,
  Abia: 6000,
  'Asaba (Delta)': 6000,
  Delta: 6000,
  'Owerri (Imo)': 6000,
  Imo: 6000,
  'Uyo (Akwa Ibom)': 6500,
  'Akwa Ibom': 6500,
  'Calabar (Cross River)': 6500,
  'Cross River': 6500,
  default: 5500,
};

export const SESSION_COOKIE = 'komback_session';
export const GUEST_COOKIE = 'komback_guest';
export const SESSION_TTL_DAYS = 30;
