import * as Authentication from "../authentication";
import { Request, Response } from "express";
import getServerInstance, { ServerInstance, endpointVisitsResult } from "../Server"
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
    const gameCount = ServerInstance.getRoomManager().getGameCount().length;
    const data = { 
        startup: g_sUptime,
        uptime : Date.now() - lUptime,
        games: gameCount,
        autoRestart: autoRestart
    };

    res.header('Content-Type', 'application/json');
    res.header("Cache-Control", "no-store");
    res.send(JSON.stringify(data, null, 3));
};

const onHealth = function(_req:Request, res:Response) 
{
    const jGames = ServerInstance.getRoomManager().getActiveGames();
    const gameCount = ServerInstance.getRoomManager().getGameCount();
    const counters = endpointVisitsResult();

    const visits = {
        deckbuilder : counters.deckbuilder,
        cards : counters.cards,
        converter : counters.converter,
        games: gameCount
    };

    const data = { 

        startup: g_sUptime,

        loadavg : getLoadavg(),
        memory : getMemory(),

        games: jGames,
        count: visits
    };

    res.header('Content-Type', 'application/json');
    res.header("Cache-Control", "no-store");
    res.send(JSON.stringify(data, null, 3));
};

export default function InitRoutingHealth()
{
    getServerInstance().get("/health", Authentication.isSignedInPlay, onHealthSmall);
    getServerInstance().get("/health/full", Authentication.isSignedInPlay, onHealth);
};