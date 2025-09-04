# Journal Companion - Intelligent Self-Reflection Tool

A private, empathetic, and intelligent journaling companion that makes self-reflection a seamless and insightful daily habit. Built with Next.js, TypeScript, and powered by Google's Gemini AI.

## 🌟 Features

### ✍️ **Dynamic, Empathetic Prompts**
- Thoughtful, context-aware writing prompts based on your recent entries
- Categorized prompts for different reflection areas (gratitude, growth, relationships, creativity)
- Personalized suggestions that evolve with your journaling journey

### 🧠 **Private Sentiment & Theme Analysis**
- AI-powered analysis of your emotional patterns and recurring themes
- Sentiment tracking over time (positive, negative, neutral, mixed)
- Theme identification (work, family, relationships, creativity, stress, growth)
- All analysis done on-device for absolute privacy

### 📊 **Insightful Reflection Dashboard**
- Visual charts showing your emotional trends and patterns
- Weekly and monthly insights with gentle, supportive observations
- Growth recommendations based on your writing patterns
- Positive moments highlighting for encouragement

### 🔒 **Privacy-First Design**
- All data stored locally in your browser
- No external servers or databases
- Your thoughts remain completely private
- Optional AI analysis with your consent

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key (free)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd journal-companion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Gemini AI**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a free account and generate an API key
   - Copy the `.env.example` file to `.env.local`
   - Add your API key: `NEXT_PUBLIC_GEMINI_API_KEY=your_key_here`

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **AI Integration**: Google Gemini AI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Storage**: Local Storage (client-side)

## 📱 How to Use

### 1. **Start Writing**
- Choose from empathetic prompts or write freely
- Use the beautiful, distraction-free writing interface
- Save entries with ⌘+Enter or the Save button

### 2. **View Your Dashboard**
- Track your journaling statistics
- See sentiment trends over time
- Identify recurring themes in your writing

### 3. **Discover Insights**
- Get weekly summaries of your emotional patterns
- Receive gentle, supportive observations
- Find growth opportunities and recommendations

## 🔧 Configuration

### Environment Variables
```bash
# Required
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NEXT_PUBLIC_APP_NAME=Journal Companion
NEXT_PUBLIC_APP_DESCRIPTION=Your intelligent self-reflection tool
```

### Customization
- Modify prompt categories in `src/components/JournalEntry.tsx`
- Adjust AI analysis prompts in `src/lib/gemini.ts`
- Customize the color scheme in `tailwind.config.js`

## 🎯 Success Metrics

This application addresses the key challenges mentioned in the problem statement:

- ✅ **User Engagement**: Empathetic prompts and beautiful UI encourage daily journaling
- ✅ **Insightfulness**: AI-generated insights help discover meaningful patterns
- ✅ **Privacy & Trust**: Local storage and transparent design build confidence
- ✅ **AI Application**: Leverages NLP and sentiment analysis for empathetic experience

## 🚧 Future Enhancements

- [ ] Monthly insights and yearly retrospectives
- [ ] Export functionality for journal entries
- [ ] Mood tracking with visual calendars
- [ ] Goal setting and progress tracking
- [ ] Community features (optional, privacy-preserving)
- [ ] Mobile app with offline support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for providing the intelligent analysis capabilities
- The journaling community for inspiration and feedback
- Next.js and React teams for the excellent framework

## 📞 Support

If you have any questions or need help:
- Open an issue on GitHub
- Check the documentation
- Reach out to the development team

---

**Remember**: Every word you write is a step toward understanding yourself better. Your journal is a safe space for reflection and growth. 💝
