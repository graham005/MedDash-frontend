// src/components/HealthBot/HealthBotChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, Phone } from 'lucide-react';
import { useHealthBot } from '../../hooks/useHealthBot';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  escalate?: boolean;
  reasoning?: string;
}

interface HealthBotChatProps {
  className?: string;
}

export const HealthBotChat: React.FC<HealthBotChatProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "👋 Hello! I'm your health assistant. I'm here to help with medication questions, post-visit instructions, and general health guidance. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { askQuestion, handleEmergency, isLoading, error } = useHealthBot();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const question = inputValue.trim();
    setInputValue('');

    try {
      const response = isEmergencyMode 
        ? await handleEmergency(question)
        : await askQuestion(question);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
        escalate: response.escalate,
        reasoning: response.reasoning,
      };

      setMessages(prev => [...prev, botMessage]);

      // Reset emergency mode after handling
      if (isEmergencyMode) {
        setIsEmergencyMode(false);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment, or contact your healthcare provider if it's urgent.",
        timestamp: new Date(),
        escalate: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg flex flex-col h-[600px] ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Health Assistant</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEmergencyMode(!isEmergencyMode)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isEmergencyMode
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 hover:bg-blue-400 text-white'
              }`}
            >
              {isEmergencyMode ? '🚨 Emergency' : 'Emergency'}
            </button>
          </div>
        </div>
        {isEmergencyMode && (
          <div className="mt-2 text-red-100 text-sm">
            <Phone className="w-4 h-4 inline mr-1" />
            Emergency mode active. For immediate emergencies, call 911/112.
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'bot' && <Bot className="w-5 h-5 mt-0.5 text-blue-600" />}
                {message.type === 'user' && <User className="w-5 h-5 mt-0.5" />}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Bot message metadata */}
                  {message.type === 'bot' && (
                    <div className="mt-2 space-y-1">
                      
                      {/* Escalation warning */}
                      {message.escalate && (
                        <div className="flex items-center space-x-1 text-xs text-orange-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Professional consultation recommended</span>
                        </div>
                      )}
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Sources: {message.sources.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-l-4 border-red-500">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isEmergencyMode 
                ? "Describe your emergency situation..." 
                : "Ask about medications, symptoms, or health guidance..."
            }
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isEmergencyMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          💡 This is for informational purposes only. Always consult healthcare professionals for medical decisions.
        </div>
      </form>
    </div>
  );
};