import fs from "fs";
import http, { IncomingMessage, ServerResponse } from "http";
import path from "path";
import { AddressInfo } from "net";
import type { PluginOption } from "vite";
import { Server as SocketIOServer } from "socket.io";
import type {
  CSGORaw,
  PhaseRaw,
  PlayerRaw,
  RoundOutcome,
  RoundRaw,
  Side,
} from "csgogsi";

type MockPlayer = {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  country: string;
  steamid: string;
  team: string;
  extra: Record<string, string>;
};

type MockTeam = {
  _id: string;
  name: string;
  country: string;
  shortName: string;
  logo: string;
  extra: Record<string, string>;
};

type MockRoute = {
  pathname: string;
  searchParams: URLSearchParams;
};

const MOCK_PORT = Number(process.env.MOCK_PORT || 1349);
const tournamentLogoPath = path.join(
  process.cwd(),
  "public",
  "sj-prime-league-season-2-logo.png",
);
const provider = {
  name: "Counter-Strike: Global Offensive" as const,
  appid: 730 as const,
  version: 14000,
  steamid: "76561199000000000",
};

const teams: MockTeam[] = [
  {
    _id: "team-macolts",
    name: "Bar do Macolts",
    country: "BR",
    shortName: "BM",
    logo: "aurora-byte",
    extra: {},
  },
  {
    _id: "team-xgg",
    name: "Bar do Macolts",
    country: "BR",
    shortName: "Bar do Macolts",
    logo: "nova-circuit",
    extra: {},
  },
];

const ctSteamIds = [
  "76561199000001001",
  "76561199000001002",
  "76561199000001003",
  "76561199000001004",
  "76561199000001005",
];
const tSteamIds = [
  "76561199000002001",
  "76561199000002002",
  "76561199000002003",
  "76561199000002004",
  "76561199000002005",
];

const players: MockPlayer[] = [
  ["Lia", "Costa", "lumen", "BR", ctSteamIds[0]],
  ["Mateo", "Silva", "rivet", "BR", ctSteamIds[1]],
  ["Noah", "Pereira", "vector", "PT", ctSteamIds[2]],
  ["Iris", "Mendes", "cipher", "BR", ctSteamIds[3]],
  ["Theo", "Almeida", "anchor", "BR", ctSteamIds[4]],
  ["Ava", "Brooks", "pulse", "US", tSteamIds[0]],
  ["Mason", "Reed", "glitch", "CA", tSteamIds[1]],
  ["Mia", "Hayes", "ember", "US", tSteamIds[2]],
  ["Ethan", "Cole", "orbit", "GB", tSteamIds[3]],
  ["Zoe", "King", "spectra", "US", tSteamIds[4]],
].map(([firstName, lastName, username, country, steamid], index) => ({
  _id: `player-${index + 1}`,
  firstName,
  lastName,
  username,
  avatar: "",
  country,
  steamid,
  team: index < 5 ? teams[0]._id : teams[1]._id,
  extra: {},
}));

const gameMaps = [
  ["de_dust2", "dust2", -2476, 3239, 4.4],
  ["de_inferno", "inferno", -2087, 3870, 4.9],
  ["de_mirage", "mirage", -3230, 1713, 5],
  ["de_nuke", "nuke", -3453, 2887, 7],
  ["de_ancient", "ancient", -2953, 2164, 5],
].map(([name, lhmId, originX, originY, scale], index) => ({
  _id: `map-${lhmId}`,
  name,
  lhmId,
  game: "cs2",
  image: "",
  radars: [
    {
      id: index + 1,
      lhmId,
      originX,
      originY,
      pxPerUX: scale,
      pxPerUY: -Number(scale),
      radar: `${lhmId}-radar`,
      visibleOverHeight: null,
      visibleUnderHeight: null,
    },
  ],
  verticalImage: "",
  inVetoPool: true,
  isActive: true,
}));

