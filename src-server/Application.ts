import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";

/**
 * Load Cards, prepare image lists etc.
 */
import Logger from "./Logger";

import { Caching, ServerInstance, shutdown } from "./Server";
import { CardDataProvider } from "./plugins/CardDataProvider";
import InitAuthencation, * as Authentication from "./Authentication";
import * as ResultToken from "./game-management/ResultToken";
import setupEvents from "./plugins/events";

import InitDecklistRoutes from "./plugins/Decklist"
import InitReleaseNotes from "./releasenotes";
import { InitPersonalisation } from "./Personalisation";
import InitGameLogs from "./game-logs";
import InitRouting from "./server/module";
import { getRootFolder } from "./Configuration";
import CreateRobotsTxt from "./robotstxt";
import InitFaviconRoutes from "./plugins/Favicons";
import InitTournamentsEndpoints from "./plugins/TournamentList";
import InitFeedbackEndpoint from "./plugins/FeedbackForm";
import InitRouteDictionary from "./Languags";
import InitBlogEndpoints from "./plugins/Blog";

ServerInstance.setup();
setupEvents();

/**
 * Create server
 */
CreateRobotsTxt();
InitRouteDictionary();
InitAuthencation();

ServerInstance.getServerInstance().use(express.static(getRootFolder() + "/public"));
ServerInstance.getServerInstance().use("/dist-client", express.static("dist-client"));

/**
 * Show list of available images. 
 */
ServerInstance.getServerInstance().get("/data/list/images", Caching.cache.jsonCallback6hrs, (_req: Request, res: Response) => res.send(CardDataProvider.getImageList()).status(200));

/**
 * Show list of available sites
 */
ServerInstance.getServerInstance().get("/data/list/sites", Caching.cache.jsonCallback6hrs, (_req: Request, res: Response) => res.send(CardDataProvider.getSiteList()).status(200));
ServerInstance.getServerInstance().get("/data/list/gamedata", Caching.cache.jsonCallback6hrs, (_req: Request, res: Response) => {

    res.status(200).json({
        images: CardDataProvider.getImageList(),
        map: CardDataProvider.getMapdata(),
        underdeeps: CardDataProvider.getUnderdeepMapdata()
    });
});

ServerInstance.getServerInstance().get("/data/list/map", Caching.cache.jsonCallback6hrs, (_req: Request, res: Response) => res.send(CardDataProvider.getMapdata()).status(200));
ServerInstance.getServerInstance().get("/data/list/underdeeps", Caching.cache.jsonCallback6hrs, (_req: Request, res: Response) => res.send(CardDataProvider.getUnderdeepMapdata()).status(200));


/** Suggestions for code/name resolving */
ServerInstance.getServerInstance().get("/data/list/name-code-suggestions", Caching.expires.jsonCallback, (_req: Request, res: Response) => res.send(CardDataProvider.getNameCodeSuggestionMap()).status(200));

InitReleaseNotes();
InitPersonalisation();

/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
ServerInstance.getServerInstance().use("/data/scores", express.static(getRootFolder() + "/data-local/scores.json", Caching.headerData.generic));

/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
ServerInstance.getServerInstance().get("/data/marshallingpoints", Caching.expires.jsonCallback, (req: Request, res: Response) => res.send(CardDataProvider.getMarshallingPoints("" + req.query.code)));

/**
 * Provide the cards
 */
ServerInstance.getServerInstance().get("/data/list/cards", Caching.cache.jsonCallback6hrs, (_req: Request, res: Response) => res.send(CardDataProvider.getCardsDeckbuilder()).status(200));
ServerInstance.getServerInstance().get("/data/list/stages", Caching.cache.jsonCallback6hrs, (_req: Request, res: Response) => res.send(CardDataProvider.getStageCards()).status(200));
ServerInstance.getServerInstance().get("/data/list/avatars", Caching.cache.jsonCallback6hrs, (_req: Request, res: Response) => res.send(CardDataProvider.getAvatarCodes()).status(200));
ServerInstance.getServerInstance().get("/data/list/filters", Caching.expires.jsonCallback, (_req: Request, res: Response) => res.send(CardDataProvider.getFilters()).status(200));

