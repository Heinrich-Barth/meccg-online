import express, { Request, Response } from "express";
import getServerInstance, { Caching } from "../Server";
import { getRootFolder } from "../Configuration";


export default function InitRoutingGelerals()
{
    /**
     * This is a blank (black) page. Necessary for in-game default page
     */
    getServerInstance().use("/blank", express.static(getRootFolder() + "/pages/blank.html", Caching.headerData.generic));

    /**
     * Simple PING
     */
    getServerInstance().get("/ping", Caching.expires.generic, (_req:Request, res:Response) => res.send("" + Date.now()).status(200));

    getServerInstance().post("/csp-violation", (_req:Request, res:Response) => res.status(204).end());
}
