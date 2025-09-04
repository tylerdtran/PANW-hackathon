import { useState, useEffect, useRef } from 'react';
import { 
  PenTool, 
  Sparkles, 
  Heart, 
  Brain, 
  Users, 
  Briefcase, 
  Palette,
  Activity,
  BookOpen
} from 'lucide-react';
import { PromptSuggestion, JournalEntry as JournalEntryType } from '../types/journal';
import { generateDynamicPrompts, composeFromSpokenTranscript } from '../lib/gemini';

interface JournalEntryProps {
  onSave: (content: string) => void;
  isLoading: boolean;
  currentEntry: string;
  setCurrentEntry: (content: string) => void;
  entries: JournalEntryType[]; // Add entries prop for context
}

// Use more reliable icon names with fallbacks
const categoryIcons = {
  gratitude: Heart,
  growth: Brain,
  relationship: Users,
  reflection: PenTool,
  work: Briefcase,
  creativity: Palette,
  health: Activity,
  stress: BookOpen
};

// Fallback icon for any missing categories
const FallbackIcon = () => <div className="fallback-icon">💭</div>;

const categoryColors = {
  gratitude: 'gratitude-icon',
  growth: 'growth-icon',
  relationship: 'relationship-icon',
  reflection: 'reflection-icon',
  work: 'work-icon',
  creativity: 'creativity-icon',
  health: 'health-icon',
  stress: 'stress-icon'
};

