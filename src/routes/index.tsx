import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownRight, ArrowUpRight, CalendarClock, Newspaper, RefreshCw, Trophy, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/ProductControls";
import { ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState, ErrorState, LoadingState } from "@/components/SurfaceState";
import { getNewsOverview, type EloMovement, type NewsBriefingItem, type NewsOverview, type NewsResult } from "@/lib/news-overview.functions";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Noticiário · Motor de Inteligência Esportiva" },
    { name: "description", content: "Resenha esportiva diária, resultados recentes e movimentos relevantes de Elo." },
  ] }),
  component: NewsPage,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const compactDateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short" });
const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

function formatDate(value: string) { const d = new Date(value.length === 10 ? `${value}T12:00:00-03:00` : value); return Number.isNaN(d.getTime()) ? value : dateFormatter.format(d); }
function formatTime(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : timeFormatter.format(d); }
function localDateKey(value: string | Date) { const d = value instanceof Date ? value : new Date(value); return Number.isNaN(d.getTime()) ? "unknown" : dateKeyFormatter.format(d); }
function briefingTitle(date: string, observedAt: string) {
  const todayKey = localDateKey(observedAt);
  const todayNoon = new Date(`${todayKey}T12:00:00-03:00`);
  const yesterdayKey = Number.isNaN(todayNoon.getTime()) ? "" : localDateKey(new Date(todayNoon.getTime() - 86_400_000));
  return date === yesterdayKey ? `Resenha de ontem — ${formatDate(date)}` : `Resenha de ${formatDate(date)}`;
}

