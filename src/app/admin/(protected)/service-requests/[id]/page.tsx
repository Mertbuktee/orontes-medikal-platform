import { redirect } from "next/navigation";

type AdminServiceRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminServiceRequestDetailPage({
  params,
}: AdminServiceRequestDetailPageProps) {
  const { id } = await params;
  redirect(`/technical/service-requests/${id}`);
}
