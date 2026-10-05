import { normalizeTeamName } from "@/lib/adapters/football.shared";

import { approvedEditorialPublisher, EDITORIAL_PUBLISHERS } from "./editorial-policy";
import { sportsDb } from "./sports-db.server";

const TIME_ZONE = "America/Sao_Paulo";
const SEASON = "2026/27";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ITEMS_PER_FEED = 60;
const MAX_OTHER_SPORT_ITEMS_PER_FEED = 25;

type Row = Record<string, unknown>;

type FeedSport = "FOOTBALL" | "TENNIS" | "MOTOR" | "BASKET" | "MULTISPORT";

type EditorialFeed = {
  key: string;
  sourceName: string;
  country: string;
  sport: FeedSport;
  url: string;
  transport: "DIRECT_RSS" | "GOOGLE_NEWS_RSS";
  priority: number;
};

type FeedItem = {
  guid: string;
  title: string;
  description: string | null;
  link: string;
  sourceName: string | null;
  publisherUrl: string | null;
  publishedAt: string;
};

type CanonicalFixture = {
  id: string;
  kickoffAt: string;
  home: string;
  away: string;
  competition: string;
  countryCode: string | null;
  region: string | null;
  competitionKind: string;
  divisionLevel: number | null;
  priority: number;
};

export type EditorialSourceSyncResult = {
  date: string;
  feedsAttempted: number;
  feedsSucceeded: number;
  feedsFailed: number;
  feedItemsRead: number;
  footballEvidence: number;
  otherSportsEvidence: number;
  unmatchedFootballItems: number;
  errors: Array<{ feed: string; error: string }>;
  fetchedAt: string;
};

const FOOTBALL_FEEDS: EditorialFeed[] = [
  {
    key: "ge-br-football",
    sourceName: "ge",
    country: "BR",
    sport: "FOOTBALL",
    url: "https://ge.globo.com/Esportes/Rss/0,,AS0-9825,00.xml",
    transport: "DIRECT_RSS",
    priority: 100,
  },
  {
    key: "sky-uk-football",
    sourceName: "Sky Sports",
    country: "GB-ENG",
    sport: "FOOTBALL",
    url: "https://www.skysports.com/rss/12040",
    transport: "DIRECT_RSS",
    priority: 100,
  },
  {
    key: "kicker-de-football",
    sourceName: "kicker",
    country: "DE",
    sport: "FOOTBALL",
    url: "https://newsfeed.kicker.de/news/fussball",
    transport: "DIRECT_RSS",
    priority: 100,
  },
  {
    key: "lequipe-fr-football",
    sourceName: "L'Équipe",
    country: "FR",
    sport: "FOOTBALL",
    url: "https://dwh.lequipe.fr/api/edito/rss?path=/Football/",
    transport: "DIRECT_RSS",
    priority: 100,
  },
  {
    key: "as-es-football",
    sourceName: "AS",
    country: "ES",
    sport: "FOOTBALL",
    url: "https://feeds.as.com/mrss-s/pages/as/site/as.com/section/futbol/portada/",
    transport: "DIRECT_RSS",
    priority: 100,
  },
  {
    key: "gazzetta-it-football",
    sourceName: "La Gazzetta dello Sport",
    country: "IT",
    sport: "FOOTBALL",
    url: "https://www.gazzetta.it/dynamic-feed/rss/section/Calcio.xml",
    transport: "DIRECT_RSS",
    priority: 100,
  },
];

// Google News is discovery transport only; publisher attribution and host are validated.
for (const publisher of EDITORIAL_PUBLISHERS) {
  const existing = FOOTBALL_FEEDS.find((feed) => feed.sourceName === publisher.source);
  if (existing) {
    existing.priority = publisher.primary ? 110 : 100;
    continue;
  }
  const query = new URLSearchParams({
    q: `site:${publisher.domains[0]} (football OR fútbol OR futebol OR calcio OR fussball) when:2d`,
    hl: "pt-BR",
    gl: "BR",
    ceid: "BR:pt-419",
  });
  FOOTBALL_FEEDS.push({
    key: `${publisher.country.toLowerCase()}-${publisher.domains[0]}-football`,
    sourceName: publisher.source,
    country: publisher.country,
    sport: "FOOTBALL",
    url: `https://news.google.com/rss/search?${query.toString()}`,
    transport: "GOOGLE_NEWS_RSS",
    priority: publisher.primary ? 110 : 100,
  });
}

