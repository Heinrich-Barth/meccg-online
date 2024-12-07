import { Request, Response } from "express";
import getServerInstance, { ServerInstance } from "../Server"
import { loadavg as getLoadavg } from "os";

const autoRestart = typeof process.env.SERVER_AUTO_RESTART === "string" && process.env.SERVER_AUTO_RESTART !== "";

const lUptime = Date.now();
const g_sUptime = new Date(lUptime).toUTCString();

const getMemory = function()
{
    const data:any = {
        raw: process.memoryUsage(),
        megabytes : { }
    };

    for (let key in data.raw) 
        data.megabytes[key] = (Math.round(data.raw[key] / 1024 / 1024 * 100) / 100);

    return data;
}

const onHealthSmall = function(_req:Request, res:Response)
{
    const uptime = Date.now() - lUptime;
    const sHrs = (uptime / 1000 / 60 / 60).toFixed(2);
    const hrs = parseFloat(sHrs);

    const gameCount = ServerInstance.getRoomManager().getGameCount().length;
    const data = { 
        startup: g_sUptime,
        uptime : uptime,
        uptimeHrs: hrs,
        games: gameCount,
        autoRestart: autoRestart
    };

    res.header('Content-Type', 'application/json');
    res.header("Cache-Control", "no-store");
    res.send(JSON.stringify(data, null, 3));
};

const onHealth = function(_req:Request, res:Response) 
{
    const data = { 

        startup: g_sUptime,

        loadavg : getLoadavg(),
        memory : getMemory(),

        games: ServerInstance.getRoomManager().getActiveGames(),
        count: {
            deckbuilder : 0,
            cards : 0,
            converter : 0,
            games: []
        }
    };

    res.header('Content-Type', 'application/json');
    res.header("Cache-Control", "no-store");
    res.send(JSON.stringify(data, null, 3));
};

export default function InitRoutingHealth()
{
    getServerInstance().get("/data/health", onHealthSmall);
    getServerInstance().get("/data/health/full", onHealth);
};