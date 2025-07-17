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

// In-memory storage (in production, use a proper database)
let leaderboardData: LeaderboardEntry[] = [];

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
      const sortedEntries = leaderboardData
        .sort((a, b) => b.score - a.score)
        .slice(0, 100) // Limit to top 100
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      const uniquePlayers = new Set(sortedEntries.map(e => e.fid)).size;
      const highestScore = sortedEntries.length > 0 ? sortedEntries[0].score : 0;

      const response: LeaderboardResponse = {
        success: true,
        data: sortedEntries,
        stats: {
          totalPlayers: uniquePlayers,
          totalScores: leaderboardData.length,
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
      };

      // Add to leaderboard
      leaderboardData.push(newEntry);

      // Keep only recent entries to prevent memory issues (in production, use proper DB)
      if (leaderboardData.length > 1000) {
        leaderboardData = leaderboardData
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 500);
      }

      // Calculate rank
      const sortedEntries = leaderboardData.sort((a, b) => b.score - a.score);
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

      const userEntries = leaderboardData.filter(e => e.fid === fid);
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

      const sortedEntries = leaderboardData.sort((a, b) => b.score - a.score);
      const rank = sortedEntries.findIndex(e => e.fid === fid && e.score === bestEntry.score) + 1;
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