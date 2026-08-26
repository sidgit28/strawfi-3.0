"use client";

import { useParams } from "next/navigation";
import { AnimatedSection } from "../../components/AnimatedSection";
import ChatBot from "../../components/ChatBot";
import { FaChevronLeft } from "react-icons/fa";
import Link from "next/link";

const personas = {
  innovator: {
    name: "Innovator",
    description: "Always looking for the next big thing in tech and finance. You're drawn to emerging markets, disruptive technologies, and cutting-edge investment opportunities.",
    icon: "🚀",
    traits: ["Forward-thinking", "Tech-savvy", "Early adopter"],
    color: "from-white to-gray-400",
  },
  traditionalist: {
    name: "Traditionalist",
    description: "Prefer proven strategies and stable, long-term investments. You value consistency, reliability, and the wisdom of time-tested financial approaches.",
    icon: "🏛️",
    traits: ["Disciplined", "Patient", "Value-focused"],
    color: "from-white to-gray-400",
  },
  adventurer: {
    name: "Adventurer",
    description: "Thrive on risk and excitement in the market. You're willing to explore unconventional opportunities and aren't afraid to take calculated risks for potentially higher returns.",
    icon: "🏃",
    traits: ["Risk-tolerant", "Adaptable", "Opportunity-seeker"],
    color: "from-white to-gray-400",
  },
  athlete: {
    name: "Athlete",
    description: "Disciplined, goal-oriented, and performance-driven. You approach investing like training—with dedication, measurable targets, and a competitive edge.",
    icon: "🏆",
    traits: ["Goal-oriented", "Competitive", "Consistent"],
    color: "from-white to-gray-400",
  },
  artist: {
    name: "Artist",
    description: "Creative approach to investing with unique perspectives. You see patterns others miss and aren't afraid to build a portfolio that reflects your individual vision.",
    icon: "🎨",
    traits: ["Creative", "Intuitive", "Unique perspective"],
    color: "from-white to-gray-400",
  },
  environmentalist: {
    name: "Environmentalist",
    description: "Sustainable, principled investment according to ethics. You prioritize environmental, social, and governance (ESG) factors in your investment decisions, seeking to make a positive impact while generating returns.",
    icon: "🌍",
    traits: ["Ethical", "Sustainable", "Impact-focused"],
    color: "from-white to-gray-400",
  },
};

export default function PersonaPage() {
  const params = useParams();
  const personaId = params.id as string;
  const persona = personas[personaId as keyof typeof personas];

  if (!persona) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Persona Not Found</h1>
          <Link href="/" className="text-gray-400 hover:text-white">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaChevronLeft />
            <span>Back to Home</span>
          </Link>
          <div className="font-bold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            FinMultiverse
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Persona Info */}
        <AnimatedSection animation="fade">
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
              <div className="flex items-center mb-6">
                <div className="text-6xl mr-6">{persona.icon}</div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{persona.name}</h1>
                  <p className="text-gray-400">{persona.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {persona.traits.map((trait) => (
                  <span
                    key={trait}
                    className="px-3 py-1 bg-white/10 rounded-full text-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Chatbot */}
        <AnimatedSection animation="fade" delay={0.2}>
          <div className="max-w-4xl mx-auto">
            <ChatBot persona={personaId} />
          </div>
        </AnimatedSection>
      </main>
    </div>
  );
} 