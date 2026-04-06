import PersonalCompanyRouteGuard from "@/components/dashboard/shared/PersonalCompanyRouteGuard";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PersonalCompanyRouteGuard>{children}</PersonalCompanyRouteGuard>;
}
