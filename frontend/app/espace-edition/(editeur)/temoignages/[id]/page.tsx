import { ReviewEditor } from "@/components/editor/ReviewEditor";

export default async function EditorReviewPage({ params }: { params: Promise<{ id: string }> }) {
  return <ReviewEditor id={(await params).id} />;
}
