# Little Fables

AI-powered story creation platform for parents and teachers. Create personalized, educational stories with our intuitive visual canvas.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/little-fables.git
cd little-fables
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Language**: TypeScript
- **State Management**: Zustand (coming soon)

## 📁 Project Structure

```
little-fables/
├── app/                    # Next.js app router pages
├── components/            
│   ├── ui/                # shadcn/ui components
│   ├── story/             # Story creation components
│   ├── workspace/         # Canvas workspace components
│   ├── chat/              # AI assistant components
│   └── shared/            # Shared components
├── lib/                   
│   ├── ai/                # AI integration
│   ├── supabase/          # Database client
│   └── utils/             # Utilities
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## 🎨 Design System

The app uses a custom design system with:

- **Primary Color**: Purple (#8B5CF6)
- **Secondary Color**: Blue (#3B82F6)
- **Success Color**: Green (#10B981)
- **Accent Colors**: Yellow, Pink, Blue
- **Fonts**: Inter (UI), Quicksand & Fredoka (Stories)

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding Components

We use shadcn/ui for base components. To add a new component:

```bash
npx shadcn@latest add [component-name]
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
