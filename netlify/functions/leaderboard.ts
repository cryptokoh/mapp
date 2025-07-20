import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface LeaderboardEntry {
  id: string;
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  score: number;
  tokensCollected: number;
  level: number;
  timestamp: number;
  rank?: number;
  favoriteToken?: {
    symbol: string;
    name: string;
    count: number;
    img_url: string;
  };
  tokenStats?: Record<string, {
    count: number;
    totalValue: number;
    name: string;
    img_url: string;
    contract_address?: string;
  }>;
  gameplayStats?: {
    playTime: number;
    missedTokens: number;
    rocksHit: number;
    rocksSpawned: number;
    speedBoostsCollected: number;
    holdBonusTotal: number;
    longestStreak: number;
    totalTokenValue: number;
    uniqueTokenTypes: number;
  };
}

interface LeaderboardResponse {
  success: boolean;
  data?: LeaderboardEntry[] | LeaderboardEntry;
  error?: string;
  stats?: {
    totalPlayers: number;
    totalScores: number;
    highestScore: number;
  };
}

// Using jsonstorage.net - free, no auth required, 20MB limit
const STORAGE_ID = process.env.JSON_STORAGE_ID || 'superinu-leaderboard-2024';
const STORAGE_URL = `https://api.jsonstorage.net/v1/json/${STORAGE_ID}`;

// In-memory cache
let cachedData: { entries: LeaderboardEntry[], lastFetch: number } | null = null;
const CACHE_DURATION = 5000; // 5 seconds

async function fetchLeaderboardData(): Promise<LeaderboardEntry[]> {
  // Check cache first
  if (cachedData && Date.now() - cachedData.lastFetch < CACHE_DURATION) {
    return cachedData.entries;
  }

  try {
    const response = await fetch(STORAGE_URL);
    
    if (response.status === 404) {
      // First time - initialize empty leaderboard
      await saveLeaderboardData([]);
      return [];
    }

    if (!response.ok) {
      throw new Error(`Storage API error: ${response.status}`);
    }

    const entries = await response.json() as LeaderboardEntry[];
    
    // Update cache
    cachedData = { entries, lastFetch: Date.now() };
    
    return entries;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return cachedData?.entries || [];
  }
}

async function saveLeaderboardData(entries: LeaderboardEntry[]): Promise<void> {
  try {
    const response = await fetch(STORAGE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entries),
    });

    if (!response.ok) {
      throw new Error(`Storage API error: ${response.status}`);
    }

    // Update cache
    cachedData = { entries, lastFetch: Date.now() };
  } catch (error) {
    console.error('Error saving leaderboard:', error);
    // Keep data in cache even if save fails
    cachedData = { entries, lastFetch: Date.now() };
  }
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<{
  statusCode: number;
  headers: { [key: string]: string };
  body: string;
}> => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    const path = event.path;
    const method = event.httpMethod;

    // GET /leaderboard - Get leaderboard entries
    if (method === "GET" && path.includes("/leaderboard")) {
      const allEntries = await fetchLeaderboardData();
      
      // Group by player and get their best score
      const bestScoresByPlayer = new Map<number, LeaderboardEntry>();
      
      allEntries.forEach(entry => {
        const existing = bestScoresByPlayer.get(entry.fid);
        if (!existing || entry.score > existing.score) {
          bestScoresByPlayer.set(entry.fid, entry);
        }
      });
      
      // Convert to array and sort by score
      const sortedEntries = Array.from(bestScoresByPlayer.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 100) // Limit to top 100
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      const uniquePlayers = bestScoresByPlayer.size;
      const highestScore = sortedEntries.length > 0 ? sortedEntries[0].score : 0;

      const response: LeaderboardResponse = {
        success: true,
        data: sortedEntries,
        stats: {
          totalPlayers: uniquePlayers,
          totalScores: allEntries.length,
          highestScore,
        },
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };
    }

    // POST /leaderboard - Submit new score
    if (method === "POST" && path.includes("/leaderboard")) {
      if (!event.body) {
        const response: LeaderboardResponse = {
          success: false,
          error: "Request body is required",
        };
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify(response),
        };
      }

      const entryData = JSON.parse(event.body);
      
      // Validate required fields
      const requiredFields = ['fid', 'username', 'displayName', 'score', 'tokensCollected', 'level'];
      for (const field of requiredFields) {
        if (entryData[field] === undefined || entryData[field] === null) {
          const response: LeaderboardResponse = {
            success: false,
            error: `Missing required field: ${field}`,
          };
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify(response),
          };
        }
      }

      const newEntry: LeaderboardEntry = {
        id: `${entryData.fid}-${Date.now()}`,
        fid: entryData.fid,
        username: entryData.username,
        displayName: entryData.displayName,
        pfpUrl: entryData.pfpUrl || '',
        score: Math.max(0, Math.floor(entryData.score)), // Ensure positive integer
        tokensCollected: Math.max(0, Math.floor(entryData.tokensCollected)),
        level: Math.max(1, Math.floor(entryData.level)),
        timestamp: Date.now(),
        favoriteToken: entryData.favoriteToken,
        tokenStats: entryData.tokenStats,
        gameplayStats: entryData.gameplayStats,
      };

      // Get current data and add new entry
      const currentEntries = await fetchLeaderboardData();
      currentEntries.push(newEntry);

      // Keep only recent entries (last 500 games)
      if (currentEntries.length > 500) {
        currentEntries.sort((a, b) => b.timestamp - a.timestamp);
        currentEntries.splice(500);
      }

      // Save back to storage
      await saveLeaderboardData(currentEntries);

      // Calculate rank
      const sortedEntries = currentEntries.sort((a, b) => b.score - a.score);
      const rank = sortedEntries.findIndex(e => e.id === newEntry.id) + 1;
      newEntry.rank = rank;

      const response: LeaderboardResponse = {
        success: true,
        data: newEntry,
      };

      console.log(`🏆 New score submitted: ${newEntry.displayName} - ${newEntry.score} points (Rank: ${rank})`);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(response),
      };
    }

    // GET /leaderboard/user/:fid - Get user's best score and rank
    if (method === "GET" && path.includes("/leaderboard/user/")) {
      const fid = parseInt(path.split("/").pop() || "0");
      
      if (!fid) {
        const response: LeaderboardResponse = {
          success: false,
          error: "Invalid user FID",
        };
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify(response),
        };
      }

      const allEntries = await fetchLeaderboardData();
      const userEntries = allEntries.filter(e => e.fid === fid);
      
      if (userEntries.length === 0) {
        const response: LeaderboardResponse = {
          success: false,
          error: "User not found",
        };
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify(response),
        };
      }

      const bestEntry = userEntries.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      // Calculate rank among deduplicated scores
      const bestScoresByPlayer = new Map<number, number>();
      allEntries.forEach(entry => {
        const existing = bestScoresByPlayer.get(entry.fid);
        if (!existing || entry.score > existing) {
          bestScoresByPlayer.set(entry.fid, entry.score);
        }
      });

      const sortedScores = Array.from(bestScoresByPlayer.entries())
        .sort((a, b) => b[1] - a[1]);
      
      const rank = sortedScores.findIndex(([playerFid]) => playerFid === fid) + 1;
      bestEntry.rank = rank;

      const response: LeaderboardResponse = {
        success: true,
        data: bestEntry,
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };
    }

    // Route not found
    const response: LeaderboardResponse = {
      success: false,
      error: "Route not found",
    };

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error("Leaderboard API Error:", error);
    
    const response: LeaderboardResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};

export { handler };