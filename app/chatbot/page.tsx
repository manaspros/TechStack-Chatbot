"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import {
  Send,
  User,
  Bot,
  Lightbulb,
  BookOpen,
  List,
  Reply,
  ActivitySquare,
  Network,
  Map,
  Trash2,
  History,
  Save,
  Archive,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import BlinkingCursor from "../components/BlinkingCursor";
import LearningPathDiagram from "../components/LearningPathDiagram";
import { cn } from "@/lib/utils";
import styles from "../components/CustomScrollbar.module.css";
import { toast } from "sonner";
import { learningService } from "@/utils/learningService";

// ...existing types and constants...
type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  role?: string;
  parts?: string;
  isLearningPath?: boolean;
  questions?: string[];
  learningSteps?: LearningStep[];
  showDiagram?: boolean;
  learningPathSaved?: boolean;
  learningPathId?: string;
};

type LearningStep = {
  id: string;
  title: string;
  description: string;
  type: "prerequisite" | "core" | "practice" | "advanced";
};

// API endpoint configuration from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/chat`
  : "http://localhost:5000/chat";

// Function to detect questions in the text
const detectQuestions = (text: string): string[] => {
  if (!text) return [];

  const questions: string[] = [];
  const questionRegex = /([^.!?]+\?)/g;
  const matches = text.match(questionRegex);

  if (matches) {
    matches.forEach((question) => {
      questions.push(question.trim());
    });
  }

  return questions;
};

// Function to detect if content has a learning structure
const hasLearningStructure = (text: string): boolean => {
  const hasSteps =
    /(?:^|\n)(?:step|phase|part|level|stage|\d+)[:\.\)\-]?\s+/gi.test(text);
  const hasHeaders = /(?:^|\n)#{1,3}\s+/g.test(text);
  const numberedItems = text.match(/(?:^|\n)\d+\.\s+/g);
  const hasOrderedList = numberedItems && numberedItems.length >= 3;
  const hasLearningKeywords =
    /\b(?:prerequisites?|fundamentals|essentials|basics|first|second|third|then|next|finally|advanced|begin by|start with)\b/i.test(
      text
    );

  return hasSteps || hasHeaders || hasOrderedList || hasLearningKeywords;
};

// Helper function to clean text with markdown symbols
const cleanMarkdownText = (text: string): string => {
  if (!text) return "";

  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
};

