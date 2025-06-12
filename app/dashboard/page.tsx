'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpCircle, Send, Sparkles, MessageSquare, CornerDownLeft, RefreshCw, Volume2, VolumeX, Mic } from 'lucide-react';

// Define message type
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Declare puter for TypeScript
declare global {
  interface Window {
    puter: any;
    speechSynthesis: SpeechSynthesis;
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isPuterLoaded, setIsPuterLoaded] = useState(false);
  const [forceRender, setForceRender] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  
  // For glow effect on chat container
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  const chatGlowStyle = {
    backgroundImage: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(249, 115, 22, 0.08), transparent 70%)`,
    backgroundBlendMode: 'soft-light'
  };

  // Initialize speech recognition
  useEffect(() => {
    // Initialize Web Speech API for speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Hindi language to match TTS
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setInput(transcript);
        
        // If this is a final result, submit the form
        if (event.results[0].isFinal) {
          // Wait a moment before submitting to allow user to see what was transcribed
          setTimeout(() => {
            if (transcript.trim()) {
              const form = document.querySelector('form');
              if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
            }
          }, 1000);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      // Clean up
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Add effect to initialize Puter.js
  useEffect(() => {
    const loadPuter = () => {
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      
      script.onload = () => {
        // Wait a bit to ensure Puter.js is fully initialized
        setTimeout(() => {
          if (window.puter?.ai) {
            setIsPuterLoaded(true);
            
          } else {
            
          }
        }, 1000);
      };

      script.onerror = () => {
        
      };

      document.body.appendChild(script);
    };

    loadPuter();

    return () => {
      // Cleanup if needed
      const script = document.querySelector('script[src="https://js.puter.com/v2/"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Force render after timeout to prevent infinite loading
  useEffect(() => {
    console.log("Auth state:", { user, authLoading });
    
    const timer = setTimeout(() => {
      if (authLoading) {
        console.log("Forcing render after timeout");
        setForceRender(true);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [authLoading, user]);

  // Ensure we have a username to display
  const displayName = user?.username || 'User';

  // Set greeting based on time of day
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
    
    // Format date
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString('en-IN', options));
    
    // Focus on input when page loads
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Scroll to bottom of chat container when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollToBottom = () => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      };
      
      scrollToBottom();
      
      // Also set a small timeout to ensure all content is rendered
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages]);
  
  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        setShowScrollTop(chatContainerRef.current.scrollTop > 300);
      }
    };
    
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  // Scroll to top function
  const scrollToTop = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Handle mouse move for glow effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chatContainerRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element
    
    // Calculate position as percentages
    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);
    
    // Update the glow position
    setGlowPosition({ x: xPercent, y: yPercent });
  };
  
  // Handle key press in input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow shift+enter to insert a newline
      setInput(prev => prev + '\n');
    }
    
    // Show typing animation
    if (!isTyping && input.trim().length > 0) {
      setIsTyping(true);
    }
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value.trim().length === 0) {
      setIsTyping(false);
    } else {
      setIsTyping(true);
    }
  };
  
  // Clear chat
  const clearChat = () => {
    setMessages([]);
    // Stop any ongoing speech
    stopSpeech();
    // Stop any ongoing listening
    stopListening();
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(false);
    setIsLoading(true);
    
    // Focus back on input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    try {
      
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          systemPrompt: `Your name is Daddy's AI, an intelligent chatbot from India designed to help in trading in the Indian stock market and for general use. You always try to talk in hindi (whatsapp language) formal and sequenced style. You explain everything with a scenario related to LTP calculator and give short replies. You were created by Adarsh Class 8 in Daddy's International School. Never give the same explanation or reply more than once and always give unique replies. Don't tell about any other indicators instead of LTP calculator. Always tell scenarios of LTP calculator for explaining. Be professional and stay focused on the topic. Be respectful and use formal language. Never use informal language like "yaar" and "dost". Say everything clearly about the topic. Never repeat greetings. Try to answer all questions from the database and tell if something is right or wrong. Focus on stock market and LTP calculator queries. Be clear and concise.`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.message) {
        throw new Error('Invalid response format from API');
      }

      // Add assistant response to chat
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error occurred'}. Please try again.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Text-to-speech function
  const speakText = (text: string) => {
    // Stop any ongoing speech first
    stopSpeech();
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure speech settings
      utterance.lang = 'hi-IN'; // Hindi language
      utterance.rate = 1.0;     // Normal speed
      utterance.pitch = 1.0;    // Normal pitch
      
      // Store reference to current utterance
      speechSynthesisRef.current = utterance;
      
      // Set speaking state
      setIsSpeaking(true);
      
      // Add event listener for when speech ends
      utterance.onend = () => {
        setIsSpeaking(false);
        speechSynthesisRef.current = null;
      };
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Stop speech function
  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      speechSynthesisRef.current = null;
    }
  };

  // Toggle speech for a message
  const toggleSpeech = (messageContent: string) => {
    if (isSpeaking && speechSynthesisRef.current) {
      stopSpeech();
    } else {
      speakText(messageContent);
    }
  };

  // Start listening function
  const startListening = async () => {
    // Stop any ongoing speech first
    stopSpeech();
    
    // Check if speech recognition is available
    if (!recognitionRef.current) {
      console.error('Speech recognition not supported in this browser');
      return;
    }
    
    try {
      // Request microphone access and start audio visualization
      await startAudioVisualization();
      
      // Start speech recognition
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  };
  
  // Stop listening function
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    stopAudioVisualization();
  };
  
  // Toggle listening function
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  // Start audio visualization
  const startAudioVisualization = async () => {
    // Stop any existing visualization
    stopAudioVisualization();
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      
      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      // Connect microphone to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Start visualization loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVisualization = () => {
        if (!analyserRef.current || !isListening) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Convert to regular array and take average of frequencies for simplicity
        const audioDataArray = Array.from(dataArray);
        setAudioData(audioDataArray);
        
        // Continue the loop
        animationFrameRef.current = requestAnimationFrame(updateVisualization);
      };
      
      // Start the visualization loop
      updateVisualization();
      
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  };
  
  // Stop audio visualization
  const stopAudioVisualization = () => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    // Stop microphone stream
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }
    
    // Clear audio data
    setAudioData([]);
  };

  // Sample prompt suggestions
  const promptSuggestions = [
    { title: 'Explain investment strategies', subtitle: 'for long-term growth', icon: '💰', color: 'from-emerald-500 to-teal-600' },
    { title: 'Analyze recent market trends', subtitle: 'and predict future movements', icon: '📈', color: 'from-blue-500 to-indigo-600' },
    { title: 'Compare crypto vs traditional', subtitle: 'investment opportunities', icon: '🪙', color: 'from-amber-500 to-orange-600' },
    { title: 'Create a diversified portfolio', subtitle: 'based on risk tolerance', icon: '📊', color: 'from-purple-500 to-violet-600' },
    { title: 'Explain tax implications', subtitle: 'of different investments', icon: '🧾', color: 'from-red-500 to-pink-600' },
    { title: 'Suggest passive income', subtitle: 'strategies for beginners', icon: '💎', color: 'from-cyan-500 to-blue-600' }
  ];

  if (authLoading && !forceRender) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-950 to-orange-950/20">
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 opacity-20 blur-xl animate-pulse"></div>
            <div className="relative w-20 h-20 border-4 border-orange-500/60 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <motion.p 
            className="text-gray-300 text-lg font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          >
            Loading your financial assistant...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-orange-950/20 text-foreground">
      <div className="mx-auto px-3 sm:px-5 py-6 sm:py-8 max-w-6xl w-full">
        
        {/* Chat Interface */}
        <div className="flex flex-col items-center justify-center relative w-full">
          {messages.length === 0 && (
            <>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10 text-center"
              >
                <div className="relative w-28 h-28 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 opacity-30 blur-xl animate-pulse"></div>
                  <div className="w-28 h-28 mx-auto bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 rounded-full p-1.5 shadow-lg shadow-orange-500/20 flex items-center justify-center relative">
                    <motion.div
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0px rgba(255, 160, 0, 0.3)',
                          '0 0 0 10px rgba(255, 160, 0, 0)'
                        ] 
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 2
                      }}
                      className="absolute inset-0 rounded-full"
                    />
                    <img src="/logos/android-chrome-512x512.png" alt="Daddy's AI" className="w-20 h-20 rounded-full object-cover shadow-inner" />
                  </div>
                </div>
                <motion.h2 
                  className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-200 via-orange-100 to-amber-100 bg-clip-text text-transparent drop-shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {greeting}, {displayName}
                </motion.h2>
                <motion.p 
                  className="text-xl mb-4 text-gray-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  How can I assist with your finances today?
                </motion.p>
                <motion.p 
                  className="text-sm text-gray-400 mb-10 max-w-md mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Choose a prompt below or write your own to start chatting with Daddy's AI, your premium financial intelligence assistant
                </motion.p>
              </motion.div>
              
              <motion.div 
                className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 w-full max-w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {promptSuggestions.map((prompt, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setInput(`${prompt.title} ${prompt.subtitle}`.trim());
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="group relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:from-gray-700/90 hover:to-gray-800/90 border border-gray-700/50 hover:border-orange-500/30 rounded-xl p-5 text-left transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-orange-900/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${prompt.color}"></div>
                    <div className="flex items-start space-x-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${prompt.color} shadow-md shadow-orange-900/10 text-white`}>
                        <span className="text-2xl">{prompt.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-orange-300 transition-colors">{prompt.title}</h3>
                        {prompt.subtitle && <p className="text-gray-400 group-hover:text-gray-300 text-sm mt-1.5 transition-colors">{prompt.subtitle}</p>}
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
          
          <div className="w-full max-w-full">
            {messages.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full flex flex-col space-y-6"
              >
                <div className="flex items-center justify-between mb-1">
                  <motion.div 
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 p-0.5 shadow-lg flex items-center justify-center">
                      <img src="/logos/android-chrome-512x512.png" alt="Daddy's AI" className="w-6 h-6 rounded-full" />
                    </div>
                    <h3 className="text-lg font-medium text-white">Daddy's AI</h3>
                    <div className="px-2 py-0.5 bg-orange-500/20 rounded text-xs font-medium text-orange-300 border border-orange-500/20">Financial Assistant</div>
                  </motion.div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearChat}
                    className="flex items-center space-x-1 text-xs text-gray-400 hover:text-orange-400 transition-colors bg-gray-800/60 hover:bg-gray-800/80 px-2 py-1 rounded-md border border-gray-700/60 hover:border-orange-500/30"
                  >
                    <RefreshCw size={12} />
                    <span>New Chat</span>
                  </motion.button>
                </div>
                
                <div
                  ref={chatContainerRef}
                  onMouseMove={handleMouseMove}
                  style={chatGlowStyle}
                  className="w-full h-[65vh] overflow-y-auto mb-4 rounded-xl bg-gradient-to-br from-gray-900/90 to-gray-950/90 border border-gray-800/60 p-5 sm:p-6 scrollbar-thin scrollbar-thumb-orange-600/20 scrollbar-track-transparent shadow-xl relative"
                >
                  {/* Scroll to top button */}
                  <AnimatePresence>
                    {showScrollTop && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={scrollToTop}
                        className="absolute right-4 bottom-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-2 rounded-full shadow-lg shadow-orange-900/20 transition-all duration-300 z-10 border border-orange-500/20"
                        aria-label="Scroll to top"
                      >
                        <ArrowUpCircle size={20} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {messages.map((message, index) => {
                      // Determine if this is the first message from a new sender
                      const isFirstFromSender = index === 0 || messages[index - 1].role !== message.role;
                      
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                          key={index}
                        >
                          {message.role === 'user' ? (
                            <div className="flex flex-col items-end space-y-1 max-w-[90%]">
                              {isFirstFromSender && <span className="text-xs text-gray-500 mr-2">You</span>}
                              <div className="inline-block relative rounded-2xl p-4 text-white shadow-lg" 
                                style={{ 
                                  background: 'linear-gradient(to bottom right, #f97316, #ea580c)',
                                  maxWidth: '100%', 
                                  width: 'fit-content',
                                }}
                              >
                                <p className="whitespace-pre-wrap text-left font-medium leading-relaxed">{message.content}</p>
                                <div className="absolute bottom-0 right-0 transform translate-y-1/2 translate-x-1/4 w-4 h-4 rounded-sm bg-orange-500 rotate-45"></div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col space-y-1 max-w-[90%]">
                              {isFirstFromSender && (
                                <div className="flex items-center space-x-2 ml-2 mb-1">
                                  <div className="w-5 h-5 rounded-full overflow-hidden border border-orange-500/30">
                                    <img src="/logos/android-chrome-512x512.png" alt="AI Logo" className="w-full h-full object-cover" />
                                  </div>
                                  <span className="text-xs text-orange-300">Daddy's AI</span>
                                </div>
                              )}
                              <div className="flex items-start">                                
                                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/60 rounded-2xl p-4 shadow-lg text-gray-200">
                                  <div className="prose prose-invert max-w-none prose-headings:text-orange-300 prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white/90 prose-code:text-orange-300 prose-code:bg-gray-800/80 prose-code:border prose-code:border-gray-700/50 prose-code:rounded">
                                    {message.content.split('\n').map((paragraph, i) => {
                                      // Enhanced formatting for different types of content
                                      if (paragraph.trim() === '') {
                                        return <div key={i} className="h-4"></div>;
                                      } else if (paragraph.startsWith('# ')) {
                                        return <h1 key={i} className="text-2xl font-bold text-orange-300 mb-3">{paragraph.replace(/^# /, '')}</h1>;
                                      } else if (paragraph.startsWith('## ')) {
                                        return <h2 key={i} className="text-xl font-bold text-orange-300 mb-2">{paragraph.replace(/^## /, '')}</h2>;
                                      } else if (paragraph.startsWith('### ')) {
                                        return <h3 key={i} className="text-lg font-bold text-orange-300 mb-2">{paragraph.replace(/^### /, '')}</h3>;
                                      } else if (paragraph.startsWith('• ') || paragraph.startsWith('- ')) {
                                        return (
                                          <ul key={i} className="pl-5 my-2">
                                            <li className="mb-1 flex items-start">
                                              <span className="text-orange-400 mr-2">•</span>
                                              <span>{paragraph.replace(/^[•-]\s/, '')}</span>
                                            </li>
                                          </ul>
                                        );
                                      } else if (paragraph.match(/^\d+\.\s/)) {
                                        const number = paragraph.match(/^(\d+)\.\s/)?.[1];
                                        return (
                                          <ol key={i} className="pl-5 my-2">
                                            <li className="mb-1 flex items-start">
                                              <span className="text-orange-400 mr-2 font-bold">{number}.</span>
                                              <span>{paragraph.replace(/^\d+\.\s/, '')}</span>
                                            </li>
                                          </ol>
                                        );
                                      } else if (paragraph.startsWith('```')) {
                                        return (
                                          <div key={i} className="bg-gray-900 border border-gray-700 rounded-md p-3 my-3 font-mono text-sm overflow-x-auto">
                                            {paragraph.replace(/^```(\w+)?\n?/, '').replace(/```$/, '')}
                                          </div>
                                        );
                                      } else if (paragraph.startsWith('> ')) {
                                        return (
                                          <blockquote key={i} className="border-l-4 border-orange-500 pl-4 italic my-3 text-gray-300">
                                            {paragraph.replace(/^> /, '')}
                                          </blockquote>
                                        );
                                      } else {
                                        // Regular paragraph with enhanced typography
                                        return (
                                          <p key={i} className="mb-3 leading-relaxed tracking-wide">
                                            {paragraph.split(' ').map((word, wordIndex) => {
                                              // Highlight important words
                                              if (word.match(/^\*\*.*\*\*$/)) {
                                                return <strong key={wordIndex} className="font-bold text-orange-300">{word.replace(/^\*\*|\*\*$/g, '')}</strong>;
                                              } else if (word.match(/^\*.*\*$/)) {
                                                return <em key={wordIndex} className="italic text-orange-200">{word.replace(/^\*|\*$/g, '')}</em>;
                                              } else if (word.match(/^`.*`$/)) {
                                                return <code key={wordIndex} className="px-1.5 py-0.5 bg-gray-800 rounded text-orange-300">{word.replace(/^`|`$/g, '')}</code>;
                                              } else {
                                                return <span key={wordIndex}>{word} </span>;
                                              }
                                            })}
                                          </p>
                                        );
                                      }
                                    })}
                                  </div>
                                  <div className="absolute bottom-0 left-0 transform translate-y-1/2 -translate-x-1/4 w-4 h-4 rounded-sm bg-gray-800 rotate-45 border-l border-b border-gray-700/60"></div>
                                </div>
                                
                                {/* Text-to-speech button with wave animation - moved outside the message box */}
                                <button
                                  onClick={() => toggleSpeech(message.content)}
                                  className={`ml-2 p-1.5 rounded-full transition-all duration-300 ${isSpeaking ? 'bg-orange-500' : 'bg-gray-700/60 hover:bg-gray-700'}`}
                                  aria-label={isSpeaking ? "Stop speaking" : "Speak message"}
                                >
                                  <div className="relative w-5 h-5 flex items-center justify-center">
                                    {isSpeaking ? (
                                      <div className="flex items-center justify-center space-x-0.5">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                          <div 
                                            key={i}
                                            className="w-0.5 bg-white rounded-full animate-sound-wave"
                                            style={{
                                              height: `${Math.max(3, Math.min(15, Math.random() * 12))}px`,
                                              animationDelay: `${i * 0.1}s`
                                            }}
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <Volume2 size={16} className="text-gray-300" />
                                    )}
                                  </div>
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start mb-6"
                    >
                      <div className="flex flex-col space-y-1 max-w-[90%]">
                        <div className="flex items-center space-x-2 ml-2 mb-1">
                          <div className="w-5 h-5 rounded-full overflow-hidden border border-orange-500/30">
                            <img src="/logos/android-chrome-512x512.png" alt="AI Logo" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs text-orange-300">Daddy's AI</span>
                        </div>
                        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/60 rounded-2xl p-4 shadow-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-orange-500/80 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-3 h-3 rounded-full bg-orange-500/80 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-3 h-3 rounded-full bg-orange-500/80 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                            <span className="text-sm text-gray-400">Thinking...</span>
                          </div>
                          <div className="absolute bottom-0 left-0 transform translate-y-1/2 -translate-x-1/4 w-4 h-4 rounded-sm bg-gray-800 rotate-45 border-l border-b border-gray-700/60"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="mb-6"></div>
            )}
            
            <div className="mt-4">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-orange-600/20 to-orange-500/20 rounded-xl blur-xl group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      placeholder="How can Daddy's AI help with your finances today?"
                      className="w-full bg-gradient-to-r from-gray-900/90 to-gray-950/90 text-white border border-gray-800/80 group-hover:border-orange-500/40 rounded-xl px-5 py-4 pr-20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all duration-300 shadow-lg placeholder-gray-500 font-medium"
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                      {/* Voice input button with wave animation */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={toggleListening}
                        disabled={isLoading}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${isListening ? 'bg-orange-500' : 'bg-gray-800 hover:bg-gray-700'} text-white transition-all duration-300 shadow-md`}
                        aria-label={isListening ? "Stop listening" : "Start voice input"}
                      >
                        <div className="relative w-6 h-6 flex items-center justify-center">
                          {isListening ? (
                            <div className="flex items-center justify-center space-x-0.5">
                              {audioData.length > 0 ? (
                                // Show actual audio visualization when we have data
                                <div className="flex items-end justify-center h-5 space-x-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => {
                                    // Use audio data to determine bar height, or fallback to animation
                                    const dataIndex = Math.floor(i * (audioData.length / 5));
                                    const value = audioData[dataIndex] || 0;
                                    const height = Math.max(3, Math.min(20, (value / 255) * 20));
                                    
                                    return (
                                      <div 
                                        key={i}
                                        className="w-0.5 bg-white rounded-full"
                                        style={{
                                          height: `${height}px`,
                                          transition: 'height 100ms ease'
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                // Fallback animation when no audio data yet
                                <div className="flex items-end justify-center h-5 space-x-0.5">
                                  {[0, 1, 2, 3, 4].map((i) => (
                                    <div 
                                      key={i}
                                      className="w-0.5 bg-white rounded-full animate-sound-wave"
                                      style={{
                                        animationDelay: `${i * 0.1}s`
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Mic size={16} className="text-gray-300" />
                          )}
                        </div>
                      </motion.button>
                      
                      {isTyping && !isLoading && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-xs text-gray-500 bg-gray-800/60 rounded-md px-1.5 py-0.5">
                          <span>typing...</span>
                        </motion.div>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 transition-all duration-300 shadow-md shadow-orange-900/10"
                        aria-label="Send message"
                      >
                        <Send className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </form>
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 mt-3.5 px-1.5">
                <span className="mb-2 sm:mb-0 flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-orange-500" />
                  <span>Daddy's AI provides financial insights but always verify information independently.</span>
                </span>
                <div className="flex items-center space-x-5">
                  <span className="text-gray-400 flex items-center"><CornerDownLeft className="h-3 w-3 mr-1" /> Use Shift + Enter for new line</span>
                  <Link href="/dashboard/portfolio" className="text-orange-500 hover:text-orange-400 transition-colors flex items-center group">
                    <span>View Portfolio</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="M12 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add CSS for wave animation */}
      <style jsx global>{`
        @keyframes soundWave {
          0% { height: 3px; }
          50% { height: 12px; }
          100% { height: 3px; }
        }
        
        .animate-sound-wave {
          animation: soundWave 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}