export default function JournalEntry({ onSave, isLoading, currentEntry, setCurrentEntry, entries }: JournalEntryProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptSuggestion | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [prompts, setPrompts] = useState<PromptSuggestion[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    setWordCount(currentEntry.trim().split(/\s+/).filter(word => word.length > 0).length);
  }, [currentEntry]);

  useEffect(() => {
    // Load dynamic prompts when component mounts or entries change
    loadDynamicPrompts();
  }, [entries.length]); // Only depend on entries length to avoid infinite loops

  const loadDynamicPrompts = async () => {
    setPromptsLoading(true);
    try {
      const dynamicPrompts = await generateDynamicPrompts(entries);
      setPrompts(dynamicPrompts);
    } catch (error) {
      console.error('Failed to load dynamic prompts:', error);
      // Fallback to default prompts
      setPrompts(getDefaultPrompts());
    } finally {
      setPromptsLoading(false);
    }
  };

  const getDefaultPrompts = (): PromptSuggestion[] => [
    {
      id: 'default-1',
      text: "What's one thing you're grateful for today?",
      category: 'gratitude',
      context: 'Start your journaling journey with gratitude'
    },
    {
      id: 'default-2',
      text: "How are you feeling right now, and what led to this feeling?",
      category: 'reflection',
      context: 'Begin exploring your emotional landscape'
    },
    {
      id: 'default-3',
      text: "What's one challenge you're facing, and how are you growing through it?",
      category: 'growth',
      context: 'Reflect on personal development'
    }
  ];

  const handlePromptSelect = (prompt: PromptSuggestion) => {
    setSelectedPrompt(prompt);
    setCurrentEntry(prompt.text + '\n\n');
  };

  const handleSave = () => {
    if (currentEntry.trim()) {
      onSave(currentEntry);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    }
  };

  const handleRefreshPrompts = () => {
    loadDynamicPrompts();
  };

  // Speech-to-text via Web Speech API
  const startRecording = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser. Try Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    transcriptRef.current = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) transcriptRef.current += transcript + ' ';
        else interim += transcript;
      }
    };
    recognition.onerror = () => { setIsRecording(false); recognition.stop(); };
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  const stopRecordingAndCompose = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    const raw = transcriptRef.current.trim();
    if (!raw) return;
    setIsComposing(true);
    try {
      const { composedText, evaluation } = await composeFromSpokenTranscript(raw);
      const appended = (currentEntry ? currentEntry + '\n\n' : '') + composedText + '\n\n' + '— Reflection: ' + evaluation;
      setCurrentEntry(appended);
    } catch (e) {
      console.error(e);
    } finally {
      setIsComposing(false);
    }
  };

  return (
    <div className="journal-entry">
      {/* Header */}
      <div className="journal-header">
        <div className="journal-badge">
          <div className="journal-badge-dot"></div>
          <span className="journal-badge-text">Ready to reflect?</span>
        </div>
        <h2 className="journal-title">How are you feeling today?</h2>
        <p className="journal-subtitle">Take a moment to reflect, express, and grow</p>
      </div>

      {/* Prompt Suggestions */}
      <div className="prompts-section">
        <div className="prompts-header">
          <div className="prompts-icon">
            <Sparkles size={20} />
          </div>
          <div className="prompts-title-section">
            <h3>Writing Prompts</h3>
            <button 
              onClick={handleRefreshPrompts}
              className="refresh-prompts-btn"
              disabled={promptsLoading}
            >
              {promptsLoading ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
        
        {promptsLoading ? (
          <div className="prompts-loading">
            <div className="loading-spinner"></div>
            <p>Generating personalized prompts...</p>
          </div>
        ) : (
          <div className="prompts-grid">
            {prompts.map((prompt) => {
              const colorClass = categoryColors[prompt.category as keyof typeof categoryColors] || 'gratitude-icon';
              
              return (
                <button
                  key={prompt.id}
                  onClick={() => handlePromptSelect(prompt)}
                  className={`prompt-card ${selectedPrompt?.id === prompt.id ? 'selected' : ''}`}
                >
                  <div className="prompt-content">
                    <div className={`prompt-icon ${colorClass}`}>
                      {renderIcon(prompt.category)}
                    </div>
                    <div className="prompt-text">
                      <span className="prompt-badge">{prompt.category}</span>
                      <p className="prompt-question">{prompt.text}</p>
                      <p className="prompt-context">{prompt.context}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Writing Area */}
      <div className="writing-section">
        <div className="writing-header">
          <h3 className="writing-title">
            <div className="writing-icon">
              <PenTool size={16} />
            </div>
            Your Journal Entry
          </h3>
          <div className="word-count">
            <span className="word-count-text">{wordCount} words</span>
          </div>
        </div>
        
        <div className="textarea-container">
          <textarea
            value={currentEntry}
            onChange={(e) => setCurrentEntry(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your thoughts, feelings, and reflections here..."
            className="textarea"
          />
          <div className="textarea-overlay"></div>
        </div>
        
        <div className="writing-controls">
          <div className="shortcut-info">
            <div className="shortcut-key">⌘</div>
            <span>+</span>
            <div className="shortcut-key">Enter</div>
            <span>to save</span>
          </div>
          
          <div className="writing-actions">
            <button
              onClick={isRecording ? stopRecordingAndCompose : startRecording}
              className={`mic-button ${isRecording ? 'recording' : ''}`}
              disabled={isComposing}
              aria-pressed={isRecording}
            >
              {isRecording ? '⏹ Stop & Compose' : '🎤 Speak to Journal'}
            </button>
            <button
              onClick={handleSave}
              disabled={!currentEntry.trim() || isLoading}
              className="save-button"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Entry</span>
                  <div className="save-button-dot"></div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Encouragement */}
      <div className="encouragement">
        <div className="encouragement-badge">
          <span className="encouragement-emoji">💝</span>
          <span className="encouragement-title">Remember</span>
        </div>
        <p className="encouragement-text">
          Every word you write is a step toward understanding yourself better.
        </p>
      </div>
    </div>
  );
}

// Safe icon renderer with fallback
function renderIcon(category: string) {
  const map: any = {
    gratitude: Heart,
    growth: Brain,
    relationship: Users,
    reflection: PenTool,
    work: Briefcase,
    creativity: Palette,
    health: Activity,
    stress: BookOpen
  };
  const Icon = map[category];
  return Icon ? <Icon size={24} /> : <FallbackIcon />;
}
