import { Router } from 'express';
import { prisma } from '../db';
import { attachIdentity, type AuthedRequest } from '../auth';
import { asInt, asString, asStringArray, asyncHandler, badRequest } from '../http';

export const paymentsRouter = Router();

paymentsRouter.use(attachIdentity);

const randomSuffix = () => Math.random().toString(36).substring(2, 8).toUpperCase();

async function recordProviderTransaction(input: {
  reference: string;
  provider: 'paystack' | 'flutterwave';
  amount: number;
  orderNumbers: string[];
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  userId?: string | null;
}) {
  const orders = input.orderNumbers.length
    ? await prisma.order.findMany({
        where: { orderNumber: { in: input.orderNumbers } },
        select: { id: true, storeId: true, orderNumber: true, paymentStatus: true, total: true },
      })
    : [];

  for (const order of orders) {
    const alreadyLocked = order.paymentStatus === 'PAID';
    const value = order.total || input.amount;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: input.status === 'COMPLETED' ? 'PAID' : input.status === 'FAILED' ? 'FAILED' : 'PENDING',
        paymentProvider: input.provider,
        paymentReference: input.reference,
        ...(input.status === 'COMPLETED' ? { status: 'ESCROW_SECURED' as const } : {}),
      },
    });

    await prisma.transaction.upsert({
      where: { reference: `${input.reference}-${order.orderNumber}` },
      create: {
        reference: `${input.reference}-${order.orderNumber}`,
        type: 'ESCROW_SECURED',
        status: input.status,
        amount: value,
        description: `${input.provider} payment for order ${order.orderNumber}`,
        account: 'Komback Escrow Vault',
        provider: input.provider,
        providerRef: input.reference,
        orderId: order.id,
        storeId: order.storeId,
      },
      update: { status: input.status, providerRef: input.reference },
    });

    // Escrow is locked exactly once per order — the first time it is marked paid.
    if (input.status === 'COMPLETED' && !alreadyLocked) {
      await prisma.wallet.upsert({
        where: { storeId: order.storeId },
        create: { storeId: order.storeId, escrowLocked: value },
        update: { escrowLocked: { increment: value } },
      });
    }
  }

  if (orders.length === 0) {
    await prisma.transaction.upsert({
      where: { reference: input.reference },
      create: {
        reference: input.reference,
        type: 'ESCROW_SECURED',
        status: input.status,
        amount: input.amount,
        description: `${input.provider} payment (unlinked to an order)`,
        account: 'Komback Escrow Vault',
        provider: input.provider,
        providerRef: input.reference,
      },
      update: { status: input.status },
    });
  }
}

// ---------------------------------------------------------------------------
// Paystack
// ---------------------------------------------------------------------------

paymentsRouter.post(
  '/paystack/initialize',
  asyncHandler(async (req: AuthedRequest, res) => {
    const email = asString(req.body.email);
    const amount = asInt(req.body.amount);
    const orderNumbers = asStringArray(req.body.orderNumbers);
    const callbackUrl = asString(req.body.callbackUrl);
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!email || !amount) return badRequest(res, 'Email and amount are required');

    const reference = `KB_PSTK_${Date.now()}_${randomSuffix()}`;

    if (!secretKey) {
      await recordProviderTransaction({
        reference,
        provider: 'paystack',
        amount,
        orderNumbers,
        status: 'PENDING',
        userId: req.user?.id ?? null,
      });

      return res.json({
        status: true,
        message: 'Paystack checkout initialized (keys not configured — sandbox mode)',
        data: {
          authorization_url: `https://checkout.paystack.com/simulate_${reference}`,
          access_code: `access_${reference}`,
          reference,
          isSimulated: true,
        },
      });
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        reference,
        callback_url: callbackUrl || `${process.env.APP_URL || ''}/account`,
        metadata: { ...(req.body.metadata ?? {}), orderNumbers },
      }),
    });

    const data = (await response.json()) as { status?: boolean; data?: { reference?: string } };

    await recordProviderTransaction({
      reference: data?.data?.reference ?? reference,
      provider: 'paystack',
      amount,
      orderNumbers,
      status: 'PENDING',
      userId: req.user?.id ?? null,
    });

    res.json(data);
  })
);

