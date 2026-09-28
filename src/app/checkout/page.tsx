import { CheckoutEntry } from '@/components/CheckoutEntry';

interface CheckoutPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const query = await searchParams;
  const rawPlan = query.plan;
  const planValues = Array.isArray(rawPlan) ? rawPlan : rawPlan === undefined ? [] : [rawPlan];

  return <CheckoutEntry planValues={planValues} />;
}
