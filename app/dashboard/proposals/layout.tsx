import PersonalCompanyRouteGuard from "@/components/dashboard/shared/PersonalCompanyRouteGuard";

export default function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PersonalCompanyRouteGuard>{children}</PersonalCompanyRouteGuard>;
}
