import * as fs from "fs";
import Logger from "../Logger";
import { CardDataProvider } from "./CardDataProvider";
import getServerInstance, { Caching } from "../Server";
import { Request, Response } from "express";
import { createHash } from "crypto";
import { getRootFolder } from "../Configuration";


type TDeck = {
    deck:string,
    images: {
        [key:string]:string
    }
}

interface TDeckByIdMap {
    [id:string]:TDeck
}

interface IKeyValue {
    [key:string]:string
}

interface TDeckMapNameId extends IKeyValue {

}

type TDeckGroup = {
    name: string,
    decks: TDeckMapNameId,
    meta: IKeyValue
}

const g_vpDedckList:TDeckGroup[] = [];
const g_pDeckById:TDeckByIdMap = { };

let g_lId = 0;

/**
 * Replace the givne prefix from a name
 * @param {String} name 
 * @param {String} sPrefix 
 * @returns 
 */
const stripPrefix = function(name:string, sPrefix:string) :string
{
    return name === "" || sPrefix === "" ? name : name.replace(sPrefix, "");
};

/**
 * Remove the file type
 * @param {String} file 
 * @returns file name
 */
const replaceType = function(file:string)
{
    let nPos = file.lastIndexOf(".");
    return nPos < 1 ? file : file.substring(0, nPos);
};

/**
 * Load all files in a given directory
 * @param {String} sDirectory 
 * @param {Object} _fs 
 * @returns Array of file names
 */
const getFileList = function(sDirectory:string):string[]
{
    try
    {
        const _list:string[] = [];
        const files = fs.readdirSync(sDirectory);
        if (files)
            files.forEach(file => _list.push(file));

        return _list;
    }
    catch(err)
    {
        Logger.warn("Could not read file list of directory " + sDirectory);
        Logger.error(err);
    }

    return [];
}

/**
 * Create decks from files in given directory
 * @param {Object} _fs 
 * @param {Array} _list 
 * @param {String} sDirectory 
 * @param {String} sReplacePrefix 
 * @returns JSON
 */
const createDecks = function(_list:string[], sDirectory:string, sReplacePrefix:string) : TDeckMapNameId
{
    const decks:TDeckMapNameId = { };
    for (let file of _list)
    {
        try
        {
            const content = fs.readFileSync(sDirectory + file, 'utf8');

            if (typeof content === "string" && content.indexOf("#") !== -1)
            {
                const name = stripPrefix(replaceType(file), sReplacePrefix).trim();
                const hash = createHash('sha256').update(content, 'utf8').digest('hex');
                const deckid = hash;
                decks[name] = deckid;
            
                g_pDeckById[deckid] = {
                    deck: content,
                    images: { }
                };

                g_lId++;
            }
        }
        catch (err:any)
        {
            Logger.warn("Could not read deck file " + sDirectory + file);
            Logger.warn(err.message);
        }
    }
    
    return decks;
}

/**
 * Load a deck
 * @param {Array} list 
 * @param {String} name 
 * @param {Object} _data 
 */
const load0 = function(name:string, _data:TDeckMapNameId)
{
    g_vpDedckList.push({
        name: name,
        decks : _data,
        meta: { }
    });
}



const saveDeckMetadata = function(id:string, meta:any)
{
    for (let data of g_vpDedckList)
    {
        for (let key in data.decks)
        {
            if (data.decks[key] === id)
            {
                data.meta[id] = meta;
                return;
            }
        }
    }
}
 
/**
 * Obtain all decks in a given directory.
 * @param {String} sDirectory 
 * @param {String} sReplacePrefix 
 * @returns Array of decks
 */
const getDecks = function (sDirectory:string, sReplacePrefix:string = "") : TDeckMapNameId
{
    if (sDirectory === undefined || sDirectory === "")
        return {};

    if (!sDirectory.endsWith("/"))
        sDirectory += "/";

    if (sReplacePrefix === undefined)
        sReplacePrefix = "";
    
    const _list = getFileList(sDirectory);
    return createDecks(_list, sDirectory, sReplacePrefix);
};


