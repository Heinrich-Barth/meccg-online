import * as fs from "fs";
import * as path from "path";
import Logger from "../Logger";
import { CardImages } from "./Types";
import { CardImagesMap } from "./ImageList";
import { getRootFolder } from "../Configuration";


const getImageList = function(cards:CardImagesMap):string[]
{
    const list = [];
    for (let key in cards)
    {
        const card:CardImages = cards[key];
        if (card.image?.startsWith("/"))
            list.push(card.image);
        if (card.ImageNameErrataDC?.startsWith("/"))
            list.push(card.ImageNameErrataDC);
    }

    return list;
}


const isFile = function(file:string):boolean
{
    try
    {
        const uri = path.resolve(getRootFolder() + "/public" + file);
        return fs.statSync(uri)?.isFile();
    }
    catch (errIgnore)
    {
        /* file not found */
    }

    return false;
}

const saveFile = function(data:string, file:string):boolean
{
    try
    {
        fs.writeFileSync(file, data);
        return true;
    }
    catch (errIgnore)
    {

    }

    return false;
}

export default function ValidateImages(cards:CardImagesMap)
{
    const candidates = getImageList(cards);
    const notFound = [];

    for (let image of candidates)
    {
        if (!isFile(image.replace("/data/", "/")))
            notFound.push(image);
    }

    if (notFound.length === 0)
    {
        Logger.info("\t-- all images available");
        return;
    }

    if (saveFile(JSON.stringify(notFound), "./data-local/not-found.json"))
        Logger.warn("\t-- some images are missing. Please check " + "./data-local/not-found.json");
    else
        Logger.warn("\t-- some images are missing:\n" + notFound.join("\n"));
}
