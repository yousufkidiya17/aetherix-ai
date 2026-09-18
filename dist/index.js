// server/index.ts
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var CONFIG = {
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || "flzFgPJCZ39V6SExEfwY72U7fAbOBH0V",
  MISTRAL_API_URL: "https://api.mistral.ai/v1/chat/completions",
  MISTRAL_MODEL: "mistral-large-latest",
  OPENCODE_PROXY_URL: "http://18.206.216.238:4000/v1/chat/completions"
};
var MCPManager = class {
  servers = /* @__PURE__ */ new Map();
  requestId = 0;
  pendingOAuth = /* @__PURE__ */ new Map();
  // state -> pending auth
  constructor() {
    console.log("\u{1F50C} MCP Orchestrator initialized");
    this.registerServer({
      id: "swiggy-food",
      name: "Swiggy Food",
      url: "https://mcp.swiggy.com/food",
      icon: "\u{1F354}",
      description: "Order food from restaurants",
      transport: "http",
      authType: "oauth-pkce",
      status: "disconnected",
      tools: [],
      authEndpoint: "https://mcp.swiggy.com/auth/authorize",
      tokenEndpoint: "https://mcp.swiggy.com/auth/token"
    });
    this.registerServer({
      id: "swiggy-instamart",
      name: "Swiggy Instamart",
      url: "https://mcp.swiggy.com/im",
      icon: "\u{1F6D2}",
      description: "Grocery & essentials delivery",
      transport: "http",
      authType: "oauth-pkce",
      status: "disconnected",
      tools: [],
      authEndpoint: "https://mcp.swiggy.com/auth/authorize",
      tokenEndpoint: "https://mcp.swiggy.com/auth/token"
    });
    this.registerServer({
      id: "swiggy-dineout",
      name: "Swiggy Dineout",
      url: "https://mcp.swiggy.com/dineout",
      icon: "\u{1F37D}\uFE0F",
      description: "Restaurant reservations & deals",
      transport: "http",
      authType: "oauth-pkce",
      status: "disconnected",
      tools: [],
      authEndpoint: "https://mcp.swiggy.com/auth/authorize",
      tokenEndpoint: "https://mcp.swiggy.com/auth/token"
    });
  }
  registerServer(config) {
    this.servers.set(config.id, config);
    console.log(`  \u{1F4E1} Registered: ${config.icon} ${config.name} (${config.url})`);
  }
  // Connect to an MCP server and discover its tools
  async connectServer(serverId, authToken) {
    const server = this.servers.get(serverId);
    if (!server) return { success: false, tools: [], error: "Server not found" };
    if (authToken) server.authToken = authToken;
    if (server.authType === "oauth-pkce" && !server.authToken) {
      console.log(`[MCP] ${server.name} requires OAuth \u2014 auth needed`);
      server.status = "auth_required";
      return { success: false, tools: [], authRequired: true, error: "Login required. Click 'Login with Swiggy' to authenticate." };
    }
    try {
      console.log(`[MCP] Connecting to ${server.name} (${server.url})...`);
      const initResult = await this.jsonRPC(server, "initialize", {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "aetherix-ai", version: "2.0.0" }
      });
      console.log(`[MCP] ${server.name} initialized:`, JSON.stringify(initResult).slice(0, 200));
      const toolsResult = await this.jsonRPC(server, "tools/list", {});
      const tools = (toolsResult?.tools || []).map((t) => ({
        name: t.name,
        description: t.description || "",
        inputSchema: t.inputSchema || {},
        serverId: server.id,
        serverName: server.name
      }));
      server.tools = tools;
      server.status = "connected";
      server.connectedAt = /* @__PURE__ */ new Date();
      server.errorMsg = void 0;
      console.log(`[MCP] \u2705 ${server.name} connected \u2014 ${tools.length} tools discovered:`);
      tools.forEach((t) => console.log(`     \u{1F527} ${t.name}: ${t.description.slice(0, 80)}`));
      return { success: true, tools };
    } catch (err) {
      console.error(`[MCP] \u274C ${server.name} connection failed:`, err.message);
      server.status = "error";
      server.errorMsg = err.message;
      return { success: false, tools: [], error: err.message };
    }
  }
  // Generate OAuth PKCE authorization URL for a server
  startOAuth(serverId, callbackUrl) {
    const server = this.servers.get(serverId);
    if (!server || !server.authEndpoint) return null;
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    const state = crypto.randomBytes(16).toString("hex");
    this.pendingOAuth.set(state, {
      serverId,
      codeVerifier,
      state,
      createdAt: Date.now()
    });
    for (const [key, val] of this.pendingOAuth) {
      if (Date.now() - val.createdAt > 6e5) this.pendingOAuth.delete(key);
    }
    const cimdClientId = callbackUrl.replace("/api/mcp/auth/callback", "/.well-known/oauth-client.json");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: cimdClientId,
      redirect_uri: callbackUrl,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      scope: "mcp:tools"
    });
    const authUrl = `${server.authEndpoint}?${params.toString()}`;
    console.log(`[OAuth] Started PKCE flow for ${server.name}, state=${state}, client_id=${cimdClientId}`);
    return { authUrl, state };
  }
  // Exchange auth code for token after OAuth callback
  async exchangeToken(state, code, callbackUrl) {
    const pending = this.pendingOAuth.get(state);
    if (!pending) return { success: false, error: "Invalid or expired OAuth state" };
    const server = this.servers.get(pending.serverId);
    if (!server || !server.tokenEndpoint) return { success: false, error: "Server not found" };
    try {
      console.log(`[OAuth] Exchanging code for token (${server.name})...`);
      const tokenRes = await fetch(server.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
          client_id: callbackUrl.replace("/api/mcp/auth/callback", "/.well-known/oauth-client.json"),
          code_verifier: pending.codeVerifier
        }).toString(),
        signal: AbortSignal.timeout(15e3)
      });
      if (!tokenRes.ok) {
        const errText = await tokenRes.text().catch(() => "");
        throw new Error(`Token exchange failed: HTTP ${tokenRes.status} \u2014 ${errText.slice(0, 200)}`);
      }
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) throw new Error("No access_token in response");
      console.log(`[OAuth] \u2705 Got token for ${server.name}`);
      server.authToken = accessToken;
      this.pendingOAuth.delete(state);
      const connectResult = await this.connectServer(pending.serverId);
      return { success: connectResult.success, serverId: pending.serverId, error: connectResult.error };
    } catch (err) {
      console.error(`[OAuth] \u274C Token exchange failed:`, err.message);
      this.pendingOAuth.delete(state);
      return { success: false, serverId: pending.serverId, error: err.message };
    }
  }
  async disconnectServer(serverId) {
    const server = this.servers.get(serverId);
    if (server) {
      server.status = "disconnected";
      server.tools = [];
      server.authToken = void 0;
      console.log(`[MCP] Disconnected: ${server.name}`);
    }
  }
  // Call a tool on a specific server
  async callTool(serverId, toolName, args) {
    const server = this.servers.get(serverId);
    if (!server) return { success: false, error: "Server not found" };
    if (server.status !== "connected") return { success: false, error: `${server.name} is not connected` };
    try {
      console.log(`[MCP] \u{1F527} Calling ${server.name}/${toolName}`, JSON.stringify(args).slice(0, 150));
      const result = await this.jsonRPC(server, "tools/call", { name: toolName, arguments: args });
      console.log(`[MCP] \u2705 ${server.name}/${toolName} result:`, JSON.stringify(result).slice(0, 200));
      return { success: true, _source: server.name, _server: server.id, ...result };
    } catch (err) {
      console.error(`[MCP] \u274C Tool call failed:`, err.message);
      return { success: false, error: err.message };
    }
  }
  // Find which server has a given tool
  findToolServer(toolName) {
    for (const server of this.servers.values()) {
      if (server.status !== "connected") continue;
      const tool = server.tools.find((t) => t.name === toolName);
      if (tool) return { server, tool };
    }
    return null;
  }
  // Call a tool by name (auto-routes to correct server)
  async callToolByName(toolName, args) {
    const found = this.findToolServer(toolName);
    if (!found) return { success: false, error: `No connected server has tool: ${toolName}` };
    return this.callTool(found.server.id, toolName, args);
  }
  // Get all available tools across all connected servers (for AI system prompt)
  getAllTools() {
    const tools = [];
    for (const server of this.servers.values()) {
      if (server.status === "connected") tools.push(...server.tools);
    }
    return tools;
  }
  // Generate dynamic tool description for the AI
  getToolsPrompt() {
    const connectedServers = [...this.servers.values()].filter((s) => s.status === "connected");
    if (connectedServers.length === 0) return "No external MCP servers connected. Using built-in demo data.";
    let prompt = "CONNECTED MCP SERVERS & AVAILABLE TOOLS:\n";
    for (const server of connectedServers) {
      prompt += `
${server.icon} **${server.name}** (${server.tools.length} tools):
`;
      for (const tool of server.tools) {
        const params = tool.inputSchema?.properties ? Object.keys(tool.inputSchema.properties).join(", ") : "no params";
        prompt += `  - \`${tool.name}\`: ${tool.description} [params: ${params}]
`;
      }
    }
    prompt += `
When calling a tool, use: action: { "tool": "<tool_name>", "params": { ... }, "server": "<server_id>" }`;
    return prompt;
  }
  // Get all server statuses (for API/frontend)
  getServersStatus() {
    return [...this.servers.values()].map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      url: s.url,
      description: s.description,
      status: s.status,
      toolCount: s.tools.length,
      tools: s.tools.map((t) => ({ name: t.name, description: t.description })),
      connectedAt: s.connectedAt?.toISOString(),
      error: s.errorMsg
    }));
  }
  // Add a custom MCP server
  addServer(id, name, url, icon, description) {
    this.registerServer({
      id,
      name,
      url,
      icon,
      description,
      transport: "http",
      authType: "bearer",
      status: "disconnected",
      tools: []
    });
  }
  removeServer(serverId) {
    this.servers.delete(serverId);
  }
  // JSON-RPC 2.0 transport
  async jsonRPC(server, method, params) {
    this.requestId++;
    const headers = { "Content-Type": "application/json" };
    if (server.authToken) {
      if (server.authType === "bearer") headers["Authorization"] = `Bearer ${server.authToken}`;
      if (server.authType === "cookie") headers["Cookie"] = server.authToken;
    }
    const body = { jsonrpc: "2.0", id: this.requestId, method, params };
    const response = await fetch(server.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "MCP RPC error");
    return data.result;
  }
};
var mcpManager = new MCPManager();
async function callMCP(intent, tool, params, _userId) {
  const mcpServer = mcpManager.findToolServer(tool);
  if (mcpServer) {
    console.log(`[MCP Router] Found tool "${tool}" on ${mcpServer.server.name}`);
    const result = await mcpManager.callTool(mcpServer.server.id, tool, params);
    if (result.success) return result;
    console.log(`[MCP Router] \u26A0\uFE0F MCP call failed, trying fallback...`);
  }
  switch (intent) {
    case "food":
      return foodHandler(tool, params);
    case "rides":
      return ridesHandler(tool, params);
    case "workers":
      return workersHandler(tool, params);
    case "web": {
      if (tool === "web_search") {
        const results = await searchDuckDuckGo(params.query || "");
        return { success: true, results };
      }
      if (tool === "web_fetch") {
        const content = await fetchUrlContent(params.url || "");
        return { success: true, content };
      }
      return { success: false, error: `Unknown web tool: ${tool}` };
    }
    default:
      return { success: false, error: `No handler for: ${intent}/${tool}` };
  }
}
var AI_MODELS = [
  { id: "opencode/big-pickle", name: "Aetherix AI", provider: "opencode", vision: false, description: "Aetherix's default AI model" }
];
function uuid() {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}
var restaurants = [
  {
    id: "rest_001",
    name: "Tandoori Nights",
    cuisine: "North Indian",
    rating: 4.6,
    deliveryTime: "30-40 min",
    priceRange: "\u20B9\u20B9",
    distance: "1.2 km",
    isOpen: true,
    menu: [
      { id: "item_001", name: "Butter Chicken", price: 320, category: "Main Course", veg: false, popular: true },
      { id: "item_002", name: "Paneer Tikka Masala", price: 280, category: "Main Course", veg: true, popular: true },
      { id: "item_003", name: "Garlic Naan", price: 60, category: "Bread", veg: true, popular: true },
      { id: "item_004", name: "Dal Makhani", price: 220, category: "Main Course", veg: true, popular: false },
      { id: "item_005", name: "Chicken Biryani", price: 350, category: "Rice", veg: false, popular: true }
    ]
  },
  {
    id: "rest_002",
    name: "Pizza Paradise",
    cuisine: "Italian",
    rating: 4.3,
    deliveryTime: "25-35 min",
    priceRange: "\u20B9\u20B9\u20B9",
    distance: "2.5 km",
    isOpen: true,
    menu: [
      { id: "item_010", name: "Margherita Pizza", price: 299, category: "Pizza", veg: true, popular: true },
      { id: "item_011", name: "Pepperoni Pizza", price: 449, category: "Pizza", veg: false, popular: true },
      { id: "item_013", name: "Pasta Alfredo", price: 329, category: "Pasta", veg: true, popular: true }
    ]
  }
];
function foodHandler(tool, params) {
  switch (tool) {
    case "search_restaurants": {
      let results = [...restaurants].filter((r) => r.isOpen);
      if (params.cuisine) results = results.filter((r) => r.cuisine.toLowerCase().includes(params.cuisine.toLowerCase()));
      if (params.query) {
        const q = params.query.toLowerCase();
        results = results.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q));
      }
      return { success: true, count: results.length, restaurants: results.map(({ menu, ...r }) => ({ ...r, popularItems: menu.filter((i) => i.popular).map((i) => i.name).slice(0, 3) })) };
    }
    case "get_menu": {
      const rest = restaurants.find((r) => r.id === params.restaurantId);
      if (!rest) return { success: false, error: "Restaurant not found" };
      const grouped = {};
      rest.menu.forEach((item) => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
      });
      return { success: true, restaurant: rest.name, cuisine: rest.cuisine, menuByCategory: grouped };
    }
    case "place_order": {
      const rest = restaurants.find((r) => r.id === params.restaurantId);
      if (!rest) return { success: false, error: "Restaurant not found" };
      const items = (params.items || []).map((oi) => {
        const mi = rest.menu.find((m) => m.id === oi.itemId || m.name.toLowerCase() === oi.name?.toLowerCase());
        return mi ? { ...mi, quantity: oi.quantity || 1, subtotal: mi.price * (oi.quantity || 1) } : null;
      }).filter(Boolean);
      if (!items.length) return { success: false, error: "No valid items" };
      const orderId = `ORD_${uuid()}`;
      const total = items.reduce((s, i) => s + i.subtotal, 0);
      return { success: true, order: { orderId, restaurant: rest.name, items: items.map((i) => `${i.quantity}x ${i.name}`), grandTotal: `\u20B9${total + 40 + Math.round(total * 0.05)}`, estimatedDelivery: rest.deliveryTime } };
    }
    case "get_recommendations": {
      const moodMap = { "hungry": ["Butter Chicken", "Margherita Pizza"], "craving": ["Pepperoni Pizza"] };
      const key = Object.keys(moodMap).find((k) => (params.mood || "").toLowerCase().includes(k)) || "hungry";
      const recommended = [];
      restaurants.forEach((r) => r.menu.forEach((item) => {
        if (moodMap[key]?.includes(item.name)) recommended.push({ restaurant: r.name, item: item.name, price: `\u20B9${item.price}`, deliveryTime: r.deliveryTime, rating: r.rating });
      }));
      return { success: true, mood: params.mood || "hungry", recommendations: recommended };
    }
    default:
      return { success: false, error: `Unknown food tool: ${tool}` };
  }
}
var rideTypes = [
  { id: "mini", name: "Ola Mini", icon: "\u{1F697}", basePrice: 50, perKmRate: 10, perMinRate: 1.5, capacity: 4, eta: "3-5 min" },
  { id: "sedan", name: "Ola Sedan", icon: "\u{1F699}", basePrice: 80, perKmRate: 14, perMinRate: 2, capacity: 4, eta: "5-7 min" },
  { id: "auto", name: "Ola Auto", icon: "\u{1F6FA}", basePrice: 30, perKmRate: 8, perMinRate: 1, capacity: 3, eta: "2-4 min" }
];
var drivers = [{ id: "drv_001", name: "Rajesh", rating: 4.8, vehicle: "Swift (DL01)", photo: "\u{1F468}\u200D\u2708\uFE0F" }];
function ridesHandler(tool, params) {
  const calcDist = () => 10 + Math.random() * 5;
  const calcFare = (dist, typeId) => {
    const t = rideTypes.find((r) => r.id === typeId) || rideTypes[0];
    const mins = dist / 25 * 60;
    return { finalFare: Math.round(t.basePrice + dist * t.perKmRate + mins * t.perMinRate), estimatedTime: `${Math.round(mins)} min`, distance: `${dist.toFixed(1)} km` };
  };
  switch (tool) {
    case "estimate_ride": {
      const dist = calcDist();
      const estimates = rideTypes.map((t) => {
        const f = calcFare(dist, t.id);
        return { rideType: t.name, icon: t.icon, fare: `\u20B9${f.finalFare}`, eta: t.eta, distance: f.distance };
      });
      return { success: true, pickup: params.pickup, destination: params.destination, estimates };
    }
    case "book_ride": {
      const type = rideTypes.find((r) => r.name.toLowerCase().includes((params.rideType || "mini").toLowerCase())) || rideTypes[0];
      const driver = drivers[0];
      const dist = calcDist();
      const fare = calcFare(dist, type.id);
      const rideId = `RIDE_${uuid()}`;
      return {
        success: true,
        message: `\u{1F695} Ride booked! ${driver.name} is heading to your pickup.`,
        ride: { rideId, driver: driver.name, vehicle: driver.vehicle, otp: 1234, rideType: type.name, fare: `\u20B9${fare.finalFare}`, eta: type.eta, pickup: params.pickup, destination: params.destination }
      };
    }
    case "get_ride_types":
      return { success: true, rideTypes };
    default:
      return { success: false, error: `Unknown rides tool: ${tool}` };
  }
}
var mockWorkers = [
  { id: "wrk_001", name: "Ramesh Kumar", skills: ["electrician", "wiring"], rating: 4.7, experience: "5 years", hourlyRate: 350, verified: true, availability: true, photo: "\u26A1" },
  { id: "wrk_002", name: "Suresh Plumber", skills: ["plumber", "pipe fitting"], rating: 4.5, experience: "8 years", hourlyRate: 400, verified: true, availability: true, photo: "\u{1F527}" },
  { id: "wrk_003", name: "Arjun Carpenter", skills: ["carpenter", "furniture"], rating: 4.8, experience: "10 years", hourlyRate: 500, verified: true, availability: true, photo: "\u{1FA9A}" },
  { id: "wrk_004", name: "Priya Cleaner", skills: ["cleaner", "deep cleaning"], rating: 4.6, experience: "3 years", hourlyRate: 250, verified: false, availability: true, photo: "\u{1F9F9}" },
  { id: "wrk_005", name: "Vikram Driver", skills: ["driver", "delivery"], rating: 4.9, experience: "6 years", hourlyRate: 300, verified: true, availability: true, photo: "\u{1F697}" }
];
function workersHandler(tool, params) {
  switch (tool) {
    case "search_workers": {
      let workers = [...mockWorkers].filter((w) => w.availability);
      if (params.skill) workers = workers.filter((w) => w.skills.some((s) => s.toLowerCase().includes(params.skill.toLowerCase())));
      if (params.query) {
        const q = params.query.toLowerCase();
        workers = workers.filter((w) => w.name.toLowerCase().includes(q) || w.skills.some((s) => s.toLowerCase().includes(q)));
      }
      return { success: true, count: workers.length, workers: workers.map((w) => ({ id: w.id, name: w.name, skill: w.skills[0], photo: w.photo, rating: `\u2B50 ${w.rating}`, experience: w.experience, hourlyRate: `\u20B9${w.hourlyRate}/hr`, verified: w.verified ? "\u2705 Verified" : "Unverified" })) };
    }
    case "book_worker": {
      const worker = mockWorkers.find((w) => w.id === params.workerId);
      if (!worker) return { success: false, error: "Worker not found" };
      const bookingId = `BKG_${uuid()}`;
      return { success: true, message: `\u{1F4CB} Booking sent to ${worker.name}!`, booking: { bookingId, worker: worker.name, skill: worker.skills[0], rate: `\u20B9${worker.hourlyRate}/hr`, status: "pending" } };
    }
    case "get_skills_list": {
      const skillsMap = {};
      mockWorkers.forEach((w) => w.skills.forEach((s) => {
        skillsMap[s] = (skillsMap[s] || 0) + (w.availability ? 1 : 0);
      }));
      return { success: true, skills: Object.entries(skillsMap).map(([skill, count]) => ({ skill, availableWorkers: count })) };
    }
    default:
      return { success: false, error: `Unknown workers tool: ${tool}` };
  }
}
async function searchDuckDuckGo(query, limit = 5) {
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) throw new Error(`DuckDuckGo returned status ${response.status}`);
    const html = await response.text();
    const results = [];
    const resultBlocks = html.split('<div class="result results_links');
    for (let i = 1; i < resultBlocks.length && results.length < limit; i++) {
      const block = resultBlocks[i];
      const titleMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/);
      if (titleMatch) {
        let url = titleMatch[1];
        if (url.includes("uddg=")) {
          const uddgMatch = url.match(/uddg=([^&]*)/);
          if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
        }
        if (url.startsWith("//")) {
          url = "https:" + url;
        }
        const title = titleMatch[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";
        if (url.includes("ad_domain") || url.includes("bing.com/aclick")) {
          continue;
        }
        results.push({ title, url, description: snippet });
      }
    }
    return results;
  } catch (error) {
    console.error("DDG Search error:", error.message);
    return [];
  }
}
async function fetchUrlContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) throw new Error(`Fetch returned status ${response.status}`);
    const html = await response.text();
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "").replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, "").replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "").replace(/<\/p>|<\/div>|<br\s*\/?>|<\/li>|<\/h[1-6]>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&#x27;/g, "'").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
    return text.slice(0, 1e4);
  } catch (error) {
    return `Error fetching URL ${url}: ${error.message}`;
  }
}
var conversations = /* @__PURE__ */ new Map();
function buildSystemPrompt(isDesktopConnected = false) {
  const mcpToolsInfo = mcpManager.getToolsPrompt();
  const connectedServers = mcpManager.getServersStatus().filter((s) => s.status === "connected");
  const isLive = isDesktopConnected || connectedServers.length > 0;
  return `You are Aetherix, India's #1 AI-powered service marketplace assistant.
You are connected to LIVE services via MCP (Model Context Protocol) \u2014 just like Claude Desktop.

${mcpToolsInfo}

BUILT-IN SERVICES (always available):
- \u{1F354} Food: get_addresses, search_restaurants, get_menu, place_order, get_recommendations
- \u{1F695} Rides: estimate_ride, book_ride, get_ride_types
- \u{1F477} Workers: search_workers, book_worker, get_skills_list
- \u{1F310} Web: web_search, web_fetch

${isLive ? "\u2705 LIVE MODE: MCP servers connected \u2014 using LIVE data!" : "\u26A0\uFE0F No MCP servers connected yet \u2014 using built-in demo data. User can connect servers from the dashboard."}

CRITICAL RULES FOR WEB TOOLS:
- When user asks about current events, news, or general real-time information, call \`web_search\` first with a query parameter.
- When you get search results and need to read the full page details of a specific URL, call \`web_fetch\` with the url parameter.
- Always present the web search/fetch results beautifully, cite the sources, and summarize correctly.

CRITICAL RULES FOR FOOD (Swiggy MCP):
- Swiggy's "search_restaurants" requires an "addressId". You MUST call "get_addresses" FIRST to fetch the user's saved addresses and use that "addressId" when calling "search_restaurants".
- Do not ask the user for their address if you can just call "get_addresses" to get it automatically!

CRITICAL ORDER FLOW (NEVER skip steps):
Step 1 - DISCOVER: When user says they want food, FIRST search for options. Show them choices.
Step 2 - SELECT: Let user pick a restaurant/item. Show prices and details.
Step 3 - VERIFY: Before placing ANY order, ALWAYS show the final bill and ask "Shall I confirm this order?"
Step 4 - CONFIRM: Only place the order AFTER user explicitly says yes/confirm/haan/kar de.

LANGUAGE & STYLE RULES (VERY IMPORTANT):
- **Mirror the user's language exactly.** If they speak Hinglish, reply in Hinglish. If English, reply in English.
- **Default language is Hinglish** \u2014 casual, friendly, desi style. Example: "Bhai, tere liye best restaurants dhundh raha hoon! \u{1F355}"
- Use emojis naturally to keep it fun and engaging
- Be warm, friendly, and talk like a smart desi friend \u2014 not a corporate bot
- Use Indian Rupees (\u20B9) for all prices
- NEVER place an order without user's explicit confirmation

RESPONSE FORMAT (always return valid JSON):
{
  "reply": "Your conversational response in the user's language style",
  "intent": "food" | "instamart" | "dineout" | "rides" | "workers" | "web" | "general" | "clarify",
  "action": { "tool": "the MCP tool to call", "params": { "key": "value" } },
  "suggestions": ["suggestion 1", "suggestion 2"],
  "needsConfirmation": false
}

EXAMPLES:
User: "Restaurants dikhao" \u2192 intent: "food", action: { tool: "search_restaurants", params: {} }
User: "Paneer chilli order karna hai" \u2192 intent: "food", action: { tool: "search_restaurants", params: { query: "paneer chilli" } }
User: "Ride book karo airport" \u2192 intent: "rides", action: { tool: "estimate_ride", params: { pickup: "current location", destination: "airport" } }
User: "Plumber chahiye" \u2192 intent: "workers", action: { tool: "search_workers", params: { skill: "plumber" } }
User: "Google search NodeJS fetch" \u2192 intent: "web", action: { tool: "web_search", params: { query: "NodeJS fetch" } }
`;
}
async function callMistral(messages, isDesktopConnected = false) {
  const dynamicPrompt = `${buildSystemPrompt(isDesktopConnected)}

CURRENT DATE & TIME: ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
  const response = await fetch(CONFIG.MISTRAL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${CONFIG.MISTRAL_API_KEY}` },
    body: JSON.stringify({ model: CONFIG.MISTRAL_MODEL, messages: [{ role: "system", content: dynamicPrompt }, ...messages], temperature: 0.7, max_tokens: 1024, response_format: { type: "json_object" } })
  });
  if (!response.ok) throw new Error(`Mistral API error: ${response.status}`);
  const data = await response.json();
  try {
    return JSON.parse(data.choices[0]?.message?.content);
  } catch {
    return { reply: data.choices[0]?.message?.content, intent: "general", action: null, suggestions: [] };
  }
}
async function callOpenCode(messages, modelId, isDesktopConnected = false) {
  const dynamicPrompt = `${buildSystemPrompt(isDesktopConnected)}

CURRENT DATE & TIME: ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
  const apiKey = "aetherix-sk-master-9f3a7b2e1d";
  const PROXY_URL = CONFIG.OPENCODE_PROXY_URL;
  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "system", content: dynamicPrompt + "\n\nIMPORTANT: You MUST respond ONLY with a raw JSON object. No markdown, no code fences, no backticks. Just the JSON object starting with { and ending with }." }, ...messages]
    })
  });
  if (!response.ok) throw new Error(`OpenCode Proxy error: ${response.status}`);
  const data = await response.json();
  let raw = (data.choices?.[0]?.message?.content || "").trim();
  raw = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  try {
    const parsed = JSON.parse(raw);
    if (parsed.reply) return parsed;
    return { reply: JSON.stringify(parsed), intent: "general", action: null, suggestions: [] };
  } catch {
    return { reply: raw, intent: "general", action: null, suggestions: [] };
  }
}
async function callAI(messages, modelId, isDesktopConnected = false) {
  const model = AI_MODELS.find((m) => m.id === modelId);
  if (model && model.provider === "opencode") {
    console.log(`[AI] Using OpenCode model: ${modelId}`);
    return callOpenCode(messages, modelId, isDesktopConnected);
  }
  console.log(`[AI] Using Mistral`);
  return callMistral(messages, isDesktopConnected);
}
function getFallbackResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes("food") || msg.includes("hungry") || msg.includes("bhook") || msg.includes("khana")) return { reply: "Bhai bhook lagi hai? \u{1F355} Bata kya khayega, abhi best restaurants dhundh ke deta hoon!", intent: "food", action: { tool: "search_restaurants", params: {} }, suggestions: ["Nearby restaurants dikhao", "Pizza manga do"] };
  if (msg.includes("ride") || msg.includes("cab") || msg.includes("gaadi") || msg.includes("auto")) return { reply: "Chal bhai, ride book karte hain! \u{1F695} Kahan jaana hai bata?", intent: "rides", action: { tool: "get_ride_types", params: {} }, suggestions: ["Airport jaana hai", "Auto book karo"] };
  if (msg.includes("plumber") || msg.includes("worker") || msg.includes("electrician") || msg.includes("kaam")) return { reply: "Sahi hai bhai! \u{1F527} Kaunsa kaam karwana hai? Plumber, electrician, carpenter \u2014 sab milega!", intent: "workers", action: { tool: "get_skills_list", params: {} }, suggestions: ["Plumber chahiye", "Electrician dhundho"] };
  return { reply: "Hey bhai! Main hoon Aetherix \u{1F31F} Tera apna AI assistant! Food order, ride book, worker hire \u2014 sab kuch bol de!", intent: "general", suggestions: ["Bhook lagi hai", "Ride book karo", "Worker chahiye"] };
}
async function startServer() {
  const app = express();
  const server = createServer(app);
  const staticPath = path.resolve(__dirname, "public");
  app.use(express.static(staticPath));
  app.use(express.json({ limit: "10mb", strict: false }));
  app.use((err, _req, res, next) => {
    if (err.type === "entity.parse.failed") {
      console.error("[Body Parse Error]", err.message);
      return res.status(400).json({ error: "Invalid JSON body", details: err.message });
    }
    next(err);
  });
  app.get("/api/models", (_req, res) => {
    res.json({ models: AI_MODELS });
  });
  app.post("/api/chat", async (req, res) => {
    const { message, sessionId: reqSessionId, modelId, image } = req.body;
    if (!message && !image) return res.status(400).json({ error: "Message is required" });
    const selectedModel = modelId || "opencode/big-pickle";
    const sessionId = reqSessionId || crypto.randomUUID();
    if (!conversations.has(sessionId)) conversations.set(sessionId, []);
    const history = conversations.get(sessionId);
    history.push({ role: "user", content: message || "[Image sent]" });
    if (image) {
      try {
        console.log(`
[Chat] Vision request: "${message}" | Image attached`);
        const visionRes = await fetch(CONFIG.OPENCODE_PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer aetherix-sk-master-9f3a7b2e1d" },
          body: JSON.stringify({
            model: "opencode/big-pickle",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: message || "Describe this image in detail" },
                { type: "image_url", image_url: { url: image } }
              ]
            }]
          })
        });
        const vData = await visionRes.json();
        const reply = vData.choices?.[0]?.message?.content || "Could not analyze the image.";
        history.push({ role: "assistant", content: reply });
        return res.json({ sessionId, reply, intent: "vision", model: "opencode/big-pickle", suggestions: [], timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      } catch (err) {
        console.error("[Chat] Vision error:", err.message);
        return res.json({ sessionId, reply: "Sorry, vision is temporarily unavailable.", intent: "error", suggestions: [], timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      }
    }
    const recentMessages = history.slice(-20);
    try {
      if (req.body.isFollowUp && req.body.mcpResult) {
        console.log(`
[Chat] Follow-up with local MCP Result.`);
        const followUp = [...recentMessages, { role: "user", content: `Here are the REAL local tool results: ${JSON.stringify(req.body.mcpResult).slice(0, 2e3)}. Give a friendly formatted reply to the user based on this data.` }];
        const enriched = await callAI(followUp, selectedModel, req.body.useLocalMcp);
        history.push({ role: "assistant", content: enriched.reply || "Done." });
        return res.json({ sessionId, reply: enriched.reply || "Done.", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      }
      console.log(`
[Chat] User: "${message}" | Model: ${selectedModel} | LocalMCP: ${req.body.useLocalMcp}`);
      const aiResponse = await callAI(recentMessages, selectedModel, req.body.useLocalMcp);
      console.log(`[Chat] Intent: ${aiResponse.intent}, Tool: ${aiResponse.action?.tool || "none"}`);
      let mcpResult = null;
      let finalReply = aiResponse.reply;
      if (aiResponse.action?.tool && aiResponse.intent !== "general" && aiResponse.intent !== "clarify") {
        try {
          if (req.body.useLocalMcp) {
            mcpResult = { action: aiResponse.action, pendingLocalExecution: true };
            finalReply = aiResponse.reply || "Fetching data from your Swiggy app...";
          } else {
            const chatUserId = req.body.userId || "web_user";
            mcpResult = await callMCP(aiResponse.intent, aiResponse.action.tool, aiResponse.action.params || {}, chatUserId);
            console.log(`[Chat] MCP Result:`, JSON.stringify(mcpResult).slice(0, 200));
            if (mcpResult.needsAuth) {
              finalReply = "\u{1F517} Swiggy session expired. Please reconnect your Swiggy account to place live orders.";
            } else {
              const followUp = [...recentMessages, { role: "assistant", content: JSON.stringify(aiResponse) }, { role: "user", content: `Results: ${JSON.stringify(mcpResult)}. Friendly reply:` }];
              const enriched = await callAI(followUp, selectedModel, req.body.useLocalMcp);
              finalReply = enriched.reply || finalReply;
            }
          }
        } catch (e) {
          console.error("[Chat] MCP call failed:", e.message);
          finalReply += `

_(Note: ${aiResponse.intent} service unavailable right now.)_`;
        }
      }
      if (!req.body.useLocalMcp || !aiResponse.action?.tool) {
        history.push({ role: "assistant", content: finalReply });
      }
      res.json({ sessionId, reply: finalReply, intent: aiResponse.intent, model: selectedModel, mcpData: mcpResult, suggestions: aiResponse.suggestions || [], timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (error) {
      console.error("[Chat] Error:", error.message);
      const fallback = getFallbackResponse(message);
      history.push({ role: "assistant", content: fallback.reply });
      res.json({ sessionId, ...fallback, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
  });
  app.post("/api/worker/register", (req, res) => {
    const { name, skills, experience, hourlyRate, phone, location } = req.body;
    if (!name || !skills || skills.length === 0) return res.status(400).json({ error: "Name and skills required" });
    const workerId = `wrk_custom_${uuid()}`;
    const newWorker = { id: workerId, name, skills, experience: experience || "Not specified", hourlyRate: hourlyRate || 0, phone: phone || "", location: location || "Not specified", rating: 0, verified: false, availability: true, photo: "\u{1F477}" };
    mockWorkers.push(newWorker);
    res.json({ success: true, message: `Welcome to Aetherix, ${name}!`, worker: newWorker });
  });
  app.get("/api/mcp/servers", (_req, res) => {
    res.json({ servers: mcpManager.getServersStatus() });
  });
  app.post("/api/mcp/connect", async (req, res) => {
    const { serverId, authToken } = req.body;
    if (!serverId) return res.status(400).json({ error: "serverId required" });
    console.log(`[API] Connecting MCP server: ${serverId}`);
    const result = await mcpManager.connectServer(serverId, authToken);
    res.json(result);
  });
  app.post("/api/mcp/disconnect", async (req, res) => {
    const { serverId } = req.body;
    if (!serverId) return res.status(400).json({ error: "serverId required" });
    await mcpManager.disconnectServer(serverId);
    res.json({ success: true, message: `Disconnected from ${serverId}` });
  });
  app.get("/api/mcp/auth/start", (req, res) => {
    const serverId = req.query.serverId;
    if (!serverId) return res.status(400).json({ error: "serverId required" });
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const callbackUrl = `${protocol}://${host}/api/mcp/auth/callback`;
    console.log(`[OAuth] Callback URL: ${callbackUrl}`);
    const result = mcpManager.startOAuth(serverId, callbackUrl);
    if (!result) return res.status(400).json({ error: "Server does not support OAuth" });
    res.json({ authUrl: result.authUrl, state: result.state });
  });
  app.get("/api/mcp/auth/callback", async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
      console.error(`[OAuth] Callback error: ${error}`);
      return res.send(`<html><body><script>window.opener.postMessage({type:'mcp-auth-error',error:'${error}'},'*');window.close();</script><h2>Auth Failed</h2><p>${error}</p></body></html>`);
    }
    if (!code || !state) {
      return res.status(400).send(`<html><body><h2>Missing code or state</h2></body></html>`);
    }
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const callbackUrl = `${protocol}://${host}/api/mcp/auth/callback`;
    const result = await mcpManager.exchangeToken(state, code, callbackUrl);
    if (result.success) {
      res.send(`
        <html><body style="background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
          <div style="text-align:center">
            <div style="font-size:48px;margin-bottom:16px">\u2705</div>
            <h2 style="color:#4ade80">Connected!</h2>
            <p style="color:#999">Swiggy MCP server linked. This window will close.</p>
          </div>
          <script>
            window.opener.postMessage({ type: 'mcp-auth-success', serverId: '${result.serverId}' }, '*');
            setTimeout(() => window.close(), 1500);
          </script>
        </body></html>
      `);
    } else {
      res.send(`
        <html><body style="background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
          <div style="text-align:center">
            <div style="font-size:48px;margin-bottom:16px">\u274C</div>
            <h2 style="color:#f87171">Connection Failed</h2>
            <p style="color:#999">${result.error}</p>
          </div>
          <script>
            window.opener.postMessage({ type: 'mcp-auth-error', serverId: '${result.serverId}', error: '${(result.error || "").replace(/'/g, "")}' }, '*');
          </script>
        </body></html>
      `);
    }
  });
  app.post("/api/mcp/add-server", (req, res) => {
    const { id, name, url, icon, description } = req.body;
    if (!id || !name || !url) return res.status(400).json({ error: "id, name, and url required" });
    mcpManager.addServer(id, name, url, icon || "\u{1F50C}", description || "Custom MCP server");
    res.json({ success: true, message: `Server "${name}" added! Now connect it.` });
  });
  app.post("/api/mcp/remove-server", (req, res) => {
    const { serverId } = req.body;
    if (!serverId) return res.status(400).json({ error: "serverId required" });
    mcpManager.removeServer(serverId);
    res.json({ success: true, message: `Server ${serverId} removed` });
  });
  app.post("/api/mcp/call-tool", async (req, res) => {
    const { toolName, args } = req.body;
    if (!toolName) return res.status(400).json({ error: "toolName required" });
    const result = await mcpManager.callToolByName(toolName, args || {});
    res.json(result);
  });
  app.get("/api/mcp/tools", (_req, res) => {
    const tools = mcpManager.getAllTools();
    res.json({ count: tools.length, tools });
  });
  app.get("/api/health", (_req, res) => {
    const servers = mcpManager.getServersStatus();
    const connected = servers.filter((s) => s.status === "connected");
    res.json({
      status: "healthy",
      aiModels: AI_MODELS.length,
      mcpServers: { total: servers.length, connected: connected.length, servers },
      totalMCPTools: mcpManager.getAllTools().length,
      builtInServices: { restaurants: restaurants.length, rideTypes: rideTypes.length, workers: mockWorkers.length },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  const port = process.env.PORT || 3e3;
  server.listen(port, () => {
    console.log(`
${"\u2550".repeat(56)}`);
    console.log(`  \u{1F31F} AETHERIX V2 \u2014 AI + MCP Orchestrator`);
    console.log(`${"\u2550".repeat(56)}`);
    console.log(`  \u{1F4E1} Server:       http://localhost:${port}`);
    console.log(`  \u{1F916} Models:       ${AI_MODELS.length} (Mistral + OpenCode)`);
    console.log(`  \u{1F50C} MCP Servers:  ${mcpManager.getServersStatus().length} registered`);
    console.log(`  \u{1F355} Demo Food:    ${restaurants.length} restaurants`);
    console.log(`  \u{1F697} Rides MCP:    ${rideTypes.length} ride types`);
    console.log(`  \u{1F477} Workers MCP:  ${mockWorkers.length} workers`);
    console.log(`  \u{1F517} Proxy:        http://127.0.0.1:4000 (OpenCode)`);
    console.log(`${"\u2500".repeat(56)}`);
  });
}
startServer().catch(console.error);
