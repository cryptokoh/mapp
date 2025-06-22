// Embed configuration for different scenarios
export interface EmbedConfig {
  version: string;
  imageUrl: string;
  button: {
    title: string;
    action: {
      type: string;
      name?: string;
      url?: string;
      splashImageUrl?: string;
      splashBackgroundColor?: string;
    };
  };
}

// Base embed configuration
const BASE_EMBED: EmbedConfig = {
  version: "next",
  imageUrl: "https://fcmapp.netlify.app/stremeinu.png",
  button: {
    title: "🚀 Launch App",
    action: {
      type: "launch_frame",
      name: "Farcaster Mini App",
      url: "https://fcmapp.netlify.app",
      splashImageUrl: "https://fcmapp.netlify.app/stremeinu.png",
      splashBackgroundColor: "#8B5CF6"
    }
  }
};

// Different embed configurations for various scenarios
export const EMBED_CONFIGS = {
  // Default app embed
  default: BASE_EMBED,
  
  // Success state embed
  success: {
    ...BASE_EMBED,
    imageUrl: "https://fcmapp.netlify.app/stremeinu.png",
    button: {
      ...BASE_EMBED.button,
      title: "🎉 Try It Now!",
      action: {
        ...BASE_EMBED.button.action,
        url: "https://fcmapp.netlify.app?state=success"
      }
    }
  },
  
  // Feature showcase embed
  features: {
    ...BASE_EMBED,
    imageUrl: "https://fcmapp.netlify.app/stremeinu.png",
    button: {
      ...BASE_EMBED.button,
      title: "✨ Explore Features",
      action: {
        ...BASE_EMBED.button.action,
        url: "https://fcmapp.netlify.app?state=features"
      }
    }
  },
  
  // Neynar integration embed
  neynar: {
    ...BASE_EMBED,
    imageUrl: "https://fcmapp.netlify.app/stremeinu.png",
    button: {
      ...BASE_EMBED.button,
      title: "🔗 Connect with Neynar",
      action: {
        ...BASE_EMBED.button.action,
        url: "https://fcmapp.netlify.app?state=neynar"
      }
    }
  }
};

// Function to update the embed meta tag dynamically
export function updateEmbed(config: EmbedConfig): void {
  const metaTag = document.querySelector('meta[name="fc:frame"]');
  if (metaTag) {
    metaTag.setAttribute('content', JSON.stringify(config));
  }
}

// Function to create a shareable embed URL
export function createShareableEmbed(type: keyof typeof EMBED_CONFIGS = 'default'): string {
  const config = EMBED_CONFIGS[type];
  const embedData = encodeURIComponent(JSON.stringify(config));
  return `https://fcmapp.netlify.app?embed=${embedData}`;
}

// Function to get embed config based on URL parameters
export function getEmbedConfigFromURL(): EmbedConfig {
  const urlParams = new URLSearchParams(window.location.search);
  const embedType = urlParams.get('embed');
  const state = urlParams.get('state');
  
  if (embedType) {
    try {
      return JSON.parse(decodeURIComponent(embedType));
    } catch {
      // Fallback to default if parsing fails
    }
  }
  
  if (state && state in EMBED_CONFIGS) {
    return EMBED_CONFIGS[state as keyof typeof EMBED_CONFIGS];
  }
  
  return EMBED_CONFIGS.default;
}

// Function to generate embed HTML for server-side rendering
export function generateEmbedHTML(config: EmbedConfig): string {
  return `<meta name="fc:frame" content='${JSON.stringify(config)}' />`;
} 