import Logger from "../Logger";
import CookiePreferences from "./CookiePreferences";
import getServerInstance, { Caching } from "../Server";
import GamePlayRouteHandler from "./GamePlayRouteHandler";
import GamePlayRouteHandlerArda from "./GamePlayRouteHandlerArda";
import GamePlayRouteHandlerSingle from "./GamePlayRouteHandlerSingle";
import express from "express";
import { getRootFolder } from "../Configuration";
import { AddLanguageCookieToRequest } from "../Languags";

const pCookiePreferences = new CookiePreferences("game");
pCookiePreferences.addPreference("background", "bg-game");

export default function InitRoutingPlay()
{
    getServerInstance().use("/play", AddLanguageCookieToRequest);

    new GamePlayRouteHandler("/play", "login.html", "lobby.html").setupRoutes();
    new GamePlayRouteHandlerArda("/arda", "login-arda.html", "lobby.html").setupRoutes();
    new GamePlayRouteHandlerSingle("/singleplayer", "login.html", "home.html").setupRoutes();

    getServerInstance().use("/data-client", express.static(getRootFolder() + "/data-client", { maxAge: '5h' }));
    getServerInstance().get("/data/preferences/game", Caching.expires.jsonCallback, (req, res) => res.send(pCookiePreferences.get(req.cookies)).status(200));
    getServerInstance().post("/data/preferences/game", (req, res) =>  { 
        pCookiePreferences.update(req, res);
        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });

    getServerInstance().post("/data/preferences/dice", (req, res) =>  { 
        try
        {
            const jData = req.body;
            const value = jData.value;
            if (value !== undefined && value !== "" && value.length < 20 && value.indexOf(".") === -1 && value.indexOf("\"") === -1)
                res.cookie("dice", value);
        }
        catch (e)
        {
            Logger.error(e);
        }

        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });
};