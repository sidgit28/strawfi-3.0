import Link from "next/link";
import { AnimatedSection } from "../../components/AnimatedSection";
import { FaArrowRight } from "react-icons/fa";
import Header from "../../components/Header";

const sectors = [
  {
    id: "technology",
    name: "Technology",
    description: "Innovation and digital transformation opportunities",
    icon: "💻",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Medical advancements and healthcare services",
    icon: "🏥",
  },
  {
    id: "financial",
    name: "Financial Services",
    description: "Banking, insurance, and investment services",
    icon: "💰",
  },
  {
    id: "energy",
    name: "Energy",
    description: "Renewable and traditional energy solutions",
    icon: "⚡",
  },
  {
    id: "consumer",
    name: "Consumer",
    description: "Retail, consumer goods, and services",
    icon: "🛍️",
  },
];

export default function SectorPage({ params }: { params: { personaId: string } }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header showBackButton backUrl="/persona" backText="Back to Personas" />

      <main className="container mx-auto px-4 py-8">
        <AnimatedSection animation="fade">
          <h1 className="text-4xl font-bold mb-8 text-center">Select Your Sector</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {sectors.map((sector) => (
              <Link
                key={sector.id}
                href={`/options/${params.personaId}/${sector.id}`}
                className="group h-full"
              >
                <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 hover:bg-white/10 transition-all border border-white/10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-4xl">{sector.icon}</div>
                    <FaArrowRight className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{sector.name}</h3>
                  <p className="text-gray-400 flex-grow">{sector.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </AnimatedSection>
      </main>
    </div>
  );
} 