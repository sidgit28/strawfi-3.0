"use client";

import {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  FaPaperPlane,
  FaRobot,
} from "react-icons/fa";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  persona: string;
}

interface ChatResponse {
  response?: string;
  usage?: {
    limit: number;
    used: number;
    remaining: number;
  };
  error?: string;
  message?: string;
}

const DAILY_LIMIT = 6;

function getClientId() {
  if (typeof window === "undefined") {
    return "";
  }

  const storageKey =
    "strawfi_chat_client_id";

  let clientId =
    localStorage.getItem(storageKey);

  if (!clientId) {
    clientId =
      `client-${crypto.randomUUID()}`;

    localStorage.setItem(
      storageKey,
      clientId
    );
  }

  return clientId;
}

export default function ChatBot({
  persona,
}: ChatBotProps) {
  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [remainingQuestions, setRemainingQuestions] =
    useState(DAILY_LIMIT);

  const [limitMessage, setLimitMessage] =
    useState("");

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
  scrollToBottom();
}, [messages]);

useEffect(() => {
  const loadChatUsage = async () => {
    try {
      const clientId = getClientId();

      if (!clientId) {
        return;
      }

      const response = await fetch(
        `http://localhost:3001/api/chat/usage?clientId=${encodeURIComponent(clientId)}`
      );

      if (!response.ok) {
        console.warn(
          "Unable to load StrawFi chat usage."
        );
        return;
      }

      const data = await response.json();

      if (
        typeof data.remaining === "number"
      ) {
        setRemainingQuestions(
          data.remaining
        );
      }

    } catch (error) {
      console.warn(
        "Failed to load chat usage:",
        error
      );
    }
  };

  loadChatUsage();
}, []);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const trimmedInput =
      input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    if (remainingQuestions <= 0) {
      setLimitMessage(
        "You've used all 6 AI questions for today. Please come back tomorrow."
      );
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: trimmedInput,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setInput("");
    setLimitMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3001/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message: trimmedInput,
            persona,
            history:
              messages.slice(-6),
            clientId: getClientId(),
          }),
        }
      );

      const data: ChatResponse =
        await response
          .json()
          .catch(() => ({}));

      // Daily limit
      if (response.status === 429) {
        setRemainingQuestions(0);

        setLimitMessage(
          data.message ||
            "You've reached your daily AI question limit."
        );

        // Remove the optimistic user message
        // because the server rejected it.
        setMessages((prev) =>
          prev.filter(
            (_, index) =>
              index !== prev.length - 1
          )
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to get response"
        );
      }

      if (data.usage) {
        setRemainingQuestions(
          data.usage.remaining
        );
      }

      const assistantMessage: Message =
        {
          role: "assistant",
          content:
            data.response ||
            "I couldn't generate a response.",
        };

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ]);

    } catch (error) {
      console.error(
        "StrawFi chatbot error:",
        error
      );

      const errorMessage: Message = {
        role: "assistant",
        content:
          "I apologize, but I'm having trouble connecting right now. Please try again later.",
      };

      setMessages((prev) => [
        ...prev,
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto h-[520px] bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-xl">

      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center space-x-3">

            <div className="w-10 h-10 bg-gradient-to-r from-white to-gray-400 rounded-full flex items-center justify-center">
              <FaRobot className="text-xl text-black" />
            </div>

            <div>
              <h3 className="font-semibold text-lg">
                FinBot Assistant
              </h3>

              <p className="text-sm text-gray-400">
                Your {persona} investment guide
              </p>
            </div>

          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">
              AI questions remaining
            </p>

            <p
              className={`text-sm font-semibold ${
                remainingQuestions === 0
                  ? "text-red-400"
                  : "text-blue-300"
              }`}
            >
              {remainingQuestions}/{DAILY_LIMIT}
            </p>
          </div>

        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-400">
                Ask me anything about investing as a{" "}
                {persona} investor.
              </p>

              <p className="mt-2 text-xs text-gray-500">
                You have {remainingQuestions} AI questions available today.
              </p>
            </div>
          </div>
        )}

        {messages.map(
          (message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-white to-gray-400 text-black"
                    : "bg-white/10"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          )
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Daily limit message */}
      {limitMessage && (
        <div className="px-4 pb-3">
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">
            {limitMessage}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-white/10"
      >
        <div className="flex space-x-2">

          <input
            type="text"
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            disabled={
              isLoading ||
              remainingQuestions === 0
            }
            placeholder={
              remainingQuestions === 0
                ? "Daily AI limit reached"
                : "Ask me anything about investing..."
            }
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-white/20 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={
              isLoading ||
              !input.trim() ||
              remainingQuestions === 0
            }
            className="bg-gradient-to-r from-white to-gray-400 text-black px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>

        </div>
      </form>
    </div>
  );
}