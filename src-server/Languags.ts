import { NextFunction, Response } from "express";
import { ServerInstance } from "./Server";
import { getRootFolder } from "./Configuration";
import * as fs from "fs";

const requireCookieLanguage = function(req: any)
{
    const language = req.cookies?.language
    if (typeof language !== "string" || language === "")
        return "en";
    
    if (language === "en" || language === "es" || language === "fr")
        return language;
    else
        return "en";
}

const requireLanguageParams = function(req: any)
{
    const language = req.query?.language
    if (typeof language !== "string" || language === "")
        return "";
    
    if (language === "en" || language === "es" || language === "fr")
        return language;
    else
        return "";
}

const getDictionaryFile = function(req: any)
{
    if (typeof req._language !== "string" || req._language === "")
        req._language = "en";

    return req._language + ".js?t=" + Date.now();
}

function RedirectToSource(req: any, res: Response, next: NextFunction)
{
    res.header("Cache-Control", "no-store");
    res.redirect("/media/dictionary-" + getDictionaryFile(req) + ".js");
}

export function AddLanguageCookieToRequest(req: any, res: Response, next: NextFunction)
{
    let language = requireLanguageParams(req);
    if (language !== "")
    {
        const jSecure = { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true };
        res.cookie('language', language, jSecure);
    }
    else 
        language = requireCookieLanguage(req);

    req._language = language;
    next();
}

interface DictionaryEntry {
    en: string;
    es: string;
    fr: string
}

interface DictionaryData {
    [key:string] : DictionaryEntry
}

class Dictionary {

    #data:DictionaryData = { }

    #requireFile(file:string)
    {
        try
        {
            const data = fs.readFileSync(file, "utf-8");
            if (data)
                return data;
        }
        catch (err)
        {
            console.error(err);
        }
    
        console.error("Cannot find dictionary file");
        return "";    
    }

    #readSourceJs()
    {
        const uriSourceFile = getRootFolder() + "/dist-client/js/game/dictionary.js";
        return this.#requireFile(uriSourceFile);
    }

    #loadDictionary()
    {
        const POS_KEY = 0;
        const POS_EN = 1;
        const POS_FR = 2;
        const POS_ES = 3;

        let count = 0;
        const content = this.#readCSV();
        for (let line of content.split("\n"))
        {
            /* skip first line, because it is the header row */
            if (++count === 1 || line.indexOf(";") === -1)
                continue;
                
            const parts = line.split(";");
            if (parts.length < 2)
                continue;

            const key = this.#requirePart(parts, POS_KEY);
            const val_en = this.#requirePart(parts, POS_EN);
            
            if (key === "" || val_en === "")
                continue;
            
            if (this.#data[key] !== undefined)
                console.warn("Duplicate key for key " + key);

            this.#data[key] = {
                en: val_en,
                fr: this.#requirePart(parts, POS_FR),
                es: this.#requirePart(parts, POS_ES),
            };
        }

        return Object.keys(this.#data).length;
    }

    #requirePart(parts:string[], index:number)
    {
        const val = parts[index]
        return typeof val === "string" ? val : "";
    }

    create()
    {
        this.#loadDictionary();
        const js = this.#readSourceJs();
        this.#saveDictionary("en", js, "");
        this.#saveDictionary("es", js);
        this.#saveDictionary("fr", js);
    }

    #createDictionary(lang:string, fallback = "en")
    {
        const res:any = { }

        let missing = 0;
        let entry:any;
        for (let key of Object.keys(this.#data))
        {
            entry = this.#data[key];
            let src = entry[lang];
            let fallb = fallback === "" ? "" : entry[fallback];
            if (src && src !== "")
                res[key] = src;
            else if (fallb && fallb !== "")
            {
                res[key] = fallb;
                missing++;
                console.warn("translation missing for key " + lang + "." + key + " - using default " + fallback);
            }
        }

        if (missing > 0)
            console.warn(missing + " translations are missing for language " + lang);
        return res;
    }

    #saveDictionary(lang:string, js:string, fallback = "en")
    {
        const file = getRootFolder() + "/public/media/dictionary-" + lang + ".js";
        let content = this.#createDictionary(lang, fallback);
        if (lang === "en")
        {
            console.info("-- ignore english dictionary. Will use default values.");
            content = {};
        }
    
        fs.writeFileSync(file, js.replace("{LANG}", lang).replace("/*DO NOT CHANGE*/", JSON.stringify(content) + "//"))
        console.info("Dictionary created for language " + lang);
    }

    #readCSV()
    {
        const uriSourceFile = getRootFolder() + "/data-local/dictionary.csv";
        return this.#requireFile(uriSourceFile);
    }
}

const CreateDictionaryFiles = function()
{
    new Dictionary().create();
}

export default function InitRouteDictionary()
{
    CreateDictionaryFiles();

    const server = ServerInstance.getServerInstance();
    if (server !== null)
        server.get("/data/dictionary.js", AddLanguageCookieToRequest, RedirectToSource);
}