export function approvedEditorialFeedItem(feed: EditorialFeed, item: FeedItem) {
  const publisher = approvedEditorialPublisher(
    item.sourceName ?? feed.sourceName,
    item.publisherUrl ?? item.link,
  );
  if (!publisher || publisher.source !== feed.sourceName) return false;
  if (approvedEditorialPublisher(publisher.source, item.link)) return true;
  try {
    const link = new URL(item.link);
    return (
      feed.transport === "GOOGLE_NEWS_RSS" &&
      link.protocol === "https:" &&
      link.hostname === "news.google.com" &&
      link.pathname.startsWith("/rss/articles/")
    );
  } catch {
    return false;
  }
}

const OTHER_SPORT_FEEDS: EditorialFeed[] = [
  {
    key: "ge-br-tennis",
    sourceName: "ge",
    country: "BR",
    sport: "TENNIS",
    url: "https://ge.globo.com/Esportes/Rss/0,,AS0-15090,00.xml",
    transport: "DIRECT_RSS",
    priority: 110,
  },
  {
    key: "ge-br-f1",
    sourceName: "ge",
    country: "BR",
    sport: "MOTOR",
    url: "https://ge.globo.com/servico/semantica/editorias/plantao/motor/formula-1/feed.rss",
    transport: "DIRECT_RSS",
    priority: 110,
  },
  {
    key: "ge-br-basket",
    sourceName: "ge",
    country: "BR",
    sport: "BASKET",
    url: "https://ge.globo.com/Esportes/Rss/0,,AS0-15060,00.xml",
    transport: "DIRECT_RSS",
    priority: 105,
  },
  {
    key: "ge-br-volley",
    sourceName: "ge",
    country: "BR",
    sport: "MULTISPORT",
    url: "https://ge.globo.com/Esportes/Rss/0,,AS0-15080,00.xml",
    transport: "DIRECT_RSS",
    priority: 105,
  },
  {
    key: "as-es-tennis",
    sourceName: "AS",
    country: "ES",
    sport: "TENNIS",
    url: "https://feeds.as.com/mrss-s/pages/as/site/as.com/section/tenis/portada/",
    transport: "DIRECT_RSS",
    priority: 90,
  },
  {
    key: "as-es-motor",
    sourceName: "AS",
    country: "ES",
    sport: "MOTOR",
    url: "https://feeds.as.com/mrss-s/pages/as/site/as.com/section/motor/portada/",
    transport: "DIRECT_RSS",
    priority: 90,
  },
  {
    key: "as-es-basket",
    sourceName: "AS",
    country: "ES",
    sport: "BASKET",
    url: "https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/portada/",
    transport: "DIRECT_RSS",
    priority: 90,
  },
  {
    key: "gazzetta-it-tennis",
    sourceName: "La Gazzetta dello Sport",
    country: "IT",
    sport: "TENNIS",
    url: "https://www.gazzetta.it/dynamic-feed/rss/section/Tennis.xml",
    transport: "DIRECT_RSS",
    priority: 90,
  },
  {
    key: "gazzetta-it-basket",
    sourceName: "La Gazzetta dello Sport",
    country: "IT",
    sport: "BASKET",
    url: "https://www.gazzetta.it/dynamic-feed/rss/section/Basket.xml",
    transport: "DIRECT_RSS",
    priority: 90,
  },
  {
    key: "gazzetta-it-other-sports",
    sourceName: "La Gazzetta dello Sport",
    country: "IT",
    sport: "MULTISPORT",
    url: "https://www.gazzetta.it/dynamic-feed/rss/section/Sport-Vari.xml",
    transport: "DIRECT_RSS",
    priority: 85,
  },
];

function record(value: unknown): Row | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Row)
    : null;
}

