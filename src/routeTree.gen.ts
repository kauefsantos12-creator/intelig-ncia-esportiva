/* eslint-disable */
/* @ts-nocheck */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as PrivacidadeImport } from './routes/privacidade'
import { Route as IndexImport } from './routes/index'
import { Route as HojeImport } from './routes/hoje'
import { Route as EloImport } from './routes/elo'
import { Route as ContaImport } from './routes/conta'
import { Route as AnalyticsImport } from './routes/analytics'
import { Route as AnotacoesImport } from './routes/anotacoes'
import { Route as ApiSportsJobsImport } from './routes/api.sports-jobs'
import { Route as ApiSportsDailySyncImport } from './routes/api.sports-daily-sync'
import { Route as ApiSportsApiMaintenanceImport } from './routes/api.sports-api-maintenance'
import { Route as ApiEloSyncImport } from './routes/api.elo-sync'

const PrivacidadeRoute = PrivacidadeImport.update({ id: '/privacidade', path: '/privacidade', getParentRoute: () => rootRouteImport } as any)
const IndexRoute = IndexImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const HojeRoute = HojeImport.update({ id: '/hoje', path: '/hoje', getParentRoute: () => rootRouteImport } as any)
const EloRoute = EloImport.update({ id: '/elo', path: '/elo', getParentRoute: () => rootRouteImport } as any)
const ContaRoute = ContaImport.update({ id: '/conta', path: '/conta', getParentRoute: () => rootRouteImport } as any)
const AnalyticsRoute = AnalyticsImport.update({ id: '/analytics', path: '/analytics', getParentRoute: () => rootRouteImport } as any)
const AnotacoesRoute = AnotacoesImport.update({ id: '/anotacoes', path: '/anotacoes', getParentRoute: () => rootRouteImport } as any)
const ApiSportsJobsRoute = ApiSportsJobsImport.update({ id: '/api/sports-jobs', path: '/api/sports-jobs', getParentRoute: () => rootRouteImport } as any)
const ApiSportsDailySyncRoute = ApiSportsDailySyncImport.update({ id: '/api/sports-daily-sync', path: '/api/sports-daily-sync', getParentRoute: () => rootRouteImport } as any)
const ApiSportsApiMaintenanceRoute = ApiSportsApiMaintenanceImport.update({ id: '/api/sports-api-maintenance', path: '/api/sports-api-maintenance', getParentRoute: () => rootRouteImport } as any)
const ApiEloSyncRoute = ApiEloSyncImport.update({ id: '/api/elo-sync', path: '/api/elo-sync', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath { '/': typeof IndexRoute; '/analytics': typeof AnalyticsRoute; '/anotacoes': typeof AnotacoesRoute; '/conta': typeof ContaRoute; '/elo': typeof EloRoute; '/hoje': typeof HojeRoute; '/privacidade': typeof PrivacidadeRoute; '/api/elo-sync': typeof ApiEloSyncRoute; '/api/sports-api-maintenance': typeof ApiSportsApiMaintenanceRoute; '/api/sports-daily-sync': typeof ApiSportsDailySyncRoute; '/api/sports-jobs': typeof ApiSportsJobsRoute }
export interface FileRoutesByTo { '/': typeof IndexRoute; '/analytics': typeof AnalyticsRoute; '/anotacoes': typeof AnotacoesRoute; '/conta': typeof ContaRoute; '/elo': typeof EloRoute; '/hoje': typeof HojeRoute; '/privacidade': typeof PrivacidadeRoute; '/api/elo-sync': typeof ApiEloSyncRoute; '/api/sports-api-maintenance': typeof ApiSportsApiMaintenanceRoute; '/api/sports-daily-sync': typeof ApiSportsDailySyncRoute; '/api/sports-jobs': typeof ApiSportsJobsRoute }
export interface FileRoutesById { __root__: typeof rootRouteImport; '/': typeof IndexRoute; '/analytics': typeof AnalyticsRoute; '/anotacoes': typeof AnotacoesRoute; '/conta': typeof ContaRoute; '/elo': typeof EloRoute; '/hoje': typeof HojeRoute; '/privacidade': typeof PrivacidadeRoute; '/api/elo-sync': typeof ApiEloSyncRoute; '/api/sports-api-maintenance': typeof ApiSportsApiMaintenanceRoute; '/api/sports-daily-sync': typeof ApiSportsDailySyncRoute; '/api/sports-jobs': typeof ApiSportsJobsRoute }
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/analytics' | '/anotacoes' | '/conta' | '/elo' | '/hoje' | '/privacidade' | '/api/elo-sync' | '/api/sports-api-maintenance' | '/api/sports-daily-sync' | '/api/sports-jobs'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/analytics' | '/anotacoes' | '/conta' | '/elo' | '/hoje' | '/privacidade' | '/api/elo-sync' | '/api/sports-api-maintenance' | '/api/sports-daily-sync' | '/api/sports-jobs'
  id: '__root__' | '/' | '/analytics' | '/anotacoes' | '/conta' | '/elo' | '/hoje' | '/privacidade' | '/api/elo-sync' | '/api/sports-api-maintenance' | '/api/sports-daily-sync' | '/api/sports-jobs'
  fileRoutesById: FileRoutesById
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexImport; parentRoute: typeof rootRouteImport }
    '/analytics': { id: '/analytics'; path: '/analytics'; fullPath: '/analytics'; preLoaderRoute: typeof AnalyticsImport; parentRoute: typeof rootRouteImport }
    '/anotacoes': { id: '/anotacoes'; path: '/anotacoes'; fullPath: '/anotacoes'; preLoaderRoute: typeof AnotacoesImport; parentRoute: typeof rootRouteImport }
    '/conta': { id: '/conta'; path: '/conta'; fullPath: '/conta'; preLoaderRoute: typeof ContaImport; parentRoute: typeof rootRouteImport }
    '/elo': { id: '/elo'; path: '/elo'; fullPath: '/elo'; preLoaderRoute: typeof EloImport; parentRoute: typeof rootRouteImport }
    '/hoje': { id: '/hoje'; path: '/hoje'; fullPath: '/hoje'; preLoaderRoute: typeof HojeImport; parentRoute: typeof rootRouteImport }
    '/privacidade': { id: '/privacidade'; path: '/privacidade'; fullPath: '/privacidade'; preLoaderRoute: typeof PrivacidadeImport; parentRoute: typeof rootRouteImport }
    '/api/elo-sync': { id: '/api/elo-sync'; path: '/api/elo-sync'; fullPath: '/api/elo-sync'; preLoaderRoute: typeof ApiEloSyncImport; parentRoute: typeof rootRouteImport }
    '/api/sports-api-maintenance': { id: '/api/sports-api-maintenance'; path: '/api/sports-api-maintenance'; fullPath: '/api/sports-api-maintenance'; preLoaderRoute: typeof ApiSportsApiMaintenanceImport; parentRoute: typeof rootRouteImport }
    '/api/sports-daily-sync': { id: '/api/sports-daily-sync'; path: '/api/sports-daily-sync'; fullPath: '/api/sports-daily-sync'; preLoaderRoute: typeof ApiSportsDailySyncImport; parentRoute: typeof rootRouteImport }
    '/api/sports-jobs': { id: '/api/sports-jobs'; path: '/api/sports-jobs'; fullPath: '/api/sports-jobs'; preLoaderRoute: typeof ApiSportsJobsImport; parentRoute: typeof rootRouteImport }
  }
}

const rootRouteChildren = { IndexRoute, AnalyticsRoute, AnotacoesRoute, ContaRoute, EloRoute, HojeRoute, PrivacidadeRoute, ApiEloSyncRoute, ApiSportsApiMaintenanceRoute, ApiSportsDailySyncRoute, ApiSportsJobsRoute }
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