paymentsRouter.get(
  '/paystack/verify/:reference',
  asyncHandler(async (req, res) => {
    const reference = asString(req.params.reference);
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      await prisma.transaction.updateMany({
        where: { reference: { startsWith: reference } },
        data: { status: 'COMPLETED' },
      });
      return res.json({
        status: true,
        message: 'Verification successful (simulated sandbox test)',
        data: { status: 'success', reference, currency: 'NGN', isSimulated: true },
      });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey.trim()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = (await response.json()) as { data?: { status?: string; amount?: number } };
    const succeeded = data?.data?.status === 'success';

    await prisma.transaction.updateMany({
      where: { providerRef: reference },
      data: { status: succeeded ? 'COMPLETED' : 'FAILED' },
    });
    await prisma.order.updateMany({
      where: { paymentReference: reference },
      data: { paymentStatus: succeeded ? 'PAID' : 'FAILED' },
    });

    res.json(data);
  })
);

// ---------------------------------------------------------------------------
// Flutterwave
// ---------------------------------------------------------------------------

paymentsRouter.post(
  '/flutterwave/initialize',
  asyncHandler(async (req: AuthedRequest, res) => {
    const email = asString(req.body.email);
    const amount = asInt(req.body.amount);
    const orderNumbers = asStringArray(req.body.orderNumbers);
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!email || !amount) return badRequest(res, 'Email and amount are required');

    const txRef = `KB_FLW_${Date.now()}_${randomSuffix()}`;

    if (!secretKey) {
      await recordProviderTransaction({
        reference: txRef,
        provider: 'flutterwave',
        amount,
        orderNumbers,
        status: 'PENDING',
        userId: req.user?.id ?? null,
      });

      return res.json({
        status: 'success',
        message: 'Flutterwave checkout initialized (keys not configured — sandbox mode)',
        data: { link: `https://checkout.flutterwave.com/simulate_${txRef}`, tx_ref: txRef, isSimulated: true },
      });
    }

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: 'NGN',
        redirect_url: asString(req.body.redirectUrl) || `${process.env.APP_URL || ''}/account`,
        meta: { ...(req.body.metadata ?? {}), orderNumbers },
        customer: {
          email,
          phonenumber: asString(req.body.phone, '+2348000000000'),
          name: asString(req.body.name, 'Komback Merchant'),
        },
        customizations: {
          title: asString(req.body.title, 'Komback Marketplace Order'),
          description: asString(req.body.description, 'Escrow protected marketplace purchase'),
        },
      }),
    });

    const data = (await response.json()) as { data?: { tx_ref?: string } };

    await recordProviderTransaction({
      reference: data?.data?.tx_ref ?? txRef,
      provider: 'flutterwave',
      amount,
      orderNumbers,
      status: 'PENDING',
      userId: req.user?.id ?? null,
    });

    res.json(data);
  })
);

paymentsRouter.get(
  '/flutterwave/verify/:reference',
  asyncHandler(async (req, res) => {
    const reference = asString(req.params.reference);
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secretKey) {
      await prisma.transaction.updateMany({
        where: { reference: { startsWith: reference } },
        data: { status: 'COMPLETED' },
      });
      return res.json({
        status: 'success',
        message: 'Transaction verified successfully (simulated sandbox test)',
        data: { status: 'successful', tx_ref: reference, currency: 'NGN', isSimulated: true },
      });
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey.trim()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = (await response.json()) as { data?: { status?: string } };
    const succeeded = data?.data?.status === 'successful';

    await prisma.transaction.updateMany({
      where: { providerRef: reference },
      data: { status: succeeded ? 'COMPLETED' : 'FAILED' },
    });
    await prisma.order.updateMany({
      where: { paymentReference: reference },
      data: { paymentStatus: succeeded ? 'PAID' : 'FAILED' },
    });

    res.json(data);
  })
);

/** Persists an escrow payment for orders created at checkout. */
paymentsRouter.post(
  '/payments/record',
  asyncHandler(async (req: AuthedRequest, res) => {
    const reference = asString(req.body.reference) || `ESC_${Date.now()}_${randomSuffix()}`;
    const amount = asInt(req.body.amount);
    const orderNumbers = asStringArray(req.body.orderNumbers);
    const provider = asString(req.body.provider, 'escrow') as 'paystack' | 'flutterwave';

    if (!amount || orderNumbers.length === 0) {
      return badRequest(res, 'amount and orderNumbers are required');
    }

    await recordProviderTransaction({
      reference,
      provider,
      amount,
      orderNumbers,
      status: 'COMPLETED',
      userId: req.user?.id ?? null,
    });

    res.status(201).json({ reference, success: true });
  })
);
