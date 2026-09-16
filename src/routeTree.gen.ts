/* eslint-disable */
/* @ts-nocheck */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as PrivacidadeImport } from './routes/privacidade'
import { Route as IndexImport } from './routes/index'
import { Route as ContaImport } from './routes/conta'
import { Route as ApiSportsJobsImport } from './routes/api.sports-jobs'
import { Route as ApiEloSyncImport } from './routes/api.elo-sync'

const PrivacidadeRoute = PrivacidadeImport.update({ id: '/privacidade', path: '/privacidade', getParentRoute: () => rootRouteImport } as any)
const IndexRoute = IndexImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const ContaRoute = ContaImport.update({ id: '/conta', path: '/conta', getParentRoute: () => rootRouteImport } as any)
const ApiSportsJobsRoute = ApiSportsJobsImport.update({ id: '/api/sports-jobs', path: '/api/sports-jobs', getParentRoute: () => rootRouteImport } as any)
const ApiEloSyncRoute = ApiEloSyncImport.update({ id: '/api/elo-sync', path: '/api/elo-sync', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath { '/': typeof IndexRoute; '/conta': typeof ContaRoute; '/privacidade': typeof PrivacidadeRoute; '/api/elo-sync': typeof ApiEloSyncRoute; '/api/sports-jobs': typeof ApiSportsJobsRoute }
export interface FileRoutesByTo { '/': typeof IndexRoute; '/conta': typeof ContaRoute; '/privacidade': typeof PrivacidadeRoute; '/api/elo-sync': typeof ApiEloSyncRoute; '/api/sports-jobs': typeof ApiSportsJobsRoute }
export interface FileRoutesById { __root__: typeof rootRouteImport; '/': typeof IndexRoute; '/conta': typeof ContaRoute; '/privacidade': typeof PrivacidadeRoute; '/api/elo-sync': typeof ApiEloSyncRoute; '/api/sports-jobs': typeof ApiSportsJobsRoute }
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/conta' | '/privacidade' | '/api/elo-sync' | '/api/sports-jobs'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/conta' | '/privacidade' | '/api/elo-sync' | '/api/sports-jobs'
  id: '__root__' | '/' | '/conta' | '/privacidade' | '/api/elo-sync' | '/api/sports-jobs'
  fileRoutesById: FileRoutesById
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexImport; parentRoute: typeof rootRouteImport }
    '/conta': { id: '/conta'; path: '/conta'; fullPath: '/conta'; preLoaderRoute: typeof ContaImport; parentRoute: typeof rootRouteImport }
    '/privacidade': { id: '/privacidade'; path: '/privacidade'; fullPath: '/privacidade'; preLoaderRoute: typeof PrivacidadeImport; parentRoute: typeof rootRouteImport }
    '/api/elo-sync': { id: '/api/elo-sync'; path: '/api/elo-sync'; fullPath: '/api/elo-sync'; preLoaderRoute: typeof ApiEloSyncImport; parentRoute: typeof rootRouteImport }
    '/api/sports-jobs': { id: '/api/sports-jobs'; path: '/api/sports-jobs'; fullPath: '/api/sports-jobs'; preLoaderRoute: typeof ApiSportsJobsImport; parentRoute: typeof rootRouteImport }
  }
}

const rootRouteChildren = { IndexRoute, ContaRoute, PrivacidadeRoute, ApiEloSyncRoute, ApiSportsJobsRoute }
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
