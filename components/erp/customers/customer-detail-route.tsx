import { CustomerProfile } from "./customer-profile";

export function CustomerDetailRoute({ customerId }: { customerId: string }) {
  return <CustomerProfile customerId={customerId} />;
}
