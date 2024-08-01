import * as fs from "fs";
import { Request, Response } from "express";
import { Caching, ServerInstance } from "./Server";
import Logger from "./Logger";
import { getRootFolder } from "./Configuration";

interface KeyValuePair {
    [key:string]:string
}

interface IPersonalisation {
    dices:string[],
    background_keys: string[],
}

const Personalisation:IPersonalisation = {
    dices : [],
    background_keys : [],
};


(function()
{
    const readDir = function(rootDir:string) : string[]
    {
        try
        {
            const files = fs.readdirSync(rootDir);
            const res = files.filter(filename => fs.statSync(rootDir+ "/" + filename).isDirectory())

            res.sort();
            return res;
        }
        catch (err:any)
        {
            console.warn(err.message);
        }

        return [];
    };

    const readFiles = function(rootDir:string)
    {
        try
        {
            const files = fs.readdirSync(rootDir);
            const res = files.filter(filename => fs.statSync(rootDir+ "/" + filename).isFile())

            res.sort();
            return res;
        }
        catch (err:any)
        {
            console.warn(err.message);
        }

        return [];
    };

    const toMap = function(list:string[]) : KeyValuePair
    {
        if (list.length === 0)
            return { };

        let res:KeyValuePair = { };

        const len = list.length;
        for (let i = 0; i < len; i++)
            res["bg-" + i] = list[i];

        return res;
    };

    const writePersonalisationCss = function(map:KeyValuePair)
    {
        const data:string[] = [];
        for (let key in map)
            data.push(`.${key} { background: url("/media/personalisation/backgrounds/${map[key]}") no-repeat center center fixed; background-size: cover; }`);
    
        try
        {
            const folder = getRootFolder() + "/public/media/personalisation";
            if (!fs.existsSync(folder))
            {
                Logger.info("create personalisation directory");
                fs.mkdirSync(folder, { recursive: true });
            }

            fs.writeFileSync(getRootFolder() + "/public/media/personalisation/personalisation.css", data.join("\n"));
        }
        catch(err)
        {
            console.warn("Could not writer to /public/media/personalisation/personalisation.css");
            Logger.error(err);
        }
        
    };

    Personalisation.dices = readDir(getRootFolder() + "/public/media/personalisation/dice");

    const backgorunds = toMap(readFiles(getRootFolder() + "/public/media/personalisation/backgrounds"));
    Personalisation.background_keys = Object.keys(backgorunds);
    writePersonalisationCss(backgorunds);

    console.info("personalisation information:");
    console.info("\t - "+Personalisation.dices.length + " dice(s) available");
    console.info("\t - "+Personalisation.background_keys.length + " background(s) available");
})();

export function InitPersonalisation()
{
    const server = ServerInstance.getServerInstance();
    if (server !== null)
    {
        server.get("/data/dices", Caching.expires.jsonCallback, (_req:Request, res:Response) => res.send(Personalisation.dices).status(200));
        server.get("/data/backgrounds", Caching.expires.jsonCallback, (_req:Request, res:Response) => res.send(Personalisation.background_keys).status(200));
    }
}

export function getRandomBackground():string
{
    if (Personalisation.background_keys.length < 2)
        return "";

    const index = Math.floor((Math.random() * Personalisation.background_keys.length));
    return Personalisation.background_keys[index];
}