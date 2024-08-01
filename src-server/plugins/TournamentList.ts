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

const rteToStringArray = function(rte:any)
{
    if (rte?.type !== "doc" || rte?.content === undefined)
        return [];

    const result = [];
    for (let p of rte.content)
        result.push(p)

    return result;
}

const processTournamentEntry = function(id:string, json:any)
{
    if (typeof json === "undefined" || json.isactive !== true)
        return null;

    return {
        id: id,
        title: json.title,
        date: json.startDate,
        table: json.table,
        introduction: json.introduction,
        description: rteToStringArray(json.description),
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

const sendList = function(_req:Request, res:Response)  {
    res.status(200).json(DATA.names);
}

const sendById = function(req:Request, res:Response)  {
    const id = req.params.id;
    if (typeof id === "string" && id !== "" && DATA.entries[id])
        res.status(200).json(DATA.entries[id]);
    else
        res.status(404).json({ message: "entry not found."});
}


export default function InitTournamentsEndpoints() {

    if (token !== "")
        getServerInstance().use("/data/tournaments", fetchTournaments);

    getServerInstance().get("/data/tournaments", sendList);
    getServerInstance().get("/data/tournaments/:id", sendById);
}