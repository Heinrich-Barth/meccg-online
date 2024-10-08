import getServerInstance, { ServerInstance } from "../Server";
import { Request, Response, NextFunction } from "express";
import { ActiveGameData } from "../game-management/RoomManager";
import * as Authentication from "../Authentication";
import * as fs from "fs";
import { getRootFolder } from "../Configuration";

const token = typeof process.env.SPACE_TOKEN === "string" ? process.env.SPACE_TOKEN : "";
const STORY_URL = `${process.env.SPACE_URL}?version=published&token=${token}`;

const CACHE_FILE_JSON = getRootFolder() + "/data-local/blog.json";
const CACHE_FILE_RSS = getRootFolder() + "/data-local/blog.xml";

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
    releasenote: boolean;
}

let LAST_UPDATE_DATA = 0;
let LATEST_STORY = 0;

const createCacheFiles = async function (list: StoryData[], rss: string) {
    try {
        if (list.length > 100)
            list = list.slice(0, 100);

        fs.writeFileSync(CACHE_FILE_JSON, JSON.stringify(list));
        fs.writeFileSync(CACHE_FILE_RSS, rss);
    }
    catch (err) {
        console.warn(err);
    }
}

const processJsonResult = function (json: any) {
    const result: StoryData[] = [];
    const list = json.stories;
    if (list === undefined || list.length === 0)
        return result;

    for (let entry of list) {
        const time = new Date(entry.created_at).getTime();
        if (LAST_UPDATE_DATA === 0 || LAST_UPDATE_DATA < time)
            LAST_UPDATE_DATA = time;

        const story: EntryData = entry;
        const entry_data = story.content;
        const value: StoryData = {
            id: entry.uuid,
            title: entry_data.title,
            date: time,
            summary: entry_data.summary,
            description: rteToStringArray(entry_data.text),
            releasenote: entry_data.releasenote === true
        };

        result.push(value);
    }

    return result.sort((a, b) => b.date - a.date);
}

const rteToStringArray = function (rte: any) {
    if (rte?.type !== "doc" || rte?.content === undefined)
        return "";

    const result = [];
    for (let p of rte.content) {
        if (typeof p.text === "string" && p.text !== "")
            result.push(p.text);
    }

    return result.join("\n");
}

const hasNewStories = function (json: StoryData[]) {
    if (json.length === 0)
        return false;

    let oldest = 0;
    for (let elem of json) {
        if (elem.date > oldest)
            oldest = elem.date;
    }

    if (LATEST_STORY === oldest)
        return false;

    LATEST_STORY = oldest;
    return true;
}

const cacheData = function (json: StoryData[]) {
    
    CACHE_EXPIRES = Date.now() + CACHE_HOURS;

    if (hasNewStories(json)) {
        createCacheFiles(json, createRssFeed(json));
        console.info("Updating caches");
    }
}

const cacheExpired = function () {
    return CACHE_EXPIRES < Date.now();
}

const fetchBlogs = function (_req: Request, _res: Response, next: NextFunction) {
    
    if (!cacheExpired()) {
        next();
        return;
    }

    fetch(STORY_URL + "&per_page=25&content_type=Blog&sort_by=created_at:desc")
        .then(data => data.json())
        .then(processJsonResult)
        .then(cacheData)
        .catch(console.error)
        .finally(() => next());
}

const createRssEntryItemId = function (text: string) {
    return `<guid isPermaLink="false">${text.replace(/&/g, "&amp;").trim()}</guid>`
}
const createRssEntryItem = function (node: string, text: string) {

    return `<${node}>${text.replace(/&/g, "&amp;").trim()}</${node}>`
}

const createRssEntry = function (entry: StoryData) {
    const list: string[] = ["<item>"];

    list.push(createRssEntryItemId(entry.id))
    list.push(createRssEntryItem("pubDate", printGMTDate(entry.date)))
    list.push(createRssEntryItem("title", entry.title))

    if (entry.description === "")
        list.push(createRssEntryItem("description", entry.summary));
    else
        list.push(createRssEntryItem("description", entry.summary + "\n" + entry.description));

    list.push(createRssEntryItem("category", entry.releasenote ? "Release Note" : "Blog"));
    list.push(createRssEntryItem("link", process.env.PLATFORMURL + "/blog/" + entry.id));
    list.push("</item>");
    return list.join("\n");
}