ServerInstance.getServerInstance().use("/data/backside", express.static(getRootFolder() + "/public/media/assets/images/cards/backside.jpg", Caching.headerData.jpeg));
ServerInstance.getServerInstance().use("/data/backside-region", express.static(getRootFolder() + "/public/media/assets/images/cards/backside-region.jpg", Caching.headerData.jpeg));
ServerInstance.getServerInstance().use("/data/card-not-found-generic", express.static(getRootFolder() + "/public/media/assets/images/cards/notfound-generic.jpg", Caching.headerData.jpeg));
ServerInstance.getServerInstance().use("/data/card-not-found-region", express.static(getRootFolder() + "/public/media/assets/images/cards/notfound-region.jpg", Caching.headerData.jpeg));
ServerInstance.getServerInstance().use("/data/card-not-found-site", express.static(getRootFolder() + "/public/media/assets/images/cards/notfound-site.jpg", Caching.headerData.jpeg));

if (process.env["LANG_FR_URL"])
    ServerInstance.getServerInstance().get("/data/fr", Caching.cache.jsonCallback6hrs, (_req: Request, res: Response) => res.json({ value: process.env["LANG_FR_URL"] ?? "" }));
    

/**
 * Get active games
 */
ServerInstance.getServerInstance().get("/data/games", Caching.expires.jsonCallback, (_req: Request, res: Response) => res.send(ServerInstance.getRoomManager().getActiveGames()).status(200));
ServerInstance.getServerInstance().get("/data/games/:room", Caching.expires.jsonCallback, (req: Request, res: Response) => res.send(ServerInstance.getRoomManager().getActiveGame(req.params.room)).status(200));
ServerInstance.getServerInstance().get("/data/spectators/:room", Caching.expires.jsonCallback, (req: Request, res: Response) => res.send(ServerInstance.getRoomManager().getSpectators(req.params.room)).status(200));

/**
 * Load a list of available challenge decks to start right away
 */
InitDecklistRoutes();
InitFaviconRoutes();
InitTournamentsEndpoints();
InitBlogEndpoints();
InitFeedbackEndpoint();

ServerInstance.getServerInstance().get("/data/samplerooms", Caching.cache.jsonCallback, (_req: Request, res: Response) => res.json(ServerInstance.getSampleRooms()).status(200));
ServerInstance.getServerInstance().get("/data/samplenames", Caching.cache.jsonCallback6hrs, (_req: Request, res: Response) => res.send(ServerInstance.getSampleNames()).status(200));
ServerInstance.getServerInstance().post("/data/hash", (req: Request, res: Response) =>
{
    const data = req.body.value;
    if (typeof data !== "string" || data === "")
    {
        res.status(500).send("");
        return;
    }
    
    const val = ResultToken.createHash(data);
    if (val === "")
        res.status(500).send("");
    else
        res.status(200).json({
            value: val
        });
});

InitGameLogs();

ServerInstance.getServerInstance().get("/", (_req: Request, res: Response) => {
    res.header("Cache-Control", "no-store");
    res.sendFile(getRootFolder() + "/pages/home.html")
});

/**
 * Init game routing
 */
InitRouting();

process.on('beforeExit', code => 
{
    setTimeout(() => {
        Logger.info(`Process will exit with code: ${code}`)
        process.exit(code)
    }, 100)
})
  
process.on('exit', code => Logger.info(`Process exited with code: ${code}`));
process.on('uncaughtException', err => {
    console.error("uncaught exception")
    console.error(err);
    Logger.error(err)
});
process.on('unhandledRejection', (err:any, promise) => Logger.warn('Unhandled rejection at ', promise, `reason: ${err.message}`));
  
/**
 * allow CTRL+C
 */
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default function ApplicationStartUp()
{
    ServerInstance.startup();
}


