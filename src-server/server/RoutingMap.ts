import CookiePreferences from "./CookiePreferences";
import Logger from "../Logger";
import { CardDataProvider } from "../plugins/CardDataProvider";
import express, { Request, Response } from "express";
import { Caching, ServerInstance } from "../Server";
import { getRootFolder } from "../Configuration";
import GamePlayRouteHandlerUtil from "./GamePlayRouteHandlerUtil";

const onGetTappedSites = function(req:Request, res:Response)
{
    res.send(getTappedSites(req.cookies)).status(200);
}

const getTappedSites = function(cookies:any)
{
    try
    {
        if (typeof cookies?.room === "string" && typeof cookies?.userId === "string")
            return ServerInstance.getRoomManager().getTappedSites(cookies.room, cookies.userId);
    }
    catch(e)
    {
        Logger.error(e);
    }

    return { };
};

class MapCookiePreferences extends CookiePreferences
{
    sanatizeValue(val:any)
    {
        return val === true;
    }
}

const g_sPageMapRegions = GamePlayRouteHandlerUtil.readFile(getRootFolder() + "/pages/map-regions.html");
const g_sPageMapUnderdeeps = GamePlayRouteHandlerUtil.readFile(getRootFolder() + "/pages/map-underdeeps.html");

const pCookiePreferences = new MapCookiePreferences();
pCookiePreferences.addPreference("hero", true);
pCookiePreferences.addPreference("minion", true);
pCookiePreferences.addPreference("fallenwizard", true);
pCookiePreferences.addPreference("balrog", true);
pCookiePreferences.addPreference("elf", true);
pCookiePreferences.addPreference("dwarf", true);
pCookiePreferences.addPreference("lord", true);
pCookiePreferences.addPreference("fallenlord", true);
pCookiePreferences.addPreference("dragon", false);
pCookiePreferences.addPreference("dreamcards", true);

const sendHtmlPage = function(res:Response, html:string)
{
    Caching.expires.withResultType(res, "text/html");
    res.status(200).send(html);
}

const sendHtmlRegions = function(_req:Request, res:Response)
{
    sendHtmlPage(res, g_sPageMapRegions);
}

const sendHtmlUnderdeeps = function(_req:Request, res:Response)
{
    sendHtmlPage(res, g_sPageMapUnderdeeps);
}

export default function InitRoutingMap()
{
    /* Map images should be cached */
    ServerInstance.getServerInstance().use("/media/map-black-tile", express.static(getRootFolder() + "/public/media/map-tile.jpg", Caching.headerData.generic));

    /**
     * Show Map Pages
     */
    ServerInstance.getServerInstance().get("/map/underdeeps", sendHtmlUnderdeeps);
    ServerInstance.getServerInstance().get("/map/regions", sendHtmlRegions);
    ServerInstance.getServerInstance().use("/map/regions/edit", express.static(getRootFolder() + "/pages/map-regions-marking.html"));
    
    /**
     * Provide the map data with all regions and sites for the map windows
     */
    ServerInstance.getServerInstance().get("/data/list/map", Caching.cache.jsonCallback6hrs, (_req:Request, res:Response) => res.send(CardDataProvider.getMapdata()).status(200));
    ServerInstance.getServerInstance().get("/data/list/underdeeps", Caching.cache.jsonCallback6hrs, (_req:Request, res:Response) => res.send(CardDataProvider.getUnderdeepMapdata()).status(200));

    ServerInstance.getServerInstance().get("/data/preferences/map", Caching.expires.jsonCallback, (req:Request, res:Response) => res.send(pCookiePreferences.get(req.cookies)).status(200));
    ServerInstance.getServerInstance().post("/data/preferences/map", (req:Request, res:Response) =>  {
        pCookiePreferences.update(req, res); 
        res.status(204).end();
    });

    /**
     * Get a list of tapped sites. This endpoint requiers cookie information. If these are not available,
     * the endpoint returns an empty map object.
     */
    ServerInstance.getServerInstance().get("/data/list/sites-tapped", Caching.expires.jsonCallback, onGetTappedSites);
   
};