function ResultTeam({ name, logo, goals }: { name: string; logo: string | null; goals: number }) {
  const [logoFailed,setLogoFailed]=useState(false);
  const initial=name.trim().charAt(0).toLocaleUpperCase("pt-BR")||"•";
  const showLogo=Boolean(logo&&!logoFailed);
  return <div className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-2.5">
    {showLogo?<span className="flex size-8 shrink-0 items-center justify-center"><img src={logo!} alt={`Escudo do ${name}`} loading="lazy" decoding="async" onError={()=>setLogoFailed(true)} className="max-h-8 max-w-8 object-contain" /></span>:<span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary/35 type-caption font-semibold text-muted-foreground" aria-hidden>{initial}</span>}
    <p className="truncate type-label text-foreground">{name}</p><span className="type-metric min-w-6 text-right text-foreground">{goals}</span>
  </div>;
}
function ResultRow({ result }: { result: NewsResult }) { return <article className="rounded-xl border border-border/55 bg-secondary/22 px-4 py-3"><div className="flex min-w-0 flex-wrap items-center justify-between gap-2"><p className="min-w-0 truncate type-caption text-muted-foreground">{result.competition}</p><div className="flex shrink-0 items-center gap-2"><span className="type-caption text-muted-foreground">{formatTime(result.kickoffAt)}</span><StatusBadge tone="success">Encerrado</StatusBadge></div></div><div className="mt-3 space-y-2"><ResultTeam name={result.homeTeam} logo={result.homeTeamLogo} goals={result.homeGoals} /><ResultTeam name={result.awayTeam} logo={result.awayTeamLogo} goals={result.awayGoals} /></div></article>; }
function EloMovementRow({ movement }: { movement: EloMovement }) { const positive=movement.delta>=0; const Icon=positive?ArrowUpRight:ArrowDownRight; const score=movement.goalsFor===null||movement.goalsAgainst===null?null:`${movement.goalsFor}–${movement.goalsAgainst}`; return <article className="rounded-xl border border-border/55 bg-secondary/22 px-4 py-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate type-label text-foreground">{movement.team}</p><p className="mt-0.5 truncate type-caption text-muted-foreground">{movement.competition} · vs. {movement.opponent}{score?` · ${score}`:""}</p></div><span className={`flex shrink-0 items-center gap-1 type-metric ${positive?"text-success":"text-destructive"}`}><Icon className="size-4" aria-hidden />{positive?"+":""}{movement.delta.toFixed(1)}</span></div><p className="mt-2 type-caption text-muted-foreground">{movement.ratingBefore.toFixed(1)} → {movement.ratingAfter.toFixed(1)}</p></article>; }

function EditorialItem({ item }: { item: NewsBriefingItem }) {
  return <article className="border-t border-border/55 pt-6 first:border-t-0 first:pt-0">
    <h3 className="text-xl font-semibold tracking-tight text-foreground">{item.title}</h3>
    {item.body ? <p className="mt-3 max-w-[72ch] whitespace-pre-line type-body leading-7 text-foreground/90">{item.body}</p> : null}
    {item.sources.length ? <p className="mt-3 type-caption text-muted-foreground">Fontes: {item.sources.map((source,index)=><span key={source.url}>{index>0?" · ":null}<a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">{source.label}</a></span>)}</p> : null}
  </article>;
}

function NewsPage() {
  const loadOverview=useServerFn(getNewsOverview); const [overview,setOverview]=useState<NewsOverview|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
  const refresh=useCallback(async()=>{setLoading(true);setError(null);try{setOverview(await loadOverview());}catch{setError("Os dados do Noticiário não puderam ser carregados agora.");}finally{setLoading(false);}},[loadOverview]);
  useEffect(()=>{void refresh();},[refresh]);
  const briefing=overview?.briefing??null;
  const palmeirasItem=briefing?.items.find(i=>i.kind==="NEWS_CONTEXT"&&i.title==="Palmeiras")??null;
  const contextItems=briefing?.items.filter(i=>i.kind==="NEWS_CONTEXT"&&i.title!=="Palmeiras")??[];
  const matchItems=briefing?.items.filter(i=>i.kind==="FOOTBALL_MATCH")??[];
  const otherSportsItems=briefing?.items.filter(i=>i.kind==="OTHER_SPORT")??[];
  const sortedMatches=[...matchItems].sort((a,b)=>b.priority-a.priority);
  const chronicleItems=sortedMatches.filter(i=>i.body).slice(0,5);
  const roundupItems=sortedMatches.filter(i=>!chronicleItems.includes(i));
  const groupedResults=useMemo(()=>{if(!overview)return[];const groups=new Map<string,NewsResult[]>();for(const r of overview.recentResults){const k=localDateKey(r.kickoffAt);groups.set(k,[...(groups.get(k)??[]),r]);}const today=localDateKey(overview.observedAt);const noon=new Date(`${today}T12:00:00-03:00`);const yesterday=Number.isNaN(noon.getTime())?"":localDateKey(new Date(noon.getTime()-86400000));return Array.from(groups.entries()).map(([key,results])=>({key,label:key===today?"Hoje":key===yesterday?"Ontem":results[0]?compactDateFormatter.format(new Date(results[0].kickoffAt)):key,results}));},[overview]);
  return <AppShell stage="news"><div className="space-y-6">
    <ProductPageHeader eyebrow="Noticiário" title="O que aconteceu e o que mudou" description="A resenha é a leitura principal do dia; placares e Elo permanecem como contexto factual." aside={<div className="flex items-center gap-2">{overview?<StatusBadge tone="neutral">Atualizado {formatTime(overview.observedAt)}</StatusBadge>:null}<button type="button" onClick={()=>void refresh()} disabled={loading} className="touch-target inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-3 type-meta font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"><RefreshCw className={`size-4 ${loading?"animate-spin":""}`} aria-hidden /><span className="hidden sm:inline">Atualizar</span></button></div>} />
    {loading&&!overview?<LoadingState rows={5} label="Carregando Noticiário" />:null}{error&&!overview?<ErrorState description={error} onRetry={()=>void refresh()} />:null}
    {overview?<div className="space-y-4">
      <SurfaceCard icon={Newspaper} title={briefing?briefingTitle(briefing.date,overview.observedAt):"Resenha esportiva"} description="Leitura editorial diária, sustentada por fatos persistidos e proveniência." actions={briefing?.footballSummary?<StatusBadge tone="success">Publicada</StatusBadge>:<StatusBadge tone="neutral">Aguardando publicação</StatusBadge>}>
        {briefing?.footballSummary?<div className="space-y-8">
          <section aria-label="Abertura da resenha"><p className="max-w-[72ch] whitespace-pre-line text-lg leading-8 text-foreground/95">{briefing.footballSummary}</p></section>
          {palmeirasItem?<section className="border-t border-border/55 pt-6"><h2 className="text-2xl font-semibold tracking-tight text-foreground">Palmeiras</h2>{palmeirasItem.body?<p className="mt-3 max-w-[72ch] whitespace-pre-line type-body leading-7 text-foreground/90">{palmeirasItem.body}</p>:null}</section>:null}
          {contextItems.length?<section className="space-y-6 border-t border-border/55 pt-6"><h2 className="text-2xl font-semibold tracking-tight text-foreground">Contexto do dia</h2>{contextItems.map(item=><EditorialItem key={item.id} item={item} />)}</section>:null}
          {chronicleItems.length?<section className="space-y-5 border-t border-border/55 pt-6"><h2 className="text-2xl font-semibold tracking-tight text-foreground">A crônica de ontem</h2>{chronicleItems.map(item=><p key={item.id} className="max-w-[72ch] type-body leading-7 text-foreground/90"><strong className="font-semibold text-foreground">{item.title}.</strong> {item.body}</p>)}</section>:null}
          {roundupItems.length?<section className="space-y-3 border-t border-border/55 pt-6"><h2 className="text-xl font-semibold tracking-tight text-foreground">Resumão dos demais jogos</h2><p className="max-w-[72ch] type-body leading-7 text-foreground/85">{roundupItems.map((item,i)=><span key={item.id}>{i>0?" ":null}<strong className="font-medium text-foreground">{item.title}{item.lateGame?" (após 21h)":""}:</strong> {item.body??""}</span>)}</p></section>:null}
          {briefing.otherSportsSummary||otherSportsItems.length?<section className="space-y-6 border-t border-border/55 pt-6"><h2 className="text-2xl font-semibold tracking-tight text-foreground">Outros esportes de ontem</h2>{briefing.otherSportsSummary?<p className="max-w-[72ch] whitespace-pre-line type-body leading-7 text-foreground/90">{briefing.otherSportsSummary}</p>:null}{otherSportsItems.map(item=><EditorialItem key={item.id} item={item} />)}</section>:null}
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/55 pt-3 type-caption text-muted-foreground">{briefing.factsThrough?<span>Fatos verificados até {formatTime(briefing.factsThrough)} (Brasília)</span>:null}{briefing.generatedAt?<span>Gerada às {formatTime(briefing.generatedAt)}</span>:null}</div>
        </div>:<EmptyState icon={Newspaper} title="A resenha ainda não foi publicada" description="A interface não fabrica uma narrativa quando o backend editorial ainda não publicou uma resenha." />}
      </SurfaceCard>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <SurfaceCard icon={Trophy} title="Resultados recentes" description="Partidas encerradas do escopo prioritário nas últimas 48 horas." actions={<StatusBadge tone="neutral">{overview.recentResults.length} jogos</StatusBadge>}>{groupedResults.length?<div className="space-y-5">{groupedResults.map(g=><section key={g.key}><div className="mb-2 flex items-center justify-between gap-3"><h3 className="type-label text-foreground">{g.label}</h3><span className="type-caption text-muted-foreground">{g.results.length} {g.results.length===1?"jogo":"jogos"}</span></div><div className="space-y-2">{g.results.map(r=><ResultRow key={r.id} result={r} />)}</div></section>)}</div>:<EmptyState icon={CalendarClock} title="Sem resultados prioritários recentes" description="Nenhuma partida encerrada do escopo prioritário foi registrada nas últimas 48 horas." />}</SurfaceCard>
        <SurfaceCard icon={TrendingUp} title="Movimentos de Elo" description="Maiores variações do Elo local canônico registradas nas últimas 48 horas." actions={<StatusBadge tone="neutral">{overview.eloMovements.length} movimentos</StatusBadge>} className="self-start">{overview.eloMovements.length?<div className="space-y-2">{overview.eloMovements.map((m,i)=><EloMovementRow key={`${m.fixtureId??m.kickoffAt}-${m.team}-${i}`} movement={m} />)}</div>:<EmptyState icon={TrendingUp} title="Sem movimentos relevantes" description="Não houve variações de Elo acima do piso de exibição no período disponível." />}</SurfaceCard>
      </div>
    </div>:null}
  </div></AppShell>;
}