function relation(value: unknown): Row | null {
  if (record(value)) return record(value);
  return Array.isArray(value) ? record(value[0]) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/i, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function stripHtml(value: string) {
  return decodeXml(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? stripHtml(match[1] ?? "") : null;
}

export function parseEditorialRss(xml: string, fallbackSource: string): FeedItem[] {
  const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
  return blocks
    .slice(0, MAX_ITEMS_PER_FEED)
    .map((block): FeedItem | null => {
      const title = tag(block, "title");
      const link = tag(block, "link");
      const guid = tag(block, "guid") ?? link;
      const published = tag(block, "pubDate") ?? tag(block, "dc:date");
      const sourceName = tag(block, "source") ?? fallbackSource;
      const publisherUrl = block.match(/<source\b[^>]*\burl=["']([^"']+)["']/i)?.[1] ?? null;
      const description = tag(block, "description") ?? tag(block, "content:encoded");
      if (!title || !link || !guid || !published) return null;
      const publishedDate = new Date(published);
      if (Number.isNaN(publishedDate.getTime())) return null;
      const sourceSuffix = ` - ${sourceName}`;
      const cleanedTitle = title.endsWith(sourceSuffix)
        ? title.slice(0, -sourceSuffix.length).trim()
        : title;
      return {
        guid,
        title: cleanedTitle,
        description: description ? description.slice(0, 700) : null,
        link,
        sourceName,
        publisherUrl: publisherUrl ? decodeXml(publisherUrl) : null,
        publishedAt: publishedDate.toISOString(),
      };
    })
    .filter((item): item is FeedItem => item !== null);
}

function localDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function belongsToPreviousSportsDay(targetDate: string, publishedAt: string) {
  return localDateKey(publishedAt) === targetDate;
}

function normalizeArticle(value: string) {
  return normalizeTeamName(value).replace(/\s+/g, " ").trim();
}

const GENERIC_TEAM_TOKENS = new Set([
  "city",
  "united",
  "real",
  "sporting",
  "athletic",
  "club",
  "internacional",
  "america",
]);

function teamMentionScore(article: string, team: string) {
  const normalizedArticle = normalizeArticle(article);
  const normalizedTeam = normalizeTeamName(team);
  if (!normalizedArticle || !normalizedTeam) return 0;
  if (normalizedArticle.includes(normalizedTeam)) return 1;

  const articleTokens = new Set(normalizedArticle.split(" "));
  const teamTokens = normalizedTeam.split(" ").filter((token) => token.length >= 3);
  if (!teamTokens.length) return 0;
  const matched = teamTokens.filter((token) => articleTokens.has(token));
  if (matched.length === teamTokens.length) return 0.95;

  const strong = matched.filter((token) => token.length >= 5 && !GENERIC_TEAM_TOKENS.has(token));
  if (strong.length > 0) return Math.min(0.82, 0.62 + strong.length * 0.1);
  return matched.length / teamTokens.length >= 0.5 ? 0.5 : 0;
}

export function editorialFixtureMatchScore(article: string, home: string, away: string) {
  const homeScore = teamMentionScore(article, home);
  const awayScore = teamMentionScore(article, away);
  if (homeScore >= 0.6 && awayScore >= 0.6) return Math.min(1, 0.55 * homeScore + 0.45 * awayScore);
  return Math.max(homeScore, awayScore) * 0.78;
}

function editorialPriority(fixture: CanonicalFixture) {
  const competition = fixture.competition.toLocaleLowerCase("pt-BR");
  if (
    normalizeTeamName(fixture.home) === "palmeiras" ||
    normalizeTeamName(fixture.away) === "palmeiras"
  )
    return 600;
  if (
    ["GB-ENG", "DE", "FR", "IT", "ES", "BR"].includes(fixture.countryCode ?? "") &&
    fixture.divisionLevel === 1
  )
    return 500;
  if (
    fixture.competitionKind === "CONTINENTAL" &&
    ["EUROPE", "SOUTH_AMERICA"].includes(fixture.region ?? "")
  )
    return 480;
  if (
    /fa cup|efl cup|copa del rey|coppa italia|coupe de france|dfb.*pokal|copa do brasil/.test(
      competition,
    )
  )
    return 460;
  if (
    ["GB-ENG", "DE", "FR", "IT", "ES", "BR"].includes(fixture.countryCode ?? "") &&
    fixture.divisionLevel === 2
  )
    return 420;
  if (fixture.countryCode === "AR" && fixture.divisionLevel === 1) return 380;
  if (fixture.countryCode === "US" && competition.includes("mls")) return 360;
  if (competition.includes("saudi")) return 340;
  if (competition.includes("international")) return 320;
  return 0;
}

async function loadEditorialFixtures(date: string): Promise<CanonicalFixture[]> {
  const db = await sportsDb();
  const start = new Date(`${date}T00:00:00-03:00`).toISOString();
  const end = new Date(new Date(start).getTime() + 86_400_000).toISOString();
  const result = await db
    .from("sports_fixtures")
    .select(
      "id,kickoff_at,status,home_team:sports_teams!sports_fixtures_home_team_id_fkey(name),away_team:sports_teams!sports_fixtures_away_team_id_fkey(name),competition:sports_competitions!sports_fixtures_competition_id_fkey(name,country_code,region,competition_kind,division_level)",
    )
    .eq("status", "FINISHED")
    .gte("kickoff_at", start)
    .lt("kickoff_at", end)
    .limit(500);
  if (result.error)
    throw new Error(`Falha ao carregar fixtures para contexto editorial: ${result.error.message}`);

  return (Array.isArray(result.data) ? result.data : [])
    .map(record)
    .map((row): CanonicalFixture | null => {
      if (!row) return null;
      const home = relation(row["home_team"]);
      const away = relation(row["away_team"]);
      const competition = relation(row["competition"]);
      const fixture: CanonicalFixture = {
        id: text(row["id"]) ?? "",
        kickoffAt: text(row["kickoff_at"]) ?? "",
        home: text(home?.["name"]) ?? "",
        away: text(away?.["name"]) ?? "",
        competition: text(competition?.["name"]) ?? "",
        countryCode: text(competition?.["country_code"]),
        region: text(competition?.["region"]),
        competitionKind: text(competition?.["competition_kind"]) ?? "",
        divisionLevel: numberValue(competition?.["division_level"]),
        priority: 0,
      };
      if (
        !fixture.id ||
        !fixture.kickoffAt ||
        !fixture.home ||
        !fixture.away ||
        !fixture.competitionKind
      )
        return null;
      fixture.priority = editorialPriority(fixture);
      return fixture.priority > 0 ? fixture : null;
    })
    .filter((fixture): fixture is CanonicalFixture => fixture !== null);
}

async function fetchFeed(feed: EditorialFeed) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(feed.url, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseEditorialRss(await response.text(), feed.sourceName);
  } finally {
    clearTimeout(timer);
  }
}

function bestFixtureMatch(item: FeedItem, fixtures: CanonicalFixture[]) {
  const article = `${item.title} ${item.description ?? ""}`;
  const candidates = fixtures
    .map((fixture) => ({
      fixture,
      score: editorialFixtureMatchScore(article, fixture.home, fixture.away),
    }))
    .filter((candidate) => candidate.score >= 0.58)
    .sort((a, b) => b.score - a.score || b.fixture.priority - a.fixture.priority);
  const best = candidates[0];
  const second = candidates[1];
  if (!best) return null;
  if (second && best.score - second.score < 0.08 && best.fixture.id !== second.fixture.id)
    return null;
  return best;
}

function contextTags(title: string) {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
  const tags: string[] = [];
  if (/record|recorde|rekord|récord/.test(normalized)) tags.push("RECORD");
  if (
    /diz|disse|afirma|declara|says|said|warns|warnt|dit |déclare|dice|asegura|".*"/.test(normalized)
  )
    tags.push("STATEMENT");
  if (/analise|analysis|repercuss|reaction|kritik|critica|décryptage|opinion/.test(normalized))
    tags.push("REACTION");
  return tags;
}

function sportLabel(feed: EditorialFeed, item: FeedItem) {
  if (feed.sport !== "MULTISPORT") return feed.sport;
  const value = `${item.title} ${item.description ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/tenis|tennis|atp|wta|davis/.test(value)) return "TENNIS";
  if (/formula 1|f1|motogp|automobil|motor/.test(value)) return "MOTOR";
  if (/basquete|basket|nba|euroleague/.test(value)) return "BASKET";
  if (/volei|volley/.test(value)) return "VOLLEY";
  if (/judo/.test(value)) return "JUDO";
  if (/ciclismo|cycling|giro|tour|vuelta/.test(value)) return "CYCLING";
  if (/atletismo|athletics/.test(value)) return "ATHLETICS";
  if (/natacao|swimming/.test(value)) return "SWIMMING";
  return "OTHER";
}

export async function syncEditorialSources(date: string): Promise<EditorialSourceSyncResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Data inválida; use YYYY-MM-DD.");

  const db = await sportsDb();
  const fixtures = await loadEditorialFixtures(date);
  const feeds = [...FOOTBALL_FEEDS, ...OTHER_SPORT_FEEDS];
  const fetchedAt = new Date().toISOString();
  const errors: EditorialSourceSyncResult["errors"] = [];
  let feedsSucceeded = 0;
  let feedItemsRead = 0;
  let footballEvidence = 0;
  let otherSportsEvidence = 0;
  let unmatchedFootballItems = 0;

  // Bound discovery concurrency so eight additional publishers do not extend each timeout serially.
  const discovered: Array<PromiseSettledResult<FeedItem[]>> = [];
  for (let index = 0; index < feeds.length; index += 4) {
    discovered.push(...(await Promise.allSettled(feeds.slice(index, index + 4).map(fetchFeed))));
  }
  for (const [index, feed] of feeds.entries()) {
    let items: FeedItem[] = [];
    try {
      const result = discovered[index];
      if (!result || result.status === "rejected")
        throw result?.reason ?? new Error("Feed indisponível.");
      items = result.value;
      feedsSucceeded += 1;
      feedItemsRead += items.length;
    } catch (error) {
      errors.push({
        feed: feed.key,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    const dayItems = items.filter(
      (item) =>
        belongsToPreviousSportsDay(date, item.publishedAt) && approvedEditorialFeedItem(feed, item),
    );
    const limited =
      feed.sport === "FOOTBALL" ? dayItems : dayItems.slice(0, MAX_OTHER_SPORT_ITEMS_PER_FEED);

    for (const item of limited) {
      if (feed.sport === "FOOTBALL") {
        const match = bestFixtureMatch(item, fixtures);
        if (!match) {
          unmatchedFootballItems += 1;
          continue;
        }

        const upsert = await db.from("sports_editorial_source_evidence").upsert(
          {
            fixture_id: match.fixture.id,
            briefing_date: date,
            source_kind: "JOURNALISM",
            source_name: feed.sourceName,
            source_url: item.link,
            source_event_id: `${feed.key}:${item.guid}`,
            evidence_type: "MATCH_CONTEXT",
            title: item.title,
            body: feed.transport === "DIRECT_RSS" ? item.description : null,
            payload: {},
            published_at: item.publishedAt,
            fetched_at: fetchedAt,
            confidence: Number(Math.min(0.99, match.score).toFixed(3)),
            metadata: {
              definitionVersion: "editorial-rss-v2",
              publisherUrl: item.publisherUrl ?? item.link,
              feedKey: feed.key,
              feedUrl: feed.url,
              transport: feed.transport,
              country: feed.country,
              sport: feed.sport,
              sourcePriority: feed.priority,
              contextTags: contextTags(item.title),
              canonicalFixture: {
                home: match.fixture.home,
                away: match.fixture.away,
                competition: match.fixture.competition,
              },
            },
          },
          { onConflict: "source_kind,evidence_type,source_event_id" },
        );
        if (upsert.error)
          throw new Error(`Falha ao persistir contexto ${feed.key}: ${upsert.error.message}`);
        footballEvidence += 1;
        continue;
      }

      const upsert = await db.from("sports_editorial_source_evidence").upsert(
        {
          fixture_id: null,
          briefing_date: date,
          source_kind: "JOURNALISM",
          source_name: feed.sourceName,
          source_url: item.link,
          source_event_id: `${feed.key}:${item.guid}`,
          evidence_type: "OTHER_SPORT",
          title: item.title,
          body: feed.transport === "DIRECT_RSS" ? item.description : null,
          payload: {},
          published_at: item.publishedAt,
          fetched_at: fetchedAt,
          confidence: 0.9,
          metadata: {
            definitionVersion: "editorial-rss-v2",
            publisherUrl: item.publisherUrl ?? item.link,
            feedKey: feed.key,
            feedUrl: feed.url,
            transport: feed.transport,
            country: feed.country,
            sport: sportLabel(feed, item),
            sourcePriority: feed.priority,
          },
        },
        { onConflict: "source_kind,evidence_type,source_event_id" },
      );
      if (upsert.error)
        throw new Error(`Falha ao persistir outro esporte ${feed.key}: ${upsert.error.message}`);
      otherSportsEvidence += 1;
    }
  }

  const result: EditorialSourceSyncResult = {
    date,
    feedsAttempted: feeds.length,
    feedsSucceeded,
    feedsFailed: errors.length,
    feedItemsRead,
    footballEvidence,
    otherSportsEvidence,
    unmatchedFootballItems,
    errors,
    fetchedAt,
  };

  const state = await db.from("sports_sync_state").upsert(
    {
      provider: "editorial_rss",
      domain: "previous_day_review",
      season: SEASON,
      cursor_value: date,
      last_attempt_at: fetchedAt,
      last_success_at: feedsSucceeded > 0 ? fetchedAt : null,
      last_error:
        feedsSucceeded === 0
          ? "Nenhuma fonte editorial respondeu."
          : errors.length > 0
            ? `${errors.length} fonte(s) falharam; sincronização parcial.`
            : null,
      metadata: result,
      updated_at: fetchedAt,
    },
    { onConflict: "provider,domain,season" },
  );
  if (state.error) throw new Error(`Falha ao persistir estado editorial: ${state.error.message}`);

  return result;
}
