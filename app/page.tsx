import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageSquare, Shield } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-grow container mx-auto p-4">
      <div className="max-w-4xl mx-auto mt-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-6 text-green-400">
            Welcome to Tech Stack Assistant
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Your AI-powered assistant for learning technology stacks and
            programming concepts
          </p>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-green-500/30 shadow-lg mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-gray-900/80 p-4 rounded-lg border border-green-400/20">
                  <h3 className="text-lg font-bold mb-2 text-green-400 flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    AI-Powered Learning
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Get personalized guidance on any tech stack or programming
                    language with our intelligent chatbot assistant.
                  </p>
                </div>

                <div className="bg-gray-900/80 p-4 rounded-lg border border-green-400/20">
                  <h3 className="text-lg font-bold mb-2 text-green-400">
                    Save Your Progress
                  </h3>
                  <p className="text-gray-300 text-sm">
                    All your conversations are automatically saved and can be
                    accessed later to continue your learning journey.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Link
                  href="/chatbot"
                  className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 
                  transition-all transform hover:scale-105 flex items-center justify-center text-lg font-bold 
                  shadow-lg shadow-green-700/30"
                >
                  Start Chatting Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 justify-center mt-8">
          <Link
            href="/chatbot"
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 flex items-center"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Start Chatting
          </Link>

          <Link
            href="/protected"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Shield className="mr-2 h-5 w-5" />
            Protected Page
          </Link>
        </div>
      </div>
    </main>
  );
}
