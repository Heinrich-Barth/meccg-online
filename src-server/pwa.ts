import * as fs from "fs";
import express, { Request, Response } from "express";
import { isSignedInPWA, signInFromPWA } from "./authentication";
import getServerInstance, { Caching } from "./Server";
import { getRootFolder } from "./Configuration";
import Logger from "./Logger";

const onPwaRunning = function(req:Request, res:Response)
{
    const data = {
        pwa: isSignedInPWA(req)
    };

    res.status(200).json(data);
}

export default function InitPWA()
{
    if (fs.existsSync(getRootFolder() + "/public/pwa"))
    {
        getServerInstance().get("/pwa/running", Caching.expires.jsonCallback, onPwaRunning);
        getServerInstance().get("/pwa", signInFromPWA, (_req:Request, res:Response) => res.redirect("/pwa/app.html"));
        getServerInstance().use("/serviceWorker.js", express.static(getRootFolder() + "/public/pwa/serviceWorker.js"));
        
        Logger.info("PWA support added");
    }
    else
        Logger.info("No PWA supported");
}