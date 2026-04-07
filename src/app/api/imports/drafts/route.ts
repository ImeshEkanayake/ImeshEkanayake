import { createDraftDocuments } from "@/lib/ingest/drafts";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await createDraftDocuments(payload);

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create draft documents.";
    return Response.json({ message }, { status: 400 });
  }
}
