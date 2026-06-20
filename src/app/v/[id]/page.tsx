import { Watch } from "./Watch";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Watch id={id} />;
}
