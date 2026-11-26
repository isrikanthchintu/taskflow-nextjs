import { WorkspacePage } from "@/components/workspace-page";

export default async function WorkspaceRoute({
  params
}: {
  params: Promise<{ workspaceId: string; section: string }>;
}) {
  const { workspaceId, section } = await params;
  return <WorkspacePage workspaceId={workspaceId} section={section} />;
}
