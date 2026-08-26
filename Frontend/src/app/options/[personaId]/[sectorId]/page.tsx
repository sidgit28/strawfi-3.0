import Link from "next/link";
import { AnimatedSection } from "../../../components/AnimatedSection";
import { FaArrowRight, FaRobot, FaChartLine } from "react-icons/fa";
import Header from "../../../components/Header";

const options = [
  {
    id: "models",
    name: "Build Financial Models",
    description: "Create and analyze detailed financial models tailored to your investment style",
    icon: <FaChartLine className="text-4xl" />,
  },
  {
    id: "chatbot",
    name: "Sector-Specific Chatbot",
    description: "Get personalized insights and analysis from our AI assistant",
    icon: <FaRobot className="text-4xl" />,
  },
];

export default function OptionsPage({ 
  params 
}: { 
  params: { personaId: string; sectorId: string } 
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header showBackButton backUrl={`/sector/${params.personaId}`} backText="Back to Sectors" />

      <main className="container mx-auto px-4 pt-28 pb-8">
        <AnimatedSection animation="fade">
          <h1 className="text-4xl font-bold mb-8 text-center">Choose Your Analysis Tool</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {options.map((option) => (
              <Link
                key={option.id}
                href={`/${option.id}/${params.personaId}/${params.sectorId}`}
                className="group h-full"
              >
                <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 hover:bg-white/10 transition-all border border-white/10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-white/80">{option.icon}</div>
                    <FaArrowRight className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{option.name}</h3>
                  <p className="text-gray-400 flex-grow">{option.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </AnimatedSection>
      </main>
    </div>
  );
} 