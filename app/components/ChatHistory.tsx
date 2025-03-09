"use client";

import { useState, useEffect } from "react";
import { History, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatHistoryProps {
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  activeChatId: string | null;
}

interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ChatHistory({
  onSelectChat,
  onDeleteChat,
  activeChatId,
}: ChatHistoryProps) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/chat");

      if (!response.ok) {
        throw new Error("Failed to fetch chat history");
      }

      const data = await response.json();
      setChats(data.chats);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load chat history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await onDeleteChat(id);
      // Remove from local state to avoid refetch
      setChats(chats.filter((chat) => chat.id !== id));
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-md text-sm mx-auto transition-colors"
      >
        <History className="h-4 w-4" />
        <span>{isOpen ? "Hide Chat History" : "Show Chat History"}</span>
      </button>

      {isOpen && (
        <div className="mt-3 bg-gray-800/80 border border-green-600/30 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-700 text-xs font-bold text-green-400">
            Your Previous Conversations
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-sm">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-400 text-sm">{error}</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No saved conversations yet
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto divide-y divide-gray-700">
              {chats.map((chat) => (
                <li
                  key={chat.id}
                  className={`flex items-center justify-between p-2 hover:bg-gray-700 cursor-pointer transition-colors ${
                    activeChatId === chat.id ? "bg-gray-700" : ""
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="flex-grow">
                    <div className="text-sm font-mono text-green-300 truncate pr-2">
                      {chat.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(chat.updatedAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, chat.id)}
                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded"
                    title="Delete chat"
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
  );
}