const printGMTDate = function (date1: number, date2?: number) {
    if (date2 !== undefined && date2 > date1)
        date1 = date2;

    const s = new Date(date1).toUTCString();
    const pos = s.indexOf("GMT");
    return pos === -1 ? s : s.substring(0, pos + 3);
}

const createRssFeedGamesSection = function (list:ActiveGameData[]) 
{
    if (list.length === 0)
        return []

    const rss:string[] = [];
    for (let game of list) {
        if (game.single)
            continue;

        const players: string[] = []
        for (let player of game.players)
            players.push(player.name)

        const time = new Date(game.created).getTime();

        rss.push("<item>");
        rss.push(createRssEntryItemId(game.id));
        rss.push(createRssEntryItem("pubDate", printGMTDate(time)));

        if (game.arda)
            rss.push(createRssEntryItem("title", "Arda game @ " + game.room.toUpperCase()));
        else
            rss.push(createRssEntryItem("title", "Game @ " + game.room.toUpperCase()));

        if (game.accessible && game.visitors)
            rss.push(createRssEntryItem("description", "You can join " + players.join(",") + " to play or watch"));
        else if (game.visitors)
            rss.push(createRssEntryItem("description", "Watch " + players.join(",") + " playing their game."));
        else
            rss.push(createRssEntryItem("description", "This game is private, but you can start your own game in a matter of seconds."));

        if (process.env.PLATFORMURL) {
            if (game.visitors)
                rss.push(createRssEntryItem("link", process.env.PLATFORMURL + "/watch/" + game.room));
            else if (game.arda && game.accessible)
                rss.push(createRssEntryItem("link", process.env.PLATFORMURL + "/join/" + game.room));
            else
                rss.push(createRssEntryItem("link", process.env.PLATFORMURL));
        }

        rss.push("</item>");
    }

    return rss;
}

const createRssFeed = function (DATA: StoryData[]) {
    const res: string[] = [
        `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Latest News</title>
<description>Read all latest updates on the platform</description><language>en-US</language>`];

    if (process.env.PLATFORMURL) {
        res.push(`<atom:link href="${process.env.PLATFORMURL}/data/rss" rel="self" type="application/rss+xml" />`);
        res.push(createRssEntryItem("link", process.env.PLATFORMURL));
    }
    
    for (let entry of DATA)
        res.push(createRssEntry(entry))

    res.push("</channel></rss>");
    return res.join("");
}

const redirectHome = function (req: Request, res: Response) {
    res.header("Cache-Control", "no-store");

    if (req.params.id)
        res.redirect("/#/blog/" + req.params.id);
    else
        res.redirect("/#/blog");
}

const sendJson = (_req: Request, res: Response) => res.sendFile(CACHE_FILE_JSON);
const sendRSS = (_req: Request, res: Response) => res.sendFile(CACHE_FILE_RSS);

const sendRSSGames = function(_req: Request, res: Response)
{
    res.header("Content-Type", "application/xml");
    res.status(200);
    res.write(`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Latest Games</title>
<description>Read all latest games on the platform</description><language>en-US</language>
<item>
<guid isPermaLink="false">6e313c08-86a8-4a87-b773-4ce528b53acf</guid>
<pubDate>Wed, 03 Sep 2024 12:00:00 GMT</pubDate>
<title>Game @ OLDGREATROAD</title>
<description>This game is private, but you can start your own game in a matter of seconds.</description>
</item>`);
    const games = ServerInstance.getRoomManager().getActiveGames();
    const list = createRssFeedGamesSection(games);

    if (list.length > 0)
        res.write(list.join(""));

    res.write("</channel></rss>");
    res.end();
}

export default function InitBlogEndpoints() {

    createCacheFiles([], "");

    if (token !== "") {
        getServerInstance().use("/data/rss", fetchBlogs);
        getServerInstance().use("/data/blog", fetchBlogs);
    }

    getServerInstance().get("/data/rss", sendRSS);
    getServerInstance().get("/data/rss/games", sendRSSGames);
    getServerInstance().get("/data/blog", sendJson);
    
    getServerInstance().get("/blog", Authentication.signInFromPWA, redirectHome);
    getServerInstance().get("/blog/:id", Authentication.signInFromPWA, redirectHome);
}
