"use client";

import Link from "next/link";
import { useState } from "react";
import { FaRobot, FaChartLine, FaBrain, FaArrowRight } from "react-icons/fa";
import { AnimatedSection } from "./components/AnimatedSection";
import Header from "./components/Header";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <AnimatedSection className="text-center max-w-4xl mx-auto mb-24" animation="fade">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 leading-tight">
            Welcome to Financial Multiverse
          </h1>
          
          {/* Video Logo */}
          <div className="flex justify-center mb-6">
            <video
              width={250}
              height={250}
              autoPlay
              muted
              loop={false}
              playsInline
              className={`transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ border: 'none', outline: 'none' }}
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => setVideoLoaded(true)}
            >
              <source src="/assets/logo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
         
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Your gateway to personalized financial insights and AI-powered analysis
          </p>
        </AnimatedSection>

        {/* Features Grid */}
        <AnimatedSection className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Link href={user ? "/knowledge-repo" : "/login"} className="block group">
              <div className="bg-white/5 backdrop-blur-lg p-8 rounded-xl border border-white/10 hover:bg-white/10 transition-all h-full">
                <div className="text-4xl mb-6 bg-gradient-to-r from-white to-gray-400 w-16 h-16 rounded-full flex items-center justify-center">
                  <FaBrain className="text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4">InvestIQ - The Knowledge Repo</h3>
                <p className="text-gray-400 mb-6 text-lg">
                  Persistent research memory, collaborative intelligence, and smart retrieval system for investment decisions.
                </p>
                <div className="flex items-center text-gray-400 group-hover:text-white">
                  <span className="mr-2">Explore Repository</span>
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link href={user ? "/tools" : "/login"} className="block group">
              <div className="bg-white/5 backdrop-blur-lg p-8 rounded-xl border border-white/10 hover:bg-white/10 transition-all h-full">
                <div className="text-4xl mb-6 bg-gradient-to-r from-white to-gray-400 w-16 h-16 rounded-full flex items-center justify-center">
                  <FaChartLine className="text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI-powered Tracking Tools</h3>
                <p className="text-gray-400 mb-6 text-lg">
                  Advanced tools for market analysis, SEC filing parsing, and real-time financial insights.
                </p>
                <div className="flex items-center text-gray-400 group-hover:text-white">
                  <span className="mr-2">Explore Tools</span>
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link href={user ? "/persona" : "/login"} className="block group">
              <div className="bg-white/5 backdrop-blur-lg p-8 rounded-xl border border-white/10 hover:bg-white/10 transition-all h-full">
                <div className="text-4xl mb-6 bg-gradient-to-r from-white to-gray-400 w-16 h-16 rounded-full flex items-center justify-center">
                  <FaRobot className="text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Personalized Financial Models</h3>
                <p className="text-gray-400 mb-6 text-lg">
                  Discover your financial persona and get tailored investment strategies based on your unique style.
                </p>
                <div className="flex items-center text-gray-400 group-hover:text-white">
                  <span className="mr-2">Explore Models</span>
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </main>
  );
}