const loadDeckList = function(sDir:string)
{
    try
    {
        const folders = fs.readdirSync(sDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
        for (let folder of folders)
        {
            const dir = sDir + "/" + folder;
            load0(folder, getDecks(dir));
        }
    }
    catch (err:any)
    {
        Logger.warn("Could not load decks list from " + sDir);
        Logger.warn(err);
    }

    if (g_lId > 0)
        Logger.info(g_lId + " deck(s) available");
}

const identifyCardCode = function(line:string):string
{
    try
    {
        if (line.length < 3)
            return "";

        const val = line.substring(0, 2).trim();
        if (val === "")
            return line;

        const num = parseInt(val);
        if (num < 1)
            return "";
        
        if (num > 0)
            return line.substring(2).trim();
        else
            return line;
    }
    catch(err)
    {
        Logger.error(err);
    }

    return ""
};

const getDeckCodeList = function(content:string):string[]
{
    const list:string[] = [];
    for (let line of content.split("\n"))
    {
        if (line.length < 4)
            continue;

        if (!line.endsWith(")") && !line.endsWith("]"))
            continue;

        const first = line.substring(0,1);
        if (first === "#" || first === "=")
            continue;

        const card = identifyCardCode(line).toLowerCase();
        if (card !== "" && !list.includes(card))
            list.push(card);
    }

    return list;
}

const extractPart = function(content:string, delim:string)
{
    const pattern = "#\n" + delim + "\n#";
    const pos = content.indexOf(pattern);
    if (pos === -1)
        return "";

    const pos2 = content.indexOf("\n##", pos + pattern.length);
    if (pos2 === -1)
        return content.substring(pos + pattern.length);
    else
        return content.substring(pos + pattern.length, pos2);
}

const loadDeckMetadata = function(content:string)
{
    const result:any = {
        avatar: "",
        pool: countDeck(extractPart(content, "Pool")),
        sideboard: countDeck(extractPart(content, "Pool")),
        character: 0,
        resources: 0,
        hazards: 0,
        summary: ""
    }

    const identifiers:any = {
        "# Hazard": "hazards",
        "# Character": "character",
        "# Resource": "resources",
    }
    
    let key = "";

    for (let line of extractPart(content, "Deck").split("\n"))
    {
        if (line.length < 4)
            continue;

        if (line.startsWith("# "))
        {
            const pos = line.lastIndexOf(" (");
            if (pos === -1)
                key = "";
            else
            {
                const _t = line.substring(0, pos).trim();
                key = identifiers[_t] === undefined ? "" : identifiers[_t];
            }
                
            continue;
        }

        if (key === "" || !line.endsWith(")") && !line.endsWith("]") || line.startsWith("="))
            continue;

        const first = line.substring(0,1);
        const val = parseInt(first);
        if (!isNaN(val))
            result[key] += val;
    }

    return result;
}

const countDeck = function(data:string)
{
    let count = 0;
    for (let line of data.split("\n"))
    {
        if (line.length < 4 || !line.endsWith(")") && !line.endsWith("]"))
            continue;

        const first = line.substring(0,1);
        if (first === "#" || first === "=")
            continue;

        const val = parseInt(first);
        if (!isNaN(val))
            count += val;
    }
    return count;
}

const updateCardImages = function()
{
    for (let key in g_pDeckById)
    {
        const data = g_pDeckById[key];

        const meta = loadDeckMetadata(data.deck);
        const list = getDeckCodeList(data.deck);
        for (let code of list)
        {
            const img = CardDataProvider.getImageByCode(code);
            if (typeof img === "string" && img !== "")
            {
                data.images[code] = img;

                if (meta.avatar === "" && CardDataProvider.isAvatar(code))
                    meta.avatar = img;
            }
        }

        saveDeckMetadata(key, meta);
    }
}

loadDeckList(getRootFolder() + "/public/decks");
updateCardImages();

export function getDeckList()
{
    if (g_vpDedckList.length > 0)
        g_vpDedckList.splice(0, g_vpDedckList.length);
    
    loadDeckList(getRootFolder() + "/public/decks");
    return g_vpDedckList;
}

export default function InitDecklistRoutes()
{
    if (g_vpDedckList.length === 0)
    {
        getServerInstance().get("/data/decks", (_req:Request, res:Response) => res.json([]).status(200));
        return;
    }    

    getServerInstance().get("/data/decks", Caching.expires.jsonCallback, (_req:Request, res:Response) => res.json(g_vpDedckList).status(200));
    getServerInstance().get("/data/decks/:id", Caching.cache.jsonCallback6hrs, (req:Request, res:Response) => 
    {
        res.status(200);
        if (req.params.id && g_pDeckById[req.params.id])
            res.status(200).json(g_pDeckById[req.params.id]);
        else
            res.status(404).json({ message: "could not find deck "});
    });
}
 
