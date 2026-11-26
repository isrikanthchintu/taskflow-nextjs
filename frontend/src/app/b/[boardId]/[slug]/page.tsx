import { BoardEntry } from "@/components/app-entries";

export default async function BoardRoute({
  params
}: {
  params: Promise<{ boardId: string; slug: string }>;
}) {
  const { boardId } = await params;
  return <BoardEntry boardId={boardId} />;
}
