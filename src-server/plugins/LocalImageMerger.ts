import { ICard } from "./Types";
import * as fs from "fs";
import Logger from "../Logger";
import { getRootFolder } from "../Configuration";

const hasLocalCards = function():boolean
{
    try
    {
        const data = fs.statSync(getRootFolder() + "/public/cards/en-remaster");
        return data?.isDirectory() === true;
    }
    catch(errIgnore)
    {
        /** does not exist */
    }

    return false;
}

const fileExists = function(candidateFile:string):boolean
{
    try
    {
        const path = getRootFolder() + "/public/cards" + candidateFile;
        const data = fs.statSync(path);
        return data?.isFile() === true;
    }
    catch(errIgnore)
    {
        /** does not exist */
    }

    return false;
}

const updateLocalImage = function(card:ICard):boolean
{
    if (typeof card.ImageName !== "string" || !card.ImageName.startsWith("https://"))
        return false;

    const pattern = "/en-remaster/";
    const pos = card.ImageName.lastIndexOf(pattern);
    if (pos === -1)
        return false;

    const rawImage = card.ImageName.substring(pos);
    if (!fileExists(rawImage))
        return false;

    card.ImageName = "/cards" + rawImage;
    return true;
}

const updateImages = function(cards:ICard[]):number
{
    let count = 0;
    for (let card of cards)
    {
        if (updateLocalImage(card))
            count++;
    }

    return count;
}

export function replaceImages(list:ICard[]):void
{
    if (!hasLocalCards())
    {
        Logger.info("No local standard cards available");
        return;
    }

    const count = updateImages(list);
    if (count === 0)
        Logger.info("No local images updated.");
    else
        Logger.info("Successfully using " + count + " local image(s)");
}