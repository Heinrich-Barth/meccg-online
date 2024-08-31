import * as fs from "fs";
import { Request, Response } from "express";
import { Caching, ServerInstance } from "./Server";
import { getRootFolder } from "./Configuration";

const loadFile = function():string
{
    try
    {
        const file = getRootFolder() + "/RELEASENOTES.MD";
        if (!fs.existsSync(file))
            return "";

        const data = fs.readFileSync(file, "utf-8");
        if (data === null || data === "")
            return "";
        
        const pattern = "| --- | --- |";
        const pos = data.indexOf("| --- | --- |");
        if (pos == -1)
            return "";

        return data.substring(pos + pattern.length).trim();        
    }
    catch (errIgnore)
    {

    }

    return "";
}

const splitCells = function(row:string):any
{
    const cells = row.substring(1, row.length - 1).trim().split("|")
    if (cells.length > 1)
        return cells[1].trim();

    return "";
}

const loadRows = function(data:string):any[]
{
    if (data === "")
        return [];

    const list = []

    for (let row of data.split("\n"))
    {
        if (row.indexOf("|") === -1)
            continue;

        const text = splitCells(row);
        if (text !== "")
            list.push(text)
    }

    return list;
}

const listRows = loadRows(loadFile());
const sendRows = function(_req:Request, res:Response)
{
    res.status(200).json(listRows)
}

export default function InitReleaseNotes()
{
    ServerInstance.getServerInstance().get("/data/releasenotes", Caching.cache.jsonCallback6hrs, sendRows);
} 
