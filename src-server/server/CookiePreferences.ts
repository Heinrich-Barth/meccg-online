import { Request, Response } from "express";
import Logger from "../Logger";

export default class CookiePreferences
{
    #available:any = {};
    #prefix:string;

    constructor(sPrefix:string = "")
    {
        this.#prefix = sPrefix ?? "";
    }
    
    addPreference(name:string, defaultValue:any)
    {
        this.#available[name] = defaultValue;
    }


    getCookieValue(cookies:any, name:string, value:any):string
    {
        return cookies === undefined || cookies[this.#prefix + name] === undefined ? value : cookies[this.#prefix +name];
    }

    get(cookies:any)
    {
        const data:any = {}

        for (let key in this.#available)
            data[key] = this.getCookieValue(cookies, key, this.#available[key]);

        return data;
    }

    getValue(cookies:any, name:string)
    {
        if (this.#available[name] !== undefined)
            return this.getCookieValue(cookies, name, this.#available[name]);
        else
            return "";
    }

    isAvailable(name:string)
    {
        return this.#available[name] !== undefined;
    }

    sanatizeValue(val:any)
    {
        return val;
    }

    update(req:Request, res:Response)
    {
        try
        {
            const jData = req.body;
            const val = this.sanatizeValue(jData.value);

            if (this.isAvailable(jData.name))
                res.cookie(this.#prefix + jData.name, val);
        }
        catch (e:any)
        {
            Logger.warn(e.message);
        }
    }
}
