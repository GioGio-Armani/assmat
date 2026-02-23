import { prisma } from "@/lib/db";
import { serializeContract } from "@/lib/serialization";
import { HomeContracts } from "@/components/HomeContracts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const contracts = await prisma.contract.findMany({ orderBy: { createdAt: "desc" } });
  return <HomeContracts initialContracts={contracts.map(serializeContract)} />;
}
