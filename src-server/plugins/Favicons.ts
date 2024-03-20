
import * as fs from "fs";
import { NextFunction, Request, Response } from "express";
import { getRootFolder } from "../Configuration";
import getServerInstance, { Caching } from "../Server";
import Logger from "../Logger";

const getFiles = function() : any
{
    const dir = getRootFolder() + "/public/favicons";
    const result:any = { };
    try
    {
        if (!fs.existsSync(dir))
            return result;

        let count = 0;
        const list = fs.readdirSync(dir);
        for (let file of list)
        {
            if (file.endsWith(".webp"))
            {
                result[file.replace(".webp", "")] = "/favicons/" + file;
                count++;
            }
        }

        if (count > 0)
            Logger.info(count + " favicon(s) available");
    }
    catch(errIgnore)
    {

    }

    return result;
}

const MapFavicons = getFiles();

function getFavicon(name:string)
{
    if (typeof name !== "string" || name === "" || !MapFavicons.hasOwnProperty(name))
        return "";
    
    const val = MapFavicons[name];
    return typeof val === "string" ? val : "";
        
}

const OnFavicon = function(req:Request, res:Response, next: NextFunction)
{
    const icon = getFavicon(req.params.id?.toLowerCase());
    if (icon !== "")
        res.redirect(icon);
    else
        next();
}

const OnRedirectDefault = function(_req:Request, res:Response)
{
    res.redirect("/media/assets/favicon.png");
}

export default function InitFaviconRoutes() 
{
    getServerInstance().get("/data/favicon/:id", Caching.cache.cache6hrsOnly, OnFavicon, OnRedirectDefault);
    getServerInstance().get("/favicon.ico", Caching.cache.cache6hrsOnly, OnRedirectDefault);
}