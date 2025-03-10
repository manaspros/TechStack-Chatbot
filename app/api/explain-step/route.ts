import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

// Formatting helpers for the explanation
const formatExplanation = (text: string): string => {
  if (!text) return "";

  // Convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let formattedText = text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${url}</a>`;
  });

  // Convert bold text (text between * or **)
  formattedText = formattedText.replace(
    /\*\*(.*?)\*\*/g,
    "<strong class='text-green-400'>$1</strong>"
  );
  formattedText = formattedText.replace(
    /\*(.*?)\*/g,
    "<strong class='text-green-400'>$1</strong>"
  );

  // Convert italic text (text between _)
  formattedText = formattedText.replace(/_(.*?)_/g, "<em>$1</em>");

  // Handle unordered lists
  formattedText = formattedText.replace(
    /^[-*]\s(.+)$/gm,
    '<div class="flex items-start mb-1"><span class="mr-2 text-green-400">→</span><span>$1</span></div>'
  );

  // Handle line breaks
  formattedText = formattedText
    .split("\n")
    .map((line) => {
      if (
        line.includes('<div class="flex items-start') ||
        line.includes("<strong") ||
        line.includes("<em")
      ) {
        return line;
      }
      return line + "<br />";
    })
    .join("");

  return formattedText;
};

export async function POST(req: NextRequest) {
  try {
    // Simple auth check - explanation doesn't absolutely require auth,
    // but it's good to keep track of usage
    const isAuthed = await isAuthenticated();

    // Get request data
    const { stepId, stepTitle, stepType } = await req.json();

    if (!stepTitle) {
      return NextResponse.json(
        { error: "stepTitle field is required" },
        { status: 400 }
      );
    }

    // Format a prompt based on step type
    let prompt = "";
    switch (stepType) {
      case "prerequisite":
        prompt = `Explain this prerequisite step in a learning journey: "${stepTitle}". 
        Include why this foundational knowledge is important, how to acquire it, 
        and 2-3 specific resources (like documentation, tutorials or books) that would help.
        Keep the explanation under 150 words and format with bullet points for key concepts.`;
        break;

      case "core":
        prompt = `Explain this core concept in depth: "${stepTitle}". 
        Provide a clear explanation of what this involves, the key principles to understand, 
        common challenges learners face, and practical ways to master it.
        Include 1-2 example resources that provide the best explanations of this concept.
        Keep the explanation under 150 words and highlight important terms.`;
        break;

      case "practice":
        prompt = `Explain this practice/project step: "${stepTitle}".
        Describe what skills this practice will develop, how to approach it step by step,
        common pitfalls to avoid, and how to know when you've mastered it.
        Suggest 1-2 specific project ideas that would help implement this knowledge.
        Keep the explanation under 150 words and be practical.`;
        break;

      case "advanced":
        prompt = `Explain this advanced concept: "${stepTitle}".
        Detail why this is considered advanced, what prerequisites are needed,
        how it builds on earlier knowledge, and the specific benefits of mastering it.
        Mention 1-2 real-world applications where this is essential.
        Keep the explanation under 150 words and highlight what makes this topic powerful.`;
        break;

      default:
        prompt = `Explain this learning step in detail: "${stepTitle}".
        Include what it involves, why it's important, how to approach learning it,
        and 1-2 recommended resources.
        Keep the explanation under 150 words and be specific and practical.`;
    }

    // Call our backend API to get the explanation
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(`${backendUrl}/explain-step`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stepId,
        stepTitle,
        stepType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to get explanation" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format the explanation response to include HTML for better display
    let formattedExplanation = data.explanation
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>") // Bold text
      .replace(/\*([^*]+)\*/g, "<em>$1</em>") // Italic text
      .replace(/- ([^\n]+)/g, "• $1<br/>"); // Convert hyphens to bullet points

    return NextResponse.json({
      explanation: formattedExplanation,
    });
  } catch (error) {
    console.error("Error in explain-step route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
