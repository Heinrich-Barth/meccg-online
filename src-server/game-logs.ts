import * as fs from "fs";
import Logger from "./Logger";
import express, { Request, Response } from "express";
import { ServerInstance } from "./Server";

let _timeLogs = 0;
let _listLogs:string[] = [];

const useCache = function():boolean
{
    return Date.now() - _timeLogs < 1000 * 60;
}

const getLogs = function():any[]
{
    if (!useCache())
        updateLogs();
    
    return _listLogs;
}

const updateLogs = function()
{
    fs.readdir("logs", (err, files) => 
    {
        if (err)
        {
            Logger.error(err);
            return;
        }

        let list:string[] = [];
        files.forEach(file => 
        {
            if (file.endsWith(".txt"))
                list.push(file);
        });
        
        _timeLogs = Date.now();
        _listLogs = list;
    });
}


updateLogs();

export default function InitGameLogs()
{
    ServerInstance.getServerInstance().use("/logs", express.static("logs"));
    ServerInstance.getServerInstance().get("/games/history", (_req:Request, res:Response) => res.status(200).json(getLogs()));
}
