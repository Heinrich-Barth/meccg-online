import { NextFunction, Request, Response } from "express";
import { ServerInstance } from "./Server";

const getUserList = function()
{
    const data = process.env.USERNAMES;
    if (typeof data !== "string" || data === "")
        return [];
    else 
        return data.toLowerCase().split(" ");
}

const loginlist = getUserList();

const jSecure = { maxAge: 24 * 60 * 60 * 1000 * 365, httpOnly: process.env.NODE_ENV === "production", secure: process.env.NODE_ENV === "production" };

function send204Cookie(res:Response)
{
    res.cookie('signedin', "true", jSecure);
    res.status(204).send("");
}

function performLogn(req:Request, res:Response)
{
    if (loginlist.length === 0)
    {
        send204Cookie(res);
        return;
    }

    const val = req.body.data;
    if (typeof val !== "string" || !loginlist.includes(val))
        res.status(403).json({ message: "you shall not pass"});
    else
        send204Cookie(res);
}

function isSignedIn(req:Request, res:Response)
{
    if (hasSession(req))
        res.status(204).send("")
    else if (loginlist.length === 0)
        send204Cookie(res);
    else
        res.status(403).json({ message: "Not authenticated "});
}

function onPWALogin(_req:Request, res:Response)
{
    res.cookie('signedin', "true", jSecure);
    res.redirect("/");
}

export default function InitAuthencation()
{
    ServerInstance.getServerInstance().get("/authentication", isSignedIn);
    ServerInstance.getServerInstance().post("/authentication", performLogn);
    ServerInstance.getServerInstance().get("/pwa", onPWALogin);
}

export function signInFromPWA(_req:Request, res:Response, next:NextFunction)
{
    res.cookie('signedin', "true", jSecure);
    next();
}

export function signInFromTransfer(_req:Request, res:Response, next:NextFunction)
{
    
}

function hasSession(req:Request)
{
    return loginlist.length === 0 || req.cookies.signedin !== undefined;
}
