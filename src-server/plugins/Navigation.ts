import express, { Request, Response } from "express";

import { isSignedInDeckbuilder } from "../authentication";
import getServerInstance, { Caching, endpointVisitsCount } from "../Server";
import { getRootFolder } from "../Configuration";

interface INavigationEntry
{
    url: string,
    label: string,
    blank: boolean
}

const navigationEntry = function(url:string, label:string, blank:boolean):INavigationEntry
{
    return { url: url, label: label, blank: blank };
};


const getNavigationJson = function(_req:Request, res:Response)
{
    const targetList = [];
    targetList.push(navigationEntry("/play", "Play a game", false));
    targetList.push(navigationEntry("/deckbuilder", "Deckbuilder", false));
    targetList.push(navigationEntry("/converter", "Import Deck", false));
    targetList.push(navigationEntry("/map/regions", "Region Map", true));
    targetList.push(navigationEntry("/map/underdeeps", "Underdeeps Map", true));
    targetList.push(navigationEntry("/help", "Learn to play", false));
    targetList.push(navigationEntry("/about", "About", false));

    res.status(200).json(targetList);
};


export default function InitNavigation()
{
    const instance = getServerInstance();
    if (instance === null)
        return;

    /**
     * Get the navigation
     */
    instance.get("/data/navigation", 
        Caching.cache.jsonCallback, 
        getNavigationJson
    );

    instance.use("/about", express.static(getRootFolder() + "/pages/about.html", Caching.headerData.generic));
    instance.use("/converter", endpointVisitsCount, express.static(getRootFolder() + "/pages/converter.html", Caching.headerData.generic));
    instance.use("/help", express.static(getRootFolder() + "/pages/help.html", Caching.headerData.generic));
    instance.use("/deckbuilder", isSignedInDeckbuilder, endpointVisitsCount, express.static(getRootFolder() + "/pages/deckbuilder.html", Caching.headerData.generic));
}