const match = {
  id: "mock-match-1",
  current: true,
  left: { id: teams[0]._id, wins: 0 },
  right: { id: teams[1]._id, wins: 0 },
  matchType: "bo3" as const,
  vetos: [
    {
      teamId: teams[0]._id,
      mapName: "de_mirage",
      side: "CT" as const,
      type: "pick" as const,
      rounds: [],
      mapEnd: false,
    },
    {
      teamId: teams[1]._id,
      mapName: "de_inferno",
      side: "T" as const,
      type: "pick" as const,
      rounds: [],
      mapEnd: false,
    },
    {
      teamId: "",
      mapName: "de_dust2",
      side: "NO" as const,
      type: "decider" as const,
      rounds: [],
      mapEnd: false,
    },
  ],
};

const tournament = {
  tournament: {
    _id: "mock-tournament",
    name: "SJ PRIME LEAGUE SEASON 2",
    phase: "Group stage",
    logo: `http://localhost:${MOCK_PORT}/api/tournament/logo`,
    groups: [],
    playoffs: {
      type: "single",
      teams: 2,
      phases: 1,
      participants: teams.map((team) => team._id),
      matchups: [],
    },
    autoCreate: false,
  },
};

const hudConfig = {
  trivia: {
    title: "Offline demo",
    content: "Mock CS2 GSI feed running locally",
  },
  display_settings: {
    left_title: "Bar do Macolts",
    left_subtitle: "CT side",
    right_title: "Nova Circuit",
    right_subtitle: "T side",
    replace_avatars: "if_missing",
  },
  preview_settings: {
    match_preview: { type: "match", id: match.id, match },
    player_preview: {
      type: "player",
      id: players[0].steamid,
      player: players[0],
    },
    player_preview_toggle: true,
    match_preview_toggle: true,
    select_preview: "show",
  },
};

const json = (response: ServerResponse, data: unknown, status = 200) => {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(data));
};

const emptyPng = (response: ServerResponse) => {
  const imagePath = fs.existsSync(
    path.join(process.cwd(), "public", "thumb.png"),
  )
    ? path.join(process.cwd(), "public", "thumb.png")
    : path.join(process.cwd(), "icon.png");

  response.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "image/png",
  });
  fs.createReadStream(imagePath).pipe(response);
};

const tournamentLogo = (response: ServerResponse) => {
  const imagePath = fs.existsSync(tournamentLogoPath)
    ? tournamentLogoPath
    : path.join(process.cwd(), "icon.png");

  response.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "image/png",
  });
  fs.createReadStream(imagePath).pipe(response);
};

const getRoute = (request: IncomingMessage): MockRoute => {
  const url = new URL(
    request.url || "/",
    `http://${request.headers.host || `localhost:${MOCK_PORT}`}`,
  );
  return {
    pathname: url.pathname.replace(/\/+$/, ""),
    searchParams: url.searchParams,
  };
};

const getPlayers = (steamids: string | null) => {
  if (!steamids) return players;
  const requested = steamids.split(";");
  return players.filter((player) => requested.includes(player.steamid));
};

const routeRest = (request: IncomingMessage, response: ServerResponse) => {
  if (request.method === "OPTIONS") return json(response, true);

  const { pathname, searchParams } = getRoute(request);

  if (pathname === "/development") {
    response.writeHead(302, {
      Location: `http://localhost:3500/dev/?port=${MOCK_PORT}`,
      "Access-Control-Allow-Origin": "*",
    });
    response.end();
    return;
  }
  if (pathname === "/api/game-maps/cs2") return json(response, gameMaps);
  if (pathname.startsWith("/api/game-maps/cs2/image/"))
    return emptyPng(response);
  if (pathname === "/api/players")
    return json(response, getPlayers(searchParams.get("steamids")));
  if (pathname.startsWith("/api/players/avatar/steamid/"))
    return json(response, { custom: "", steam: "" });
  if (pathname === "/api/match") return json(response, [match]);
  if (pathname === "/api/match/current") return json(response, match);
  if (pathname === "/api/teams") return json(response, teams);
  if (pathname.startsWith("/api/teams/logo/")) return emptyPng(response);
  if (pathname.startsWith("/api/teams/")) {
    const id = decodeURIComponent(pathname.split("/").pop() || "");
    return json(
      response,
      teams.find((team) => team._id === id) || null,
      teams.some((team) => team._id === id) ? 200 : 404,
    );
  }
  if (pathname === "/api/tournament") return json(response, tournament);
  if (pathname === "/api/tournament/logo") return tournamentLogo(response);
  if (pathname === "/api/camera") {
    return json(response, {
      uuid: "mock-camera-room",
      availablePlayers: players.map((player) => ({
        steamid: player.steamid,
        label: player.username,
      })),
    });
  }
  if (pathname.startsWith("/api/huds/")) return emptyPng(response);

  json(response, { error: `Mock endpoint not found: ${pathname}` }, 404);
};

