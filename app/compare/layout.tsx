import CustomerHeader from "@/components/CustomerHeader";

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CustomerHeader />
      {children}
    </div>
  );
}
