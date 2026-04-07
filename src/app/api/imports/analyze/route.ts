import { analyzeIntakePayload } from "@/lib/ingest/analyze";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const review = analyzeIntakePayload(payload);

    return Response.json(review);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyse intake payload.";
    return Response.json({ message }, { status: 400 });
  }
}