const playerPosition = (side: Side, index: number, tick: number) => {
  const baseX = side === "CT" ? -1200 : 900;
  const baseY = side === "CT" ? 550 : -450;
  return `${baseX + index * 130 + tick * (side === "CT" ? 12 : -10)}, ${baseY - index * 90 + Math.sin(tick / 4 + index) * 80}, 0`;
};

const makeWeapon = (
  name: string,
  type: PlayerRaw["weapons"][string]["type"],
  state: "active" | "holstered" = "holstered",
) => ({
  name,
  paintkit: "default",
  type,
  ammo_clip:
    type === "Grenade" || type === "Knife" || type === "C4" ? undefined : 30,
  ammo_clip_max:
    type === "Grenade" || type === "Knife" || type === "C4" ? undefined : 30,
  ammo_reserve:
    type === "Grenade" || type === "Knife" || type === "C4" ? undefined : 90,
  state,
});

const makeRawPlayer = (
  player: MockPlayer,
  side: Side,
  index: number,
  tick: number,
  phase: PhaseRaw["phase"],
  deaths: Set<string>,
): PlayerRaw => {
  const isDead = deaths.has(player.steamid);
  const isT = side === "T";
  const moneyBase = phase === "freezetime" ? 7400 : 4200;

  return {
    steamid: player.steamid,
    name: player.username,
    clan:
      player.team === teams[0]._id ? teams[0].shortName : teams[1].shortName,
    observer_slot: index + 1,
    team: side,
    match_stats: {
      kills: Math.floor((tick + index) / 9),
      assists: index % 3,
      deaths: isDead
        ? Math.max(1, Math.floor(tick / 18))
        : Math.floor(tick / 28),
      mvps: Math.floor((tick + index) / 30),
      score: Math.floor((tick + index) / 9) * 2,
    },
    weapons: {
      weapon_0: makeWeapon("weapon_knife", "Knife"),
      weapon_1: makeWeapon(
        isT ? "weapon_glock" : "weapon_usp_silencer",
        "Pistol",
      ),
      weapon_2: makeWeapon(
        isT ? "weapon_ak47" : "weapon_m4a1_silencer",
        "Rifle",
        "active",
      ),
      weapon_3: makeWeapon(
        isT ? "weapon_molotov" : "weapon_incgrenade",
        "Grenade",
      ),
      weapon_4: makeWeapon("weapon_flashbang", "Grenade"),
      ...(isT && index === 0
        ? { weapon_c4: makeWeapon("weapon_c4", "C4") }
        : {}),
    },
    state: {
      health: isDead ? 0 : Math.max(35, 100 - ((tick + index * 11) % 35)),
      armor: isDead ? 0 : 100,
      helmet: true,
      defusekit: !isT && index < 3,
      flashed: phase === "live" && index === tick % 5 ? 70 : 0,
      smoked: 0,
      burning: 0,
      money: Math.max(0, moneyBase - index * 450 - (tick % 8) * 150),
      round_kills: Math.floor((tick + index) / 15) % 3,
      round_killhs: Math.floor((tick + index) / 21) % 2,
      round_totaldmg: ((tick + index) % 8) * 26,
      equip_value: isDead ? 0 : 4700 - index * 120,
    },
    position: playerPosition(side, index, tick),
    forward: "1, 0, 0",
  };
};

