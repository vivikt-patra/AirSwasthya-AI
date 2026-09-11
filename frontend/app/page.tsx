import DashboardShell from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/project-data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getDashboardData();

  return <DashboardShell data={data} />;
}
