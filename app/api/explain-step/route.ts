import { NextResponse } from "next/server";
import axios from "axios";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stepId, stepTitle, stepType } = body;

    if (!stepId || !stepTitle) {
      return NextResponse.json(
        { error: "Missing required fields: stepId and stepTitle" },
        { status: 400 }
      );
    }

    // Call API to get a detailed explanation for this step
    // For this example, we'll make a request to our backend service
    // which will then call a language model for the explanation
    const BACKEND_URL =
      process.env.BACKEND_URL || "http://localhost:5000/explain-step";

    const response = await axios.post(BACKEND_URL, {
      stepId,
      stepTitle,
      stepType,
    });

    // Format the explanation before returning
    const explanation = formatExplanation(response.data.explanation);

    return NextResponse.json({
      explanation,
    });
  } catch (error) {
    console.error("Error in explain-step API:", error);
    return NextResponse.json(
      {
        error: "Failed to generate explanation",
        explanation:
          "Sorry, I couldn't generate a detailed explanation for this step. Please try again later.",
      },
      { status: 500 }
    );
  }
}
