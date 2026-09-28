import { CheckoutEntry } from '@/components/CheckoutEntry';

interface CheckoutPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const query = await searchParams;
  const rawPlan = query.plan;
  const planValues = Array.isArray(rawPlan) ? rawPlan : rawPlan === undefined ? [] : [rawPlan];
  const rawPayment = query.payment;
  const paymentValues = Array.isArray(rawPayment) ? rawPayment : rawPayment === undefined ? [] : [rawPayment];
  const paymentReturnKind = paymentValues.length === 1 ? paymentValues[0] ?? null : null;

  return <CheckoutEntry planValues={planValues} paymentReturnKind={paymentReturnKind} />;
}
