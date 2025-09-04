import { useState, useMemo } from 'react';
import { Lightbulb, TrendingUp, Heart, Brain, Users, Calendar, Sparkles, Briefcase } from 'lucide-react';
import { JournalEntry } from '../types/journal';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

interface InsightSummaryProps {
  entries: JournalEntry[];
}

export default function InsightSummary({ entries }: InsightSummaryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  const insights = useMemo(() => {
    if (entries.length === 0) return null;

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const periodStart = selectedPeriod === 'week' ? weekStart : monthStart;
    const periodEnd = selectedPeriod === 'week' ? weekEnd : monthEnd;

    const periodEntries = entries.filter(entry => 
      isWithinInterval(new Date(entry.timestamp), { start: periodStart, end: periodEnd })
    );

    if (periodEntries.length === 0) return null;

    // Analyze themes
    const themeFrequency: Record<string, number> = {};
    periodEntries.forEach(entry => {
      entry.themes.forEach(theme => {
        themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
      });
    });

    const topThemes = Object.entries(themeFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme);

    // Analyze sentiment trends
    const sentimentCounts = periodEntries.reduce((acc, entry) => {
      acc[entry.sentiment] = (acc[entry.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantSentiment = Object.entries(sentimentCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    // Generate insights based on patterns
    const insights: string[] = [];
    
    if (sentimentCounts.positive > sentimentCounts.negative) {
      insights.push("You've been experiencing more positive emotions this period");
    }
    
    if (topThemes.includes('work') || topThemes.includes('career')) {
      insights.push("Work and career have been prominent themes in your reflections");
    }
    
    if (topThemes.includes('relationship') || topThemes.includes('family')) {
      insights.push("Your relationships and connections have been important to you");
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (sentimentCounts.negative > 0) {
      recommendations.push("Consider practicing self-compassion and mindfulness");
    }
    
    if (topThemes.includes('stress') || topThemes.includes('anxiety')) {
      recommendations.push("Try incorporating stress-reduction techniques into your routine");
    }
    
    if (periodEntries.length < 3) {
      recommendations.push("Aim to write more consistently to gain deeper insights");
    }

    return {
      period: selectedPeriod === 'week' ? 'this week' : 'this month',
      totalEntries: periodEntries.length,
      topThemes,
      dominantSentiment,
      insights,
      recommendations,
      highlights: periodEntries
        .filter(entry => entry.sentiment === 'positive')
        .slice(0, 2)
        .map(entry => entry.content.substring(0, 100) + '...')
    };
  }, [entries, selectedPeriod]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lightbulb className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-600 mb-3">No insights yet</h3>
        <p className="text-gray-500 text-lg">Start writing to discover meaningful patterns in your thoughts and feelings!</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-gray-800 mb-3">Your Personal Insights</h2>
          <p className="text-xl text-gray-600">Discover patterns and growth opportunities in your journaling journey</p>
        </div>
        
        <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              selectedPeriod === 'week'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              selectedPeriod === 'month'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled
            title="Coming soon"
          >
            This Month
          </button>
        </div>
      </div>

      {insights ? (
        <>
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 rounded-3xl p-10 border border-blue-200 shadow-xl">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-blue-800 mb-4">
                  {selectedPeriod === 'week' ? 'Weekly' : 'Monthly'} Reflection Summary
                </h3>
                <p className="text-blue-700 text-xl leading-relaxed">
                  Over {insights.period}, you&apos;ve written {insights.totalEntries} journal entries. 
                  Your reflections have been primarily {insights.dominantSentiment}, with themes around{' '}
                  {insights.topThemes.join(', ')} being most prominent.
                </p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                Key Patterns
              </h3>
              <ul className="space-y-4">
                {insights.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-lg leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                Growth Opportunities
              </h3>
              <ul className="space-y-4">
                {insights.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-lg leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Theme Analysis */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              Theme Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {insights.topThemes.map((theme) => {
                const icons = {
                  work: Briefcase,
                  relationship: Users,
                  family: Heart,
                  creativity: Sparkles,
                  growth: Brain,
                  stress: TrendingUp
                };
                const IconComponent = icons[theme as keyof typeof icons] || Lightbulb;
                
                return (
                  <div key={theme} className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-bold text-gray-800 text-lg capitalize mb-2">{theme}</p>
                    <p className="text-gray-500">Prominent theme</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Positive Highlights */}
          {insights.highlights.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-100 rounded-3xl p-8 border border-emerald-200 shadow-xl">
              <h3 className="text-2xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                Positive Moments to Remember
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {insights.highlights.map((highlight, index) => (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg">
                    <p className="text-gray-700 italic text-lg leading-relaxed">&ldquo;{highlight}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-600 mb-3">No entries in this period</h3>
          <p className="text-gray-500 text-lg">Try writing a few entries to see your insights here!</p>
        </div>
      )}

      {/* Encouragement */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-100 rounded-3xl p-8 border border-purple-200 shadow-xl text-center">
        <div className="inline-flex items-center gap-3 bg-white/80 rounded-2xl px-6 py-3 mb-4">
          <span className="text-2xl">💜</span>
          <span className="text-purple-800 font-semibold">Keep Growing</span>
        </div>
        <p className="text-purple-800 text-xl font-medium leading-relaxed">
          Every entry you write helps you understand yourself better. 
          Your journal is a safe space for reflection and growth.
        </p>
      </div>
    </div>
  );
}
