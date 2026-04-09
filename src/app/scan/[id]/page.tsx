import { CycleDetailView } from "@/components/CycleDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CycleDetailPage({ params }: PageProps) {
  // Next.js 15: params is a Promise
  const { id } = await params;

  return <CycleDetailView cycleId={decodeURIComponent(id)} />;
}
