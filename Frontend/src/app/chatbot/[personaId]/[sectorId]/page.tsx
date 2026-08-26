import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import ChatBot from "../../../components/ChatBot";
import Header from "../../../components/Header";

export default function ChatbotPage({ 
  params 
}: { 
  params: { personaId: string; sectorId: string } 
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header showBackButton backUrl={`/options/${params.personaId}/${params.sectorId}`} backText="Back to Options" />

      <main className="container mx-auto px-4  z-0 relative">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Sector-Specific Chatbot</h1>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <ChatBot persona={params.personaId} />
          </div>
        </div>
      </main>
    </div>
  );
} 