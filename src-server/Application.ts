import dotenv from "dotenv";
dotenv.config();

import express, { NextFunction, Request, Response } from "express";

/**
 * Load Cards, prepare image lists etc.
 */
import Logger from "./Logger";

import { Caching, ServerInstance, shutdown } from "./Server";
import * as g_pAuthentication from "./authentication";

import { CardDataProvider } from "./plugins/CardDataProvider";
import * as ResultToken from "./game-management/ResultToken";
import InitPWA from "./pwa";
import setupEvents from "./plugins/events";

import InitDecklistRoutes from "./plugins/Decklist"
import InitReleaseNotes from "./releasenotes";
import { InitPersonalisation } from "./Personalisation";
import InitGameLogs from "./game-logs";
import InitNavigation from "./plugins/Navigation";
import InitRouting from "./server/module";
import { getRootFolder } from "./Configuration";
import CreateRobotsTxt from "./robotstxt";
import InitFaviconRoutes from "./plugins/Favicons";
import InitTournamentsEndpoints from "./plugins/TournamentList";
import InitFeedbackEndpoint from "./plugins/FeedbackForm";
import InitRouteDictionary from "./Languags";

ServerInstance.setup();
setupEvents();

/**
 * Create server
 */
InitPWA();
CreateRobotsTxt();
InitRouteDictionary();

ServerInstance.getServerInstance().use(express.static(getRootFolder() + "/public"));
ServerInstance.getServerInstance().use("/dist-client", express.static("dist-client"));

/**
 * Show list of available images. 
 */
ServerInstance.getServerInstance().use("/data", g_pAuthentication.isSignedInPlay);
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
InitFeedbackEndpoint();

/**
  * Check if the deck is valid.
  */
ServerInstance.getServerInstance().post("/data/decks/check", Caching.expires.jsonCallback, function (req: Request, res: Response) 
{
    let bChecked = false;
    let vsUnknown = [];

    /* Prevents DoS. */
    const jData = req.body instanceof Array ? req.body : [];

    const nSize = jData.length;
    for (let i = 0; i < nSize; i++)
    {
        const code = jData[i];
        if (code !== "")
        {
            bChecked = true;
            if (!CardDataProvider.isCardAvailable(code) && !CardDataProvider.isCardAvailableGuessed(code))
                vsUnknown.push(code);
        }
    }
    
    res.status(200).json({
        valid : bChecked && vsUnknown.length === 0,
        codes : vsUnknown
    });
});

ServerInstance.getServerInstance().get("/data/samplerooms", Caching.cache.jsonCallback, (_req: Request, res: Response) => res.json(ServerInstance.getSampleRooms()).status(200));
ServerInstance.getServerInstance().get("/data/samplenames", Caching.expires.jsonCallback, (_req: Request, res: Response) => res.send(ServerInstance.getSampleNames()).status(200));
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

/** load navigation and non-game endpoints */
InitNavigation();

/**
  * Home Page redirects to "/play"
  */
ServerInstance.getServerInstance().get("/", (req: Request, res: Response, next:NextFunction) => {
    res.header("Cache-Control", "no-store");
    if (g_pAuthentication.isSignedIn(req, res, next))
        res.redirect("/play")
    else
        res.redirect("/login")
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


