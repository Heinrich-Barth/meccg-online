import getServerInstance from "../Server";
import { Request, Response, NextFunction } from "express";

const token = typeof process.env.SPACE_TOKEN === "string" ? process.env.SPACE_TOKEN : "";
const url = `${process.env.SPACE_URL}?version=published&token=${token}`;
const tournament_url=url + "&per_page=25&content_type=meccg_tournament_entry"; //%3Adesc";

interface IData {
    names: any[];
    entries: any;
}

const DATA:IData = { 
    names: [],
    entries: { }
};


const CACHE_HOURS = 1000 * 60 * 60; // 1hr
let CACHE_EXPIRES = 0;

const processJsonResult = function(json:any)
{
    const result:IData = {
        names: [],
        entries: { }
    };

    const list = json.stories;
    if (list === undefined || list.length === 0)
        return result;

    for (let entry of list)
    {
        const entry_data = entry.content;
        const id = "t" + entry.id;
        const value = processTournamentEntry(id, entry_data);

        if (value !== null)
        {
            result.names.push({
                id: id,
                title: value.title
            });
            result.entries[value.id] = value;
        }
    }

    return result;
}

const processParticipants = function(textarea:string)
{
    if (typeof textarea !== "string" || textarea === "")
        return [];

    const list:string[] = [];
    for (let line of textarea.trim().split("\n"))
    {
        if (line.trim() !== "")
            list.push(line.trim());
    }

    return list;
}

const getRteTexts = function(level:any)
{
    if (typeof level?.content === "undefined" || !Array.isArray(level.content) || level.content.length === 0)
        return [];

    const list = [];
    for (let entry of level.content)
    {
        const text = entry.text;
        if (typeof text === "string" && text !== "")
            list.push(text);
    }

    return list;
}

const rteToStringArray = function(rte:any)
{
    if (rte?.type !== "doc" || rte?.content === undefined)
        return [];

    const result = [];
    for (let p of rte.content)
    {
        const isHeading = p.type !== "paragraph" && p.type !== "bullet_list";
        const isList = p.type === "bullet_list";
        if (!isList)
        {
            result.push({
                headline: isHeading,
                list: [],
                texts: getRteTexts(p)
            })
        }
        else {
            result.push({
                headline: false,
                list: processListItems(p.content),
                texts: []
            })
        }
    }

    return result;
}

const processListItems = function(bulletList:any)
{
    if (typeof bulletList === "undefined" || !Array.isArray(bulletList) || bulletList.length === 0)
        return [];

    const result = []
    for (let item of bulletList)
    {
        if (item.content && item.content.length > 0)
        {
            const p = item.content[0];
            if (p.content && p.content.length > 0)
            {
                const value = p.content[0].text;
                if (typeof value === "string" && value !== "")
                    result.push(value);
            }
        }
    }
    return result;
}

const processTournamentEntry = function(id:string, json:any)
{
    if (typeof json === "undefined" || json.isactive !== true)
        return null;

    const title = json.title;
    const date = json.startDate;
    const participants = processParticipants(json.participants);

    return {
        id: id,
        title: title,
        date: date,
        participants: participants,
        description: rteToStringArray(json.description),
        rounds: rteToStringArray(json.rounds),
        results: rteToStringArray(json.results)
    }
}

const cacheData = function(json:IData)
{
    if (json === undefined || !Array.isArray(json.names) || json.names.length === 0)
        return;

    CACHE_EXPIRES = Date.now() + CACHE_HOURS;
    DATA.names = json.names;
    DATA.entries = json.entries;
}

const cacheExpired = function()
{
    return CACHE_EXPIRES < Date.now();
}

const fetchTournaments = function(_req:Request, _res:Response, next:NextFunction)
{
    if (!cacheExpired())
    {
        next();
        return;
    }

    fetch(tournament_url)    
    .then(data => data.json())
    .then(processJsonResult)
    .then(cacheData)
    .catch(console.error)
    .finally(() => next());
}

const sendData = function(_req:Request, res:Response)  {
    res.status(200).json(DATA);
}

export default function InitTournamentsEndpoints() {

    if (token !== "")
        getServerInstance().use("/data/tournaments", fetchTournaments);

    getServerInstance().get("/data/tournaments", sendData);
}