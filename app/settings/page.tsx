import { getOrCreateSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getOrCreateSettings();
  return (
    <SettingsForm
      initialGrid={settings.referenceGrid}
      adminTokenConfigured={Boolean(process.env.ADMIN_TOKEN)}
    />
  );
}
