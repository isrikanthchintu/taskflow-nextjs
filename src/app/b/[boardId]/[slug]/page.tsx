import { BoardPage } from "@/components/board-page";

export default async function BoardRoute({
  params
}: {
  params: Promise<{ boardId: string; slug: string }>;
}) {
  const { boardId } = await params;
  return <BoardPage boardId={boardId} />;
}
