import CustomerHeader from "@/components/CustomerHeader";

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CustomerHeader />
      {children}
    </div>
  );
}
