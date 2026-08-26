"use client";
import Link from "next/link";
import Image from "next/image";
import { FaChevronLeft, FaHeadphones, FaCopy, FaTimes, FaPlay, FaLinkedin, FaUser } from "react-icons/fa";
import { useState } from "react";
import DemoRequestModal from './DemoRequestModal';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
  backText?: string;
}

interface DemoFormData {
  firstName: string;
  lastName: string;
  businessEmail: string;
  phoneNumber: string;
  companyName: string;
  businessCardTitle: string;
  firmDescription: string;
}

const initialDemoForm: DemoFormData = {
  firstName: '',
  lastName: '',
  businessEmail: '',
  phoneNumber: '',
  companyName: '',
  businessCardTitle: '',
  firmDescription: ''
};

// Helper function to get user initials
const getUserInitials = (fullName: string, email: string) => {
  if (fullName && fullName.trim()) {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    } else {
      return names[0].substring(0, 2).toUpperCase();
    }
  }
  
  // Fallback to email initials if no full name
  if (email) {
    const emailPart = email.split('@')[0];
    return emailPart.substring(0, 2).toUpperCase();
  }
  
  return 'U';
};

export default function Header({ 
  showBackButton = false, 
  backUrl = "/", 
  backText = "Back" 
}: HeaderProps) {
  const { user, signOut, loading } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [demoForm, setDemoForm] = useState<DemoFormData>(initialDemoForm);

  const tryMailto = () => {
    window.location.href = 'mailto:sic2524111@sicsr.ac.in';
  };

  const openLinkedIn = () => {
    window.open('https://www.linkedin.com/in/siddhant-choudhury-1b834030b/', '_blank');
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('sic2524111@sicsr.ac.in');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = 'sic2524111@sicsr.ac.in';
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Demo request:', demoForm);
    alert('Demo request submitted!');
    setShowDemoModal(false);
    setDemoForm(initialDemoForm);
  };

  const handleInputChange = (field: keyof DemoFormData, value: string) => {
    setDemoForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Link
                  href={backUrl}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <FaChevronLeft />
                  <span>{backText}</span>
                </Link>
              )}
              
              {/* Logo and Financial Insights - Top Left */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Image
                    src="/assets/logo.png"
                    alt="Financial Insights Logo"
                    width={32}
                    height={32}
                    className={`transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoLoaded(true)}
                  />
                  {!logoLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <Link 
                  href="/financial-insights"
                  className="text-lg font-semibold text-white hover:text-gray-300 transition-colors"
                >
                  Financial Insights
                </Link>
              </div>
            </div>
            
            {/* Right side - moved to extreme right */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <FaHeadphones className="text-lg" />
                <span className="text-lg font-semibold text-white hover:text-gray-300 transition-colors">Help</span>
              </button>
              
              <button
                onClick={() => setShowDemoModal(true)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <FaPlay className="text-lg" />
                <span className="text-lg font-semibold text-white hover:text-gray-300 transition-colors">Request a demo</span>
              </button>

              {/* Authentication section with loading state */}
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span className="text-gray-400">Loading...</span>
                </div>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {getUserInitials(user?.full_name || '', user.email || '')}
                    </div>
                    <span className="text-white">{user?.full_name || user.email}</span>
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-900 ring-1 ring-gray-600">
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            signOut();
                            setIsProfileOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
            
            <h3 className="text-white font-semibold text-lg mb-4">Help</h3>
            
            <div className="space-y-4">
              <button
                onClick={tryMailto}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
              >
                Open Email App
              </button>
              
              <div>
                <label className="block text-gray-400 text-xs mb-1">Email to:</label>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm flex-1">
                    sic2524111@sicsr.ac.in
                  </code>
                  <button
                    onClick={copyEmail}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    {copied ? '✓' : <FaCopy />}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <button
                  onClick={openLinkedIn}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2"
                >
                  <FaLinkedin />
                  <span>Connect on LinkedIn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Request Modal */}
      <DemoRequestModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)} 
      />

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}