const scoreFor = (tick: number) => ({
  ct: Math.min(12, 4 + Math.floor(tick / 48)),
  t: Math.min(12, 3 + Math.floor((tick + 24) / 60)),
});

const roundOutcome = (round: number): RoundOutcome =>
  round % 3 === 0
    ? "t_win_bomb"
    : round % 2 === 0
      ? "ct_win_defuse"
      : "ct_win_elimination";

const getPhase = (
  step: number,
): {
  phase: PhaseRaw["phase"];
  round: RoundRaw;
  bombState?: CSGORaw["bomb"];
  endsIn: number;
} => {
  if (step < 6)
    return {
      phase: "freezetime",
      round: { phase: "freezetime" },
      endsIn: 6 - step,
    };
  if (step < 20)
    return { phase: "live", round: { phase: "live" }, endsIn: 115 - step * 3 };
  if (step < 27) {
    return {
      phase: "bomb",
      round: { phase: "live", bomb: "planted" },
      bombState: {
        state: "planted",
        countdown: `${Math.max(0, 40 - (step - 20) * 4)}`,
        position: "250, -300, 0",
        player: tSteamIds[0],
      },
      endsIn: Math.max(0, 40 - (step - 20) * 4),
    };
  }
  if (step < 31) {
    return {
      phase: "defuse",
      round: { phase: "live", bomb: "planted" },
      bombState: {
        state: "defusing",
        countdown: `${Math.max(0, 8 - (step - 27) * 2)}`,
        position: "250, -300, 0",
        player: ctSteamIds[1],
      },
      endsIn: Math.max(0, 8 - (step - 27) * 2),
    };
  }
  if (step < 36) {
    return {
      phase: "over",
      round: { phase: "over", bomb: "defused", win_team: "CT" },
      bombState: {
        state: "defused",
        position: "250, -300, 0",
        player: ctSteamIds[1],
      },
      endsIn: 5,
    };
  }
  if (step < 42)
    return {
      phase: "timeout_t",
      round: { phase: "freezetime" },
      endsIn: 30 - (step - 36) * 5,
    };
  return { phase: "live", round: { phase: "live" }, endsIn: 90 };
};

const makeRawState = (tick: number): CSGORaw => {
  const roundNumber = Math.floor(tick / 48);
  const step = tick % 48;
  const { phase, round, bombState, endsIn } = getPhase(step);
  const score = scoreFor(tick);
  const deaths = new Set<string>();

  if (
    phase === "live" ||
    phase === "bomb" ||
    phase === "defuse" ||
    phase === "over"
  ) {
    if (step > 10) deaths.add(tSteamIds[(roundNumber + 2) % 5]);
    if (step > 15) deaths.add(ctSteamIds[(roundNumber + 1) % 5]);
    if (step > 23) deaths.add(tSteamIds[(roundNumber + 4) % 5]);
    if (step > 29) deaths.add(tSteamIds[(roundNumber + 3) % 5]);
  }

  const allplayers: Record<string, PlayerRaw> = {};

  players.forEach((player, index) => {
    const side: Side = index < 5 ? "CT" : "T";
    const sideIndex = index % 5;
    allplayers[player.steamid] = makeRawPlayer(
      player,
      side,
      sideIndex,
      tick,
      phase,
      deaths,
    );
  });

  const roundWins = Array.from({ length: Math.max(0, roundNumber) }).reduce<
    Record<string, RoundOutcome>
  >((acc, _, index) => {
    acc[String(index + 1)] = roundOutcome(index + 1);
    return acc;
  }, {});

  return {
    provider: { ...provider, timestamp: Date.now() },
    map: {
      mode: "competitive",
      name: "de_mirage",
      phase: "live",
      round: roundNumber,
      team_ct: {
        score: score.ct,
        consecutive_round_losses: Math.max(0, 2 - (tick % 3)),
        timeouts_remaining: phase === "timeout_ct" ? 2 : 3,
        matches_won_this_series: 0,
        name: teams[0].name,
        flag: teams[0].country,
      },
      team_t: {
        score: score.t,
        consecutive_round_losses: tick % 3,
        timeouts_remaining: phase === "timeout_t" ? 2 : 3,
        matches_won_this_series: 0,
        name: teams[1].name,
        flag: teams[1].country,
      },
      num_matches_to_win_series: 2,
      current_spectators: 42,
      souvenirs_total: 0,
      round_wins: roundWins,
    },
    round,
    phase_countdowns: { phase, phase_ends_in: `${endsIn}` },
    player: {
      ...allplayers[ctSteamIds[tick % 5]],
      steamid: ctSteamIds[tick % 5],
      activity: "playing",
      spectarget: ctSteamIds[tick % 5],
    },
    allplayers,
    bomb: bombState || {
      state: "carried",
      position: playerPosition("T", 0, tick),
      player: tSteamIds[0],
    },
    grenades:
      step > 8 && step < 20
        ? {
            grenade_1: {
              owner: ctSteamIds[2],
              lifetime: `${(step - 8) / 2}`,
              type: "smoke",
              position: "-100, 200, 0",
              velocity: "0, 0, 0",
              effecttime: "6",
            },
            grenade_2: {
              owner: tSteamIds[3],
              lifetime: `${(step - 7) / 2}`,
              type: "flashbang",
              position: "400, -200, 0",
              velocity: "40, 20, 0",
            },
          }
        : {},
    auth: { token: "mock" },
  };
};

