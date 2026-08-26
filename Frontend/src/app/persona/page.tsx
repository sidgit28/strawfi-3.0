import Link from "next/link";
import { AnimatedSection } from "../components/AnimatedSection";
import { FaArrowRight } from "react-icons/fa";
import Header from "../components/Header";

const personas = [
  {
    id: "traditionalist",
    name: "Traditionalist",
    description: "Prefer proven strategies and stable, long-term investments.",
    icon: "🏛️",
  },
  {
    id: "innovator",
    name: "Innovator",
    description: "Always looking for the next big thing in tech and finance.",
    icon: "🚀",
  },
  {
    id: "adventurer",
    name: "Adventurer",
    description: "Thrive on risk and excitement in the market.",
    icon: "🏃",
  },
  {
    id: "athlete",
    name: "Athlete",
    description: "Disciplined, goal-oriented, and performance-driven.",
    icon: "🏆",
  },
  {
    id: "artist",
    name: "Artist",
    description: "Creative approach to investing with unique perspectives.",
    icon: "🎨",
  },
  {
    id: "environmentalist",
    name: "Environmentalist",
    description:
      "Sustainable, principled investment according to ethics",
    icon: "🌍",
    color: "from-green-500 to-emerald-500",
    traits: ["Disciplined", "Patient", "Value-focused"],
  },
];

export default function PersonasPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header showBackButton backUrl="/" backText="Back to Home" />

      <main className="container mx-auto px-4 py-8">
        <AnimatedSection animation="fade">
          <h1 className="text-4xl font-bold mb-8 text-center">Choose Your Investment Style</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {personas.map((persona) => (
              <Link
                key={persona.id}
                href={`/sector/${persona.id}`}
                className="group h-full"
              >
                <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 hover:bg-white/10 transition-all border border-white/10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-4xl">{persona.icon}</div>
                    <FaArrowRight className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{persona.name}</h3>
                  <p className="text-gray-400 flex-grow">{persona.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </AnimatedSection>
      </main>
    </div>
  );
}
