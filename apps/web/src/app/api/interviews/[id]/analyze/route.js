import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function POST(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  try {
    const { id } = params;
    const body = await request.json();
    const { mediaUrl, mediaType } = body;

    if (!mediaUrl) {
      return Response.json({ error: "No media URL provided" }, { status: 400 });
    }

    // Resolving relative URLs if necessary
    let fetchUrl = mediaUrl;
    if (mediaUrl.startsWith("/")) {
      const baseUrl = process.env.APP_URL || "http://localhost:4000";
      fetchUrl = new URL(mediaUrl, baseUrl).toString();
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        "OPENAI_API_KEY is not set. Mocking response for demo purposes.",
      );
      const mockText =
        "I was operating the forklift in Aisle 4 when I noticed the pallet was unstable. I tried to correct it but it tipped over. The lighting was a bit dim in that area.";

      await sql`
        UPDATE interviews
        SET written_statement = ${mockText}
        WHERE id = ${id}
      `;

      return Response.json({
        text: mockText,
        suggestions: [
          "Photo of the unstable pallet",
          "Photo of the lighting in Aisle 4",
          "Photo of the forklift load backrest",
        ],
      });
    }

    // 1. Download the file
    const fileResponse = await fetch(fetchUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download media file from ${fetchUrl}`);
    }
    const blob = await fileResponse.blob();

    // 2. Transcribe with Whisper
    const formData = new FormData();
    const filename = mediaType === "video" ? "video.mp4" : "audio.m4a";
    formData.append("file", blob, filename);
    formData.append("model", "whisper-1");

    const transcriptionResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      },
    );

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error("Whisper API Error:", errorText);
      throw new Error(
        `Whisper API failed: ${transcriptionResponse.statusText}`,
      );
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcribedText = transcriptionData.text;

    // 3. Update Database
    await sql`
      UPDATE interviews
      SET written_statement = ${transcribedText}
      WHERE id = ${id}
    `;

    // 4. Analyze with GPT-4
    const systemPrompt = `
      You are an expert safety incident investigator.
      Analyze the following witness statement and identify potential physical evidence that should be collected (photos, videos, documents).
      Return ONLY a JSON object with a key "suggestions" which is an array of strings.
      Example: { "suggestions": ["Photo of the damaged forklift forks", "Photo of the lighting conditions in the aisle"] }
    `;

    const gptResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcribedText },
          ],
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!gptResponse.ok) {
      console.error("GPT API Error:", await gptResponse.text());
      return Response.json({
        text: transcribedText,
        suggestions: [],
        warning: "Analysis failed, but transcription was saved.",
      });
    }

    const gptData = await gptResponse.json();
    let analysis;
    try {
      analysis = JSON.parse(gptData.choices[0].message.content);
    } catch (e) {
      console.error("Failed to parse GPT response", e);
      analysis = { suggestions: [] };
    }

    return Response.json({
      text: transcribedText,
      suggestions: analysis.suggestions || [],
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