const makeDamage = (tick: number) => [
  {
    round: Math.floor(tick / 48),
    players: players.map((player, index) => ({
      steamid: player.steamid,
      damage: ((tick + index) % 9) * 24,
    })),
  },
];

export const mockModePlugin = (): PluginOption => {
  let mockServer: http.Server | null = null;
  let io: SocketIOServer | null = null;
  let interval: NodeJS.Timeout | null = null;
  let tick = 0;

  return {
    name: "cs2-offline-mock-server",
    apply: "serve",
    configureServer() {
      if (mockServer) return;

      mockServer = http.createServer(routeRest);
      io = new SocketIOServer(mockServer, {
        cors: { origin: "*" },
      });

      io.on("connection", (socket) => {
        socket.on("started", () => {
          socket.emit("readyToRegister");
        });
        socket.on("register", () => {
          socket.emit("hud_config", hudConfig);
          socket.emit("match");
          socket.emit(
            "playersCameraStatus",
            players.map((player) => ({
              steamid: player.steamid,
              label: player.username,
              allow: false,
              active: false,
            })),
          );
        });
        socket.on("registerAsHUD", () => {
          socket.emit(
            "playersCameraStatus",
            players.map((player) => ({
              steamid: player.steamid,
              label: player.username,
              allow: false,
              active: false,
            })),
          );
        });
      });

      interval = setInterval(() => {
        const state = makeRawState(tick);
        io?.emit("update", state, makeDamage(tick));

        const step = tick % 48;
        if (step === 0 || step === 36) io?.emit("match");
        if (step === 0)
          io?.emit("hud_action", { action: "boxesState", data: "show" });
        if (step === 18)
          io?.emit("hud_action", { action: "triviaState", data: "show" });
        if (step === 30)
          io?.emit("hud_action", { action: "triviaState", data: "hide" });
        if (step === 36)
          io?.emit("hud_action", { action: "boxesState", data: "hide" });
        tick += 1;
      }, 1000);

      mockServer.listen(MOCK_PORT, "localhost", () => {
        const address = mockServer?.address() as AddressInfo | null;
        console.log(
          `[mock] CS2 offline server running at http://localhost:${address?.port || MOCK_PORT}`,
        );
      });

      process.once("exit", () => {
        if (interval) clearInterval(interval);
        io?.close();
        mockServer?.close();
      });
    },
  };
};
