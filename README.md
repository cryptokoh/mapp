# 🚀 Farcaster Mini App

A beautiful Farcaster Mini App built with React, TypeScript, and Vite. Features Neynar integration and a stunning purple gradient theme!

## ✨ Features

- **React + TypeScript + Vite** - Modern development stack
- **Farcaster SDK Integration** - Full Mini App capabilities
- **Neynar API** - Enhanced Farcaster functionality
- **Beautiful UI** - Purple gradient theme with smooth animations
- **Dynamic Embeds** - Shareable content with different states
- **Responsive Design** - Works on all devices
- **Dark Mode Support** - Automatic theme switching

## 🎯 Embed System

This Mini App includes a comprehensive embed system that allows users to share different states of the app:

### Available Embed States

1. **Default** (`/`) - Main app introduction
2. **Success** (`/?state=success`) - Success state with feature highlights
3. **Features** (`/?state=features`) - Feature showcase
4. **Neynar** (`/?state=neynar`) - Neynar integration details

### How to Share

Users can share the app using the built-in share buttons that:
- Create casts with app embeds
- Copy shareable links
- Support different embed configurations

### Embed URLs

- **Main App**: `https://fcmapp.netlify.app`
- **Success State**: `https://fcmapp.netlify.app?state=success`
- **Features**: `https://fcmapp.netlify.app?state=features`
- **Neynar**: `https://fcmapp.netlify.app?state=neynar`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Neynar API credentials:
```
VITE_NEYNAR_API_KEY=your_api_key_here
VITE_NEYNAR_CLIENT_ID=your_client_id_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🏗️ Development

### Project Structure

```
src/
├── components/
│   ├── ShareButton.tsx      # Share functionality
│   └── ShareButton.css      # Share button styles
├── lib/
│   ├── embeds.ts           # Embed configuration system
│   └── neynar.ts           # Neynar API integration
├── App.tsx                 # Main app component
├── App.css                 # App styles
└── main.tsx               # App entry point
```

### Key Components

#### Embed System (`src/lib/embeds.ts`)
- Manages different embed configurations
- Handles dynamic embed updates
- Creates shareable URLs

#### Share Button (`src/components/ShareButton.tsx`)
- Allows users to share the app
- Supports multiple embed variants
- Integrates with Farcaster casting

### Adding New Embed States

1. Add a new configuration to `EMBED_CONFIGS` in `src/lib/embeds.ts`
2. Add the corresponding state handling in `src/App.tsx`
3. Update the UI to support the new state

## 🌐 Deployment

### Netlify (Recommended)

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy!

### Environment Variables

Make sure to set these in your deployment platform:
- `VITE_NEYNAR_API_KEY` - Your Neynar API key
- `VITE_NEYNAR_CLIENT_ID` - Your Neynar client ID

## 🔗 Links

- **Live App**: https://fcmapp.netlify.app
- **Farcaster Mini Apps Docs**: https://docs.farcaster.xyz/mini-apps
- **Neynar Documentation**: https://docs.neynar.com

## 📝 License

MIT License - feel free to use this project as a starting point for your own Farcaster Mini App!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for the Farcaster community!
