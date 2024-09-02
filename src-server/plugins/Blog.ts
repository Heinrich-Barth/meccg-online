import getServerInstance, { ServerInstance } from "../Server";
import { Request, Response, NextFunction } from "express";
import { ActiveGameData } from "../game-management/RoomManager";

const token = typeof process.env.SPACE_TOKEN === "string" ? process.env.SPACE_TOKEN : "";
const url = `${process.env.SPACE_URL}?version=published&token=${token}`;
const tournament_url=url + "&per_page=25&content_type=Blog&sort_by=created_at:desc";

const CACHE_HOURS = 1000 * 60 * 10; // 10min
let CACHE_EXPIRES = 0;

type EntryData = {
    name: string;
    created_at: string;
    uuid: string;
    content: {
        title: string;
        summary: string;
        text: any;
        releasenote: boolean;
    }
}

type StoryData = {
    id: string;
    title: string;
    date: number;
    summary: string;
    description: string;
    releasenote:boolean;
}

let DATA:StoryData[] = [];
let LAST_UPDATE_DATA = 0;

const processJsonResult = function(json:any)
{
    const result:StoryData[] = [];
    const list = json.stories;
    if (list === undefined || list.length === 0)
        return result;

    
    for (let entry of list)
    {
        const time = new Date(entry.created_at).getTime();
        if (LAST_UPDATE_DATA === 0 || LAST_UPDATE_DATA < time)
            LAST_UPDATE_DATA = time;

        const story:EntryData = entry;
        const entry_data = story.content;
        const value:StoryData = {
            id: entry.uuid,
            title: entry_data.title,
            date: time,
            summary: entry_data.summary,
            description: rteToStringArray(entry_data.text),
            releasenote: entry_data.releasenote === true
        };

        result.push(value);
        
    }

    return result;
}

const rteToStringArray = function(rte:any)
{
    if (rte?.type !== "doc" || rte?.content === undefined)
        return "";

    const result = [];
    for (let p of rte.content)
    {
        if (typeof p.text === "string" && p.text !== "")
            result.push(p.text);
    }
        
    return result.join("\n");
}

const cacheData = function(json:StoryData[])
{
    CACHE_EXPIRES = Date.now() + CACHE_HOURS;
    DATA = json;
}

const cacheExpired = function()
{
    return CACHE_EXPIRES < Date.now();
}

const fetchBlogs = function(_req:Request, _res:Response, next:NextFunction)
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

const createRssEntryItemId = function(text:string)
{
    return `<guid isPermaLink="false">${text.replace(/&/g, "&amp;")}</guid>`
}
const createRssEntryItem = function(node:string, text:string)
{

    return `<${node}>${text.replace(/&/g, "&amp;")}</${node}>`
}

const parseDateString = function(input:string)
{
    const pos = input.indexOf("GMT");
    return pos === -1 ? input : input.substring(0, pos + 3);
}

const createRssEntry = function(entry:StoryData)
{
    const list:string[] = ["<item>"];

    list.push(createRssEntryItemId(entry.id))
    list.push(createRssEntryItem("pubDate", printGMTDate(entry.date)))
    list.push(createRssEntryItem("title", entry.title))

    if (entry.description === "")
        list.push(createRssEntryItem("description", entry.summary));
    else   
        list.push(createRssEntryItem("description", entry.summary + "\n" + entry.description));

    list.push(createRssEntryItem("category", entry.releasenote ? "Release Note" : "Blog"));

    list.push("</item>");
    return list.join("\n");
}

const printGMTDate = function(date1:number, date2?:number)
{
    if (date2 !== undefined && date2 > date1)
        date1 = date2;

    const s = new Date(date1).toUTCString();
    const pos = s.indexOf("GMT");
    return pos === -1 ? s : s.substring(0,pos+3);
}

const sendCurrentGames = function(res:Response, list:ActiveGameData[])
{
    if (list.length === 0)
        return;

    for (let game of list)
    {
        if (game.single)
            continue;

        const players:string[] = []
        for (let player of game.players)
            players.push(player.name)
        
        const time = new Date(game.created).getTime();

        const list:string[] = ["<item>"];
        list.push(createRssEntryItem("guid", game.id))
        list.push(createRssEntryItem("pubDate", printGMTDate(time)));

        if (game.arda)
            list.push(createRssEntryItem("title", "Arda game @ " + game.room.toUpperCase()));
        else
            list.push(createRssEntryItem("title", "Game @ " + game.room.toUpperCase()));

        if (game.accessible && game.visitors)
            list.push(createRssEntryItem("description", "You can join " + players.join(",") + " to play or watch"));
        else if (game.visitors)
            list.push(createRssEntryItem("description", "Watch " + players.join(",") + " playing their game."));

        if (process.env.PLATFORMURL)
        {
            if (game.accessible)
                list.push(createRssEntryItem("link", process.env.PLATFORMURL + "/watch/" + game.room ));
            else 
                list.push(createRssEntryItem("link", process.env.PLATFORMURL));
        }

        list.push("</item>");
        res.write(list.join(""));
    }
}

const getLatestGameTime = function(list:ActiveGameData[])
{
    if (list.length === 0)
        return -1;

    let latesetTime = 0;

    for (let game of list)
    {
        if (game.single)
            continue;

        const time = new Date(game.created).getTime();
        if (latesetTime === 0 || latesetTime < time)
            latesetTime = time;
    }

    return latesetTime;
}
const sendList = function(_req:Request, res:Response)  {
    const RSS_OPEN = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
    <title>Latest News</title>
    <description>Read all latest updates on the platform</description>
    <language>en-US</language>`;

    res.status(200);

    res.write(RSS_OPEN);

    if (process.env.PLATFORMURL)
    {
        res.write(`<atom:link href="${process.env.PLATFORMURL}/data/rss" rel="self" type="application/rss+xml" />`);
        res.write(createRssEntryItem("link", process.env.PLATFORMURL));
    }

    const games = ServerInstance.getRoomManager().getActiveGames();
    const time = getLatestGameTime(games);
    res.write("<lastBuildDate>" + printGMTDate(time, LAST_UPDATE_DATA) + "</lastBuildDate>")

    sendCurrentGames(res, games);
    for (let entry of DATA)
        res.write(createRssEntry(entry))

    if (time > LAST_UPDATE_DATA)
        LAST_UPDATE_DATA = time;

    res.write("</channel></rss>");
    res.end();
}

export default function InitBlogEndpoints() {

    if (token !== "")
        getServerInstance().use("/data/rss", fetchBlogs);

    getServerInstance().get("/data/rss", sendList);
}