// Improved function to extract learning steps from a learning path text
const extractLearningSteps = (text: string): LearningStep[] => {
  if (!text) return [];

  const steps: LearningStep[] = [];
  const sections = [
    {
      pattern:
        /prerequisites?|before you start|foundation|basics|getting started/i,
      type: "prerequisite",
    },
    {
      pattern: /core|fundamentals|key concepts|essentials|primary|main/i,
      type: "core",
    },
    {
      pattern:
        /practice|projects?|exercises|hands-on|building|create|implement|coding/i,
      type: "practice",
    },
    {
      pattern:
        /advanced|deeper|next steps|further|mastery|optimization|expert/i,
      type: "advanced",
    },
  ];

  const stepPatterns = [
    /(?:^|\n)(?:Step|Phase|Part|Level|Stage)[\s:-]+(\d+|[A-Z])[\s:-]*([^\n]+)/gi,
    /(?:^|\n)(\d+)[\.:\)\-]\s+([^\n]+)/gi,
    /(?:^|\n)#{1,3}\s+(?:(?:Step|Phase|Part|Stage|Level)[\s:-]+)?([^\n]+)/gi,
  ];

  let match;
  let stepCount = 0;

  for (const pattern of stepPatterns) {
    const regex = new RegExp(pattern);

    while ((match = regex.exec(text)) !== null) {
      stepCount++;
      const rawTitle = match[2] || match[1] || `Step ${stepCount}`;
      const title = cleanMarkdownText(rawTitle);

      const startIdx = match.index + match[0].length;
      const endIdx = text.indexOf("\n\n", startIdx + 10);
      let rawDescription = text
        .substring(
          startIdx,
          endIdx > -1 ? endIdx : Math.min(startIdx + 150, text.length)
        )
        .trim();

      let description = cleanMarkdownText(rawDescription);

      description = description.replace(/^\s*[-•*]\s*/, "").trim();
      description = description.replace(/^[:\-–]\s*/, "").trim();

      if (!description) description = "No details provided for this step";
      if (description.length > 100) {
        description = description.substring(0, 97) + "...";
      }

      let stepType: "prerequisite" | "core" | "practice" | "advanced";

      const sectionMatched = sections.find((section) =>
        section.pattern.test(title.toLowerCase())
      );

      if (sectionMatched) {
        stepType = sectionMatched.type as any;
      } else if (stepCount <= 2) {
        stepType = "prerequisite";
      } else if (stepCount <= 5) {
        stepType = "core";
      } else if (stepCount <= 8) {
        stepType = "practice";
      } else {
        stepType = "advanced";
      }

      steps.push({
        id: `step-${stepCount}`,
        title,
        description,
        type: stepType,
      });
    }

    if (steps.length > 0) break;
  }

  if (steps.length === 0) {
    const listItemRegex = /(?:^|\n)(\d+)\.\s+([^\n]+)/g;

    while ((match = listItemRegex.exec(text)) !== null) {
      const number = match[1];
      const rawContent = match[2].trim();
      const content = cleanMarkdownText(rawContent);

      if (content.length > 10) {
        const stepType =
          stepCount < 2
            ? "prerequisite"
            : stepCount < 4
            ? "core"
            : stepCount < 6
            ? "practice"
            : "advanced";

        steps.push({
          id: `list-${number}`,
          title: `Step ${number}: ${content.substring(0, 40)}${
            content.length > 40 ? "..." : ""
          }`,
          description: content,
          type: stepType,
        });

        stepCount++;
      }
    }
  }

  if (steps.length === 0 && hasLearningStructure(text)) {
    const paragraphs = text
      .split("\n\n")
      .filter((p) => p.trim().length > 0)
      .slice(0, 5);

    const stepTypes = ["prerequisite", "core", "core", "practice", "advanced"];

    paragraphs.forEach((paragraph, idx) => {
      let title = paragraph.split(/[.!?]/)[0].trim();
      if (title.length > 50) title = title.substring(0, 47) + "...";

      let description = paragraph.substring(title.length).trim().slice(0, 100);
      if (!description && paragraph.length > title.length) {
        description = paragraph
          .slice(title.length + 1, title.length + 100)
          .trim();
      }
      if (description.length > 97) description += "...";

      steps.push({
        id: `auto-${idx}`,
        title: title || `Step ${idx + 1}`,
        description: description || "Continue following this guide",
        type: stepTypes[idx] as
          | "prerequisite"
          | "core"
          | "practice"
          | "advanced",
      });
    });
  }

  return steps;
};

