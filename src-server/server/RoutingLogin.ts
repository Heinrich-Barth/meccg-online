import { Request, Response } from "express";
import Logger from "../Logger";
import * as g_pAuthentication from "../authentication";
import { ServerInstance } from "../Server";

const getRefererPath = function(url:string)
{
    try
    {
        let pos = url === undefined || url === "" || url === null ? -1 :  url.indexOf("//");
        if (pos === -1)
            throw new Error("Invalid URL");
    
        pos = url.indexOf("/", pos + 3);
        const parts = pos === -1 ? [] : url.substring(pos+1).split("/");
        if (parts.length < 2)
            return "";

        if (parts[0] !== "play" && parts[0] !== "arda")
            return "";

        const room = parts[1].trim();
        const watch = parts.length === 3 ? parts[2].trim() : "";

        if (room === "")
            return "";
        else if (watch === "")
            return "/" + parts[0] + "/" + room;
        else
            return "/" + parts[0] + "/" + room + "/" + watch;
    }
    catch(err)
    {
        Logger.warn(err);
    }

    return "";
};

const OnLoginPost = function(req: Request, res: Response)
{
    if (!g_pAuthentication.signIn(req, res))
    {
        res.redirect("/login");
        return;
    }

    const url = getRefererPath(req.headers.referer ?? "");
    if (url === "")
        res.redirect("/");
    else
        res.redirect(url);
}

const OnLoginGet = (req: Request, res: Response) => g_pAuthentication.showLoginPage(req, res);

export default function InitRoutingLogin()
{
    ServerInstance.getServerInstance().get("/login", OnLoginGet);
    ServerInstance.getServerInstance().post("/login", OnLoginPost);
}

