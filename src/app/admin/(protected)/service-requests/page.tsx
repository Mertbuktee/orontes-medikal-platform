import { redirect } from "next/navigation";

type AdminServiceRequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminServiceRequestsPage({
  searchParams,
}: AdminServiceRequestsPageProps) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  redirect(query ? `/technical/service-requests?${query}` : "/technical/service-requests");
}