// Enhanced formatBotMessage function with code block support
const formatBotMessage = (text: string, isLearningPath: boolean = false) => {
  if (!text) return "";

  if (isLearningPath) {
    text = text.replace(
      /^(Step \d+:|#+ Step \d+:|#+ \d+\.|Phase \d+:)/gim,
      '<h3 class="font-bold text-green-400 text-lg mt-4 mb-2">$1</h3>'
    );

    text =
      `<div class="bg-gray-900 p-3 mb-4 rounded-md border-l-4 border-green-400">
              <h2 class="font-bold text-xl text-green-400 mb-2">Learning Path</h2>
              <p class="text-sm opacity-80">Follow this structured guide to master this technology.</p>
            </div>` + text;
  }

  let formattedText = text.replace(
    /```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```/g,
    (_, language, code) => {
      const lang = language.trim().toLowerCase() || "plaintext";

      let langClass = "";
      let langLabel = lang;

      if (["javascript", "js", "typescript", "ts"].includes(lang)) {
        langClass = "text-yellow-300";
        langLabel =
          lang === "js" ? "JavaScript" : lang === "ts" ? "TypeScript" : lang;
      } else if (["python", "py"].includes(lang)) {
        langClass = "text-blue-300";
        langLabel = "Python";
      } else if (["bash", "shell", "sh", "zsh"].includes(lang)) {
        langClass = "text-green-300";
        langLabel = "Terminal";
      } else if (["html", "xml"].includes(lang)) {
        langClass = "text-orange-300";
        langLabel = lang.toUpperCase();
      } else if (["css", "scss", "sass"].includes(lang)) {
        langClass = "text-pink-300";
        langLabel = lang.toUpperCase();
      } else if (["json"].includes(lang)) {
        langClass = "text-cyan-300";
        langLabel = "JSON";
      } else if (["sql"].includes(lang)) {
        langClass = "text-blue-300";
        langLabel = "SQL";
      }

      const escapedCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");

      return `
        <div class="my-4 rounded-md overflow-hidden border border-gray-700 bg-gray-900">
          <div class="flex justify-between items-center px-4 py-1 bg-gray-800 border-b border-gray-700">
            <span class="text-xs font-semibold ${
              langClass || "text-gray-300"
            }">${langLabel}</span>
            <span class="text-xs text-gray-400">code</span>
          </div>
          <pre class="p-4 overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">${escapedCode}</pre>
        </div>
      `;
    }
  );

  formattedText = formattedText.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-gray-900 text-orange-300 font-mono text-sm">$1</code>'
  );

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  formattedText = formattedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${url}</a>`;
  });

  formattedText = formattedText.replace(
    /\*\*(.*?)\*\*/g,
    "<strong class='text-green-400'>$1</strong>"
  );
  formattedText = formattedText.replace(
    /\*(.*?)\*/g,
    "<strong class='text-green-400'>$1</strong>"
  );
  formattedText = formattedText.replace(/_(.*?)_/g, "<em>$1</em>");

  if (!isLearningPath) {
    formattedText = formattedText.replace(
      /^##\s(.+)$/gm,
      '<h3 class="font-bold text-green-400 text-lg mt-4 mb-2">$1</h3>'
    );
    formattedText = formattedText.replace(
      /^#\s(.+)$/gm,
      '<h2 class="font-bold text-xl text-green-400 mt-5 mb-3">$1</h2>'
    );
  }

  formattedText = formattedText.replace(
    /^[-*]\s(.+)$/gm,
    '<div class="flex items-start mb-2"><span class="mr-2 text-green-400">→</span><span>$1</span></div>'
  );

  formattedText = formattedText.replace(
    /^(\d+)\.\s(.+)$/gm,
    '<div class="flex items-start mb-2"><span class="mr-2 text-purple-400 min-w-[1.5rem] text-right">$1.</span><span>$2</span></div>'
  );

  formattedText = formattedText
    .split("\n")
    .map((line) => {
      if (
        line.includes('<div class="flex items-start') ||
        line.includes("<h2") ||
        line.includes("<h3") ||
        line.includes("<pre") ||
        line.includes("<code") ||
        line.includes('<div class="my-4 rounded-md')
      ) {
        return line;
      }
      return line + "<br />";
    })
    .join("");

  return formattedText;
};

export default function ChatbotPage() {
  const { user, isLoading: isUserLoading, error: userError } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialQueryProcessedRef = useRef(false);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<
    Array<{ id: string; title: string; updatedAt: string }>
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingLearningPath, setSavingLearningPath] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!isUserLoading && !user && !userError) {
      router.push(`/api/auth/login?returnTo=${encodeURIComponent("/chatbot")}`);
    }
  }, [user, isUserLoading, userError, router]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-400">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center bg-red-900/20 p-6 rounded-lg border border-red-500/30">
          <h2 className="text-xl font-bold text-red-400 mb-2">
            Authentication Error
          </h2>
          <p className="mb-4 text-white/80">{userError.message}</p>
          <button
            onClick={() => router.push("/api/auth/login")}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-green-400 mb-4">
            Please sign in to access the chatbot
          </p>
          <button
            onClick={() => router.push("/api/auth/login?returnTo=/chatbot")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (user && !isUserLoading) {
      fetchChatHistory();
    }
  }, [user, isUserLoading]);

  const fetchChatHistory = async () => {
    try {
      setError(null);

      const response = await fetch("/api/chat", {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/api/auth/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch chat history");
      }

      const data = await response.json();
      if (data && Array.isArray(data.chats)) {
        const validChats = data.chats.filter((chat: { id: string | any[] }) => {
          if (
            !chat.id ||
            typeof chat.id !== "string" ||
            chat.id.length !== 24
          ) {
            console.warn(`Skipping chat with invalid ID: ${chat.id}`, chat);
            return false;
          }
          return true;
        });
        console.log(
          `Loaded ${validChats.length} valid chats from ${data.chats.length} total`
        );
        setChatHistory(validChats);
      } else {
        console.warn("Unexpected response format:", data);
        setChatHistory([]);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load chat history"
      );
      setChatHistory([]);
    }
  };

  const loadChat = async (id: string) => {
    try {
      console.log("Loading chat with ID:", id);

      if (!id || id === "undefined" || id === "null") {
        setError("Invalid chat ID");
        return;
      }

      const cleanId = id.trim();

      if (cleanId.length !== 24) {
        console.error(
          `Chat ID has incorrect length: ${cleanId.length}, ID: ${cleanId}`
        );
        setError(
          `Invalid chat ID format (incorrect length: ${cleanId.length})`
        );
        return;
      }

      setIsTyping(true);
      const response = await fetch(`/api/chat/${cleanId}`, {
        credentials: "include",
      });

      if (response.status === 400) {
        setError("Invalid chat ID format");
        setIsTyping(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load chat");
      }

      const data = await response.json();

      const loadedMessages = data.chat.messages.map((msg: any) => ({
        id: Date.now() + Math.random().toString(),
        text: msg.content,
        sender: msg.role === "user" ? "user" : "bot",
        timestamp: new Date(msg.timestamp),
        role: msg.role === "user" ? "user" : "model",
        parts: msg.content,
        questions: msg.role === "user" ? [] : detectQuestions(msg.content),
        isLearningPath:
          msg.role === "user" ? false : hasLearningStructure(msg.content),
        learningSteps:
          msg.role === "user" ? [] : extractLearningSteps(msg.content),
        showDiagram: false,
      }));

      setMessages(loadedMessages);
      setChatId(id);
      setError(null);
      setShowHistory(false);
    } catch (error) {
      console.error("Error loading chat:", error);
      setError(error instanceof Error ? error.message : "Failed to load chat");
    } finally {
      setIsTyping(false);
    }
  };

  const deleteChat = async (id: string) => {
    try {
      if (!id || id === "undefined") {
        setError("Invalid chat ID");
        return;
      }

      const response = await fetch(`/api/chat/${id}`, {
        method: "DELETE",
      });

      if (response.status === 400) {
        setError("Invalid chat ID format");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete chat");
      }

      await fetchChatHistory();

      if (id === chatId) {
        setChatId(null);
        setMessages([]);

        setTimeout(() => {
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            text: "Hello! I'm your Tech Learning Assistant. Ask me about any technology or programming language you want to learn, and I can help guide your learning journey.",
            sender: "bot",
            timestamp: new Date(),
            role: "model",
            parts: "Hello! I'm your Tech Learning Assistant.",
            questions: [],
          };
          setMessages([welcomeMessage]);
        }, 500);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete chat"
      );
    }
  };

  const saveChat = async () => {
    if (messages.length === 0) return;

    try {
      setIsSaving(true);

      let title = "New Chat";
      const firstUserMsg = messages.find((msg) => msg.sender === "user");
      if (firstUserMsg) {
        title =
          firstUserMsg.text.slice(0, 30) +
          (firstUserMsg.text.length > 30 ? "..." : "");
      }

      const formattedMessages = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
        timestamp: msg.timestamp,
      }));

      const payload = {
        title: title,
        message: formattedMessages[formattedMessages.length - 1],
      };

      if (chatId && chatId !== "undefined") {
        Object.assign(payload, { chatId });
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save chat");
      }

      const data = await response.json();

      if (data.chat && data.chat._id) {
        setChatId(data.chat._id);
        toast.success("Chat saved successfully!", {
          description:
            "Your conversation has been saved and can be accessed from chat history.",
          duration: 3000,
        });
      } else {
        console.warn("Received response without valid chat ID", data);
      }

      await fetchChatHistory();
    } catch (error) {
      console.error("Error saving chat:", error);
      setError("Failed to save chat");
      toast.error("Failed to save chat", {
        description: "Please try again later",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserMessage = async (
    text: string,
    generateLearningPath: boolean = false
  ) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: generateLearningPath ? `Create learning path for: ${text}` : text,
      sender: "user",
      timestamp: new Date(),
      role: "user",
      parts: text,
      questions: [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    const response = await fetchBotResponse(text, generateLearningPath);
    setIsTyping(false);

    if (response) {
      const questions = detectQuestions(response.answer);

      const isExplicitLearningPath = !!response.isLearningPath;
      const hasStructure = hasLearningStructure(response.answer);
      const shouldShowLearningPath = isExplicitLearningPath || hasStructure;

      let learningSteps = undefined;
      if (shouldShowLearningPath) {
        console.log("Detected structured content in response");
        learningSteps = extractLearningSteps(response.answer);
        console.log("Extracted steps:", learningSteps?.length || 0);
      }

      const autoShowDiagram =
        isExplicitLearningPath ||
        (hasStructure && learningSteps && learningSteps.length >= 3);

      const botMessage: Message = {
        id: Date.now().toString(),
        text: response.answer,
        sender: "bot",
        timestamp: new Date(),
        role: response.role || "model",
        parts: response.answer,
        isLearningPath: shouldShowLearningPath,
        questions: questions,
        learningSteps: learningSteps || [],
        showDiagram: autoShowDiagram,
      };

      setMessages((prev) => [...prev, botMessage]);

      setTimeout(() => {
        saveChat();
      }, 500);
    } else {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error processing your request. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
        role: "model",
        parts: "Error message",
        questions: [],
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  useEffect(() => {
    if (initialQuery && !initialQueryProcessedRef.current) {
      initialQueryProcessedRef.current = true;
      handleUserMessage(initialQuery);
    } else if (!initialQuery && !initialQueryProcessedRef.current) {
      initialQueryProcessedRef.current = true;
      setTimeout(() => {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: "Hello! I'm your Tech Learning Assistant. Ask me about any technology or programming language you want to learn, and I can help guide your learning journey.",
          sender: "bot",
          timestamp: new Date(),
          role: "model",
          parts: "Hello! I'm your Tech Learning Assistant.",
          questions: [],
        };
        setMessages([welcomeMessage]);
      }, 500);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleDiagram = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, showDiagram: !msg.showDiagram } : msg
      )
    );
  };

  const getChatHistory = () => {
    return messages.map((message) => ({
      role: message.sender === "user" ? "user" : "model",
      parts: message.text,
    }));
  };

  const handleRespondToQuestion = (question: string) => {
    const responseTemplate = `Regarding your question: "${question}"\n\nMy answer is: `;
    setInputValue(responseTemplate);

    const inputField = document.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement;
    if (inputField) {
      inputField.focus();
      inputField.setSelectionRange(
        responseTemplate.length,
        responseTemplate.length
      );
    }
  };

  const fetchBotResponse = async (
    userText: string,
    generateLearningPath: boolean = false
  ) => {
    try {
      setError(null);
      const oldChats = getChatHistory();

      console.log("User object:", user);

      const userId =
        user?.sub ||
        (user?.email ? `email:${user.email}` : null) ||
        (user?.name ? `name:${user.name}` : null) ||
        "anonymous-user";

      console.log("Using userId:", userId);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
        body: JSON.stringify({
          newChat: userText,
          oldChats: oldChats,
          generateLearningPath,
          userId: userId,
          chatId: chatId || undefined,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      if (data.chatId) {
        setChatId(data.chatId);
      }

      return data;
    } catch (error) {
      console.error("API call failed:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to communicate with the chatbot"
      );
      return null;
    }
  };

  const saveLearningPath = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || !message.learningSteps || message.learningSteps.length === 0) {
      toast.error("No learning path found to save");
      return;
    }
    
    if (message.learningPathSaved && message.learningPathId) {
      router.push(`/learning-paths?pathId=${message.learningPathId}`);
      return;
    }

    try {
      setSavingLearningPath(messageId);

      // Get the user info from Auth0 if available
      const userInfo = user;
      
      // Create a userId - either from Auth0 or a generated session ID
      const userId = userInfo?.sub || `session:${Date.now().toString()}`;
      
      const previousMessages = messages
        .slice(0, messages.findIndex((m) => m.id === messageId) + 1)
        .map((m) => m.text)
        .join("\n\n");

      const userQuery =
        messages.find(
          (m) =>
            m.sender === "user" &&
            messages.indexOf(m) < messages.findIndex((msg) => msg.id === messageId)
        )?.text || "Learning Path";

      const pathData = {
        userId: userId,
        chatId: chatId || undefined,
        title: `Learning Path: ${
          userQuery.length > 40 ? userQuery.substring(0, 40) + "..." : userQuery
        }`,
        steps: message.learningSteps.map((step) => ({
          id: step.id,
          title: step.title,
          completed: false,
          category: step.type,
        })),
        description: `Learning path generated for: ${userQuery}`,
        estimatedTimeToComplete: "Varies by experience level",
        difficulty: "intermediate",
      };

      const result = await learningService.createLearningPath(pathData);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                learningPathSaved: true,
                learningPathId: result.learningPath._id,
              }
            : m
        )
      );

      toast.success("Learning path saved successfully!", {
        description:
          "You can now track your progress in the Learning Paths section",
        action: {
          label: "View Path",
          onClick: () =>
            router.push(`/learning-paths?pathId=${result.learningPath._id}`),
        },
      });
    } catch (error) {
      console.error("Error saving learning path:", error);
      toast.error("Failed to save learning path");
    } finally {
      setSavingLearningPath(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    handleUserMessage(inputValue);
  };

  const handleRequestLearningPath = () => {
    if (!inputValue.trim()) return;
    handleUserMessage(inputValue, true);
  };

  return (
    <div className="w-full h-[80vh] flex flex-col">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-pixel mb-2">Tech Learning Assistant</h1>
        <p className="text-sm font-mono">
          Ask about any programming language, framework, or tech stack
        </p>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="mt-2 flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-md text-xs mx-auto"
        >
          <History className="h-3 w-3" />
          <span>{showHistory ? "Hide History" : "Show Chat History"}</span>
        </button>

        {showHistory && (
          <div className="mt-4 w-full max-h-40 overflow-y-auto bg-gray-800 rounded-md border border-gray-700">
            {chatHistory.length === 0 ? (
              <p className="text-sm text-gray-400 p-3">No saved chats yet</p>
            ) : (
              <ul className="divide-y divide-gray-700">
                {chatHistory.map((chat) => (
                  <li
                    key={chat.id}
                    className="flex justify-between items-center p-2 hover:bg-gray-700"
                  >
                    <button
                      onClick={() => loadChat(chat.id)}
                      className="text-left text-sm flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap pr-2"
                    >
                      {chat.title}
                    </button>
                    <button
                      onClick={() => deleteChat(chat.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex-grow overflow-y-auto px-4 py-2 border-2 border-green-400 bg-gray-950 rounded-lg mb-4",
          styles.pixelScrollbar
        )}
      >
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "mb-4 px-3 py-2 rounded-lg",
              message.sender === "user"
                ? "ml-auto bg-purple-800 text-white max-w-[80%]"
                : message.isLearningPath
                ? "bg-gray-800 text-green-400 w-full"
                : "bg-gray-800 text-green-400 max-w-[80%]"
            )}
            ref={index === messages.length - 1 ? lastMessageRef : null}
          >
            <div className="flex items-start gap-2">
              <div className="mt-1">
                {message.sender === "user" ? (
                  <User className="h-5 w-5" />
                ) : message.isLearningPath ? (
                  <BookOpen className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              <div className="w-full">
                {message.sender === "user" ? (
                  <p className="font-mono text-sm">{message.text}</p>
                ) : (
                  <div
                    className="font-mono text-sm list-content"
                    dangerouslySetInnerHTML={{
                      __html: formatBotMessage(
                        message.text,
                        message.isLearningPath
                      ),
                    }}
                  />
                )}

                {message.isLearningPath &&
                  message.learningSteps &&
                  message.learningSteps.length > 0 && (
                    <div className="mt-4 mb-2">
                      {message.showDiagram ? (
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-green-400">
                              <Map className="h-4 w-4" />
                              <span className="font-bold text-sm">
                                Learning Roadmap
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveLearningPath(message.id)}
                                disabled={savingLearningPath === message.id}
                                className={cn(
                                  "text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors",
                                  message.learningPathSaved
                                    ? "bg-green-700 hover:bg-green-800 text-white"
                                    : "bg-purple-700 hover:bg-purple-800 text-white"
                                )}
                              >
                                {savingLearningPath === message.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : message.learningPathSaved ? (
                                  <>
                                    <Archive className="h-3 w-3" />
                                    <span>View Progress</span>
                                  </>
                                ) : (
                                  <>
                                    <Archive className="h-3 w-3" />
                                    <span>Track Progress</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => toggleDiagram(message.id)}
                                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded"
                              >
                                <ActivitySquare className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 border-t border-gray-700 pt-4">
                            <LearningPathDiagram
                              steps={message.learningSteps}
                              enableTracking={message.learningPathSaved}
                              pathId={message.learningPathId}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleDiagram(message.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
                          >
                            <Network className="h-4 w-4" />
                            <span>Show Visual Learning Path</span>
                          </button>

                          {!message.showDiagram && (
                            <button
                              onClick={() => saveLearningPath(message.id)}
                              disabled={savingLearningPath === message.id}
                              className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors",
                                message.learningPathSaved
                                  ? "bg-green-700 hover:bg-green-800 text-white"
                                  : "bg-purple-700 hover:bg-purple-800 text-white"
                              )}
                            >
                              {savingLearningPath === message.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Archive className="h-4 w-4 mr-1" />
                              )}
                              {message.learningPathSaved
                                ? "View Progress"
                                : "Track Progress"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {message.sender === "bot" &&
                  message.questions &&
                  message.questions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-700">
                      <p className="text-xs font-semibold mb-2 text-purple-400">
                        Questions asked:
                      </p>
                      {message.questions.map((question, qIndex) => (
                        <div
                          key={qIndex}
                          className="mb-2 bg-gray-900 rounded-md p-2 flex items-start"
                        >
                          <p className="text-sm text-green-300 flex-grow">
                            {question}
                          </p>
                          <button
                            onClick={() => handleRespondToQuestion(question)}
                            className="ml-2 flex items-center text-xs bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded"
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Respond
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                <p className="text-xs opacity-50 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="bg-gray-800 text-green-400 rounded-lg px-3 py-2 mb-4 max-w-[80%] flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            <span className="font-mono">
              Thinking
              <BlinkingCursor />
            </span>
          </div>
        )}
        {error && (
          <div className="bg-red-800 text-white rounded-lg px-3 py-2 mb-4 max-w-full">
            <p className="font-mono text-sm">Error: {error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow px-4 py-2 bg-gray-800 text-green-400 font-mono border-2 border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ask about a technology or framework..."
            disabled={isTyping}
          />
          <button
            type="submit"
            className={cn(
              "px-4 py-2 bg-green-600 hover:bg-green-700 text-black font-bold rounded-lg transition-colors",
              isTyping && "opacity-50 cursor-not-allowed"
            )}
            disabled={isTyping || !inputValue.trim()}
          >
            <Send className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={saveChat}
            disabled={messages.length === 0 || isSaving}
            className={cn(
              "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors",
              (messages.length === 0 || isSaving) &&
                "opacity-50 cursor-not-allowed"
            )}
          >
            <Save className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleRequestLearningPath}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition-colors",
            (isTyping || !inputValue.trim()) && "opacity-50 cursor-not-allowed"
          )}
          disabled={isTyping || !inputValue.trim()}
        >
          <Lightbulb className="h-4 w-4" />
          <span>Generate Learning Path</span>
          <List className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
