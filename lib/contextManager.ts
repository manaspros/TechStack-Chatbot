import { IChat, IMessage } from "@/models/Chat";

// Maximum number of messages to include in context
const MAX_CONTEXT_MESSAGES = 10;
// Maximum tokens to send to Gemini API
const MAX_CONTEXT_TOKENS = 4000;

/**
 * Builds context-aware chat history for Gemini API
 */
export function buildChatContext(
  chat: IChat,
  newMessage: string
): Array<{ role: string; parts: string }> {
  if (!chat || !chat.messages || chat.messages.length === 0) {
    return [
      {
        role: "user",
        parts: newMessage,
      },
    ];
  }

  // Get recent messages, limiting to MAX_CONTEXT_MESSAGES
  const recentMessages = chat.messages
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: msg.content,
    }));

  // Add the new message
  recentMessages.push({
    role: "user",
    parts: newMessage,
  });

  return recentMessages;
}

/**
 * Estimates token count in a text (rough approximation)
 * A more accurate implementation would use a tokenizer library
 */
export function estimateTokenCount(text: string): number {
  // Approximate tokens by splitting on whitespace and punctuation
  // Real tokenizers are more complex but this provides a rough estimate
  const words = text.trim().split(/\s+/);
  return words.length * 1.5; // Rough estimate: 1 word ≈ 1.5 tokens
}

/**
 * Trims context to fit within token limits
 */
export function trimContextToFit(
  messages: Array<{ role: string; parts: string }>
): Array<{ role: string; parts: string }> {
  let totalTokens = 0;
  const trimmedMessages = [];

  // Process messages from newest to oldest, always including the most recent user query
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokenCount(
      typeof msg.parts === "string" ? msg.parts : JSON.stringify(msg.parts)
    );

    if (
      totalTokens + msgTokens <= MAX_CONTEXT_TOKENS ||
      i === messages.length - 1
    ) {
      // Always include most recent message or if we have space
      trimmedMessages.unshift(msg); // Add to beginning since we're processing backward
      totalTokens += msgTokens;
    } else {
      // Stop if we exceed token limit
      break;
    }
  }

  return trimmedMessages;
}
