import * as fs from "fs";
import { ICard, ISetList } from "./Types";

export default class CardBuilder
{
    #cards:ICard[] = [];
    #sets:ISetList = { }
    #erratas:any = { };
    
    #loadJsonObject(file:string)
    {
        try {
            
            const json = JSON.parse(fs.readFileSync(file, "utf-8"));
            if (json && !Array.isArray(json))
                return json;
        }
        catch (err:any)
        {
            console.error(err.message);
        }

        console.warn("Cannot load json file " + file);
        return { }
    }
    #loadJsonArray(file:string)
    {
        try {
            const json = JSON.parse(fs.readFileSync(file, "utf-8"));
            if (json && Array.isArray(json))
                return json;
        }
        catch (err:any)
        {
            console.error(err.message);
        }

        console.warn("Cannot load json file " + file);
        return [ ]
    }

    #loadSets(dir:string)
    {
        const file = dir + "/sets.json";
        const map = this.#loadJsonObject(file);

        for (let key in map)
        {
            if (typeof map[key] === "string")
            {
                this.#sets[key.toUpperCase()] = {
                    name: map[key],
                    code: key.toUpperCase(),
                    ice: true,
                    dc: false,
                    released: true, 
                    order: 1
                };
            }
            else if (map[key] && map[key].name)
            {
                this.#sets[key.toUpperCase()] = {
                    name: map[key].name,
                    ice: map[key].ice !== false,
                    code: key.toUpperCase(),
                    dc: map[key].ice !== true,
                    released: map[key].ice === true || map[key].released === true, 
                    order: map[key].order ?? 100
                };
            }
        }

        const size = Object.keys(this.#sets).length;
        if (size === 0)
            return false;

        console.info(size + " sets found");
        return true;
    }

    #loadErrata(dir:string)
    {
        const file = dir + "/errata.json";
        this.#erratas = this.#loadJsonObject(file);
    }

    #listCardFiles(dir:string)
    {
        const res = [];

        const files = fs.readdirSync(dir);
        if (files === undefined || files.length === 0)
            return [];

        for (let file of files)
        {
            if (file.startsWith("me") && file.endsWith(".json"))
                res.push(file);
        }

        return res;
    }

    getSets()
    {
        return this.#sets;
    }

    fromDirectory(dir: string) 
    {
        if (!this.#loadSets(dir))
            console.warn("Cannot loads sets");

        this.#loadErrata(dir);

        const files = this.#listCardFiles(dir);
        if (files === undefined || files.length === 0)
            throw Error("No files available");

        for (let file of files)
        {
            const set = this.#getSetCode(file);
            const type = this.#getCardType(file);

            console.info("Processing card file " + file + " - type " + type + " of set " + set);
            this.#processFile(dir + "/" + file, set, type);
        }

        return this.#cards.sort((a:any,b:any) => a.normalizedtitle.localeCompare(b.normalizedtitle));
    }

    #getCardType(file:string)
    {
        let parts = file.split("_");
        if (parts.length !== 2)
            return "";

        parts = parts[1].split(".");
        if (parts.length !== 2)
            return "";

        return this.#capitalize(parts[0]);
    }

    #getSetCode(file:string)
    {
        const parts = file.split("_");
        if (parts.length !== 2)
            return "";

        return parts[0].toUpperCase();
    }

    #getTimCode(code:string)
    {
        if (code.startsWith("ME"))
            code = code.substring(2);

        return "(" + code + ")";
    }

    #capitalize(text:string)
    {
        if (text === "")
            return "";
        else if (text.length === 1)
            return text.toUpperCase();
        else
            return text[0].toUpperCase() + text.substring(1)
    }

    #processFile(file:string, set:string, type:string)
    {
        const trimCode = this.#getTimCode(set);
        this.#loadJsonArray(file).forEach((card:any) => this.#processCardList(card, type, set, trimCode));
    }

    #processCardList(card:any, type:string, setCode:string, setTrimCode:string)
    {
        if (card === undefined)
            return;

        card.trimCode = setTrimCode;
        card.set_code = setCode;
        card.type = type;
        card.full_set = this.#getFullSetName(setCode);

        if (card.code === "")
            card.code = card.title;

        if (!card.code.endsWith(setTrimCode))
            card.code += " " + setTrimCode;

        const errata = this.#getErrata(card.code);
        if (errata !== "")
            card.ImageNameErrataDC = errata;

        if (this.#sets[setCode])
            card.set_order = this.#sets[setCode].order;
        else
            card.set_order = 1;

        card.uniqueness = false;
        if (typeof card.unique !== "undefined")
        {
            if (card.unique === true)
                card.uniqueness = true;

            delete card.unique;
        }

        if (card.normalizedtitle === "")
            card.normalizedtitle = card.title.toLowerCase();

        if (card["flip-title"] === "")
            card["flip-title"] = card.normalizedtitle;

        this.#cards.push(card);
    }

    #getFullSetName(code:string)
    {
        const val = this.#sets[code.toLowerCase()];
        if (typeof val !== "string" || val === "")
        {
            console.warn("Cannot find set name by code: " + code);
            return "";            
        }
        
        return val;
    }

    #getErrata(code:string)
    {
        const val = this.#erratas[code];
        return typeof val === "string" ? val : "";
    }
}

