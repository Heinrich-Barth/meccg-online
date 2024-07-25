import express, { Request, Response } from "express";

import { isSignedInDeckbuilder } from "../authentication";
import getServerInstance, { Caching, endpointVisitsCount } from "../Server";
import { getRootFolder } from "../Configuration";
import { AddLanguageCookieToRequest } from "../Languags";

interface INavigationEntry {
    url: string,
    label: string,
    blank: boolean
}

interface IDictionary {
    [key:string] : string
}

const navigationEntry = function (url: string, dict:IDictionary, blank: boolean): INavigationEntry {
    return { url: url, label: dict[url], blank: blank };
};

const LabelDictionary_EN:IDictionary = {
    "/play": "Play a game",
    "/deckbuilder": "Deckbuilder",
    "/converter": "Import Deck",
    "/map/regions": "Region Map",
    "/map/underdeeps": "Underdeeps Map",
    "/help": "Learn to play",
    "/about": "About",
}
const LabelDictionary_ES:IDictionary = {
    "/play": "Juega una partida",
    "/deckbuilder": "Construir",
    "/converter": "Importar",
    "/map/regions": "Mapa",
    "/map/underdeeps": "Mapa Profundidade",
    "/help": "Aprende a jugar",
    "/about": "Más información",
}
const LabelDictionary_FR:IDictionary = {
    "/play": "Jouer un match",
    "/deckbuilder": "Construire",
    "/converter": "Importer",
    "/map/regions": "Carte Map",
    "/map/underdeeps": "Carte de profondeur",
    "/help": "Apprendre à jouer",
    "/about": "Plus d'informations",
}

const getCurrentDictionary = function(req: any) : IDictionary
{
    if (req._language === "es")
        return LabelDictionary_ES;
    else if (req._language === "fr")
        return LabelDictionary_FR;
    else
        return LabelDictionary_EN;
}

const getNavigationJson = function (req: Request, res: Response) {
    const targetList = [];
    const dict = getCurrentDictionary(req);

    targetList.push(navigationEntry("/play", dict, false));
    targetList.push(navigationEntry("/deckbuilder", dict, false));
    targetList.push(navigationEntry("/converter", dict, false));
    targetList.push(navigationEntry("/help", dict, false));
    targetList.push(navigationEntry("/about", dict, false));

    res.status(200).json(targetList);
};

export default function InitNavigation() {
    const instance = getServerInstance();
    if (instance === null)
        return;

    /* Get the navigation */
    instance.get("/data/navigation", AddLanguageCookieToRequest, Caching.expires.jsonCallback, getNavigationJson);
    instance.use("/about", express.static(getRootFolder() + "/pages/about.html", Caching.headerData.generic));
    instance.use("/converter", endpointVisitsCount, express.static(getRootFolder() + "/pages/converter.html", Caching.headerData.generic));
    instance.use("/help", express.static(getRootFolder() + "/pages/help.html", Caching.headerData.generic));
    instance.use("/deckbuilder", isSignedInDeckbuilder, endpointVisitsCount, express.static(getRootFolder() + "/pages/deckbuilder.html", Caching.headerData.generic));
}