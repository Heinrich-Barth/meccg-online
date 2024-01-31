import { Request, Response } from "express";
import * as fs from "fs";
import Authenticator from "./authenticator";
import Logger from "./Logger";
import { getRootFolder } from "./Configuration";
import { generateFlatUuid, generateUuid } from "./meccg-utils";

let g_sLoginPage = "";
let g_pLoginData:any = { };

type TPlayerData = {
    key: string,
    name: string
}

(function()
{
    const root = getRootFolder();
    
    const html = root + "/public/authentication/auth.html";
    const data = root + "/data-local/login.json";

    if (fs.existsSync(data) && fs.existsSync(html))
    {
        g_sLoginPage = fs.readFileSync(html, "utf-8");
        g_pLoginData = JSON.parse(fs.readFileSync(data, "utf-8"));
    }
})();

class StaticPlayers
{
    #playersHashed:{[key:string]:string} = {};
    #players:{ [id:string]: TPlayerData} = {};

    static create(data:any)
    {
        const instance = new StaticPlayers();

        for (let key in data)
            instance.#addPlayer(key, data[key]);

        return instance;
    }

    isEmpty()
    {
        return Object.keys(this.#players).length === 0;
    }

    #addPlayer(sName:string, displayname:string)
    {
        if (sName === undefined || sName === "")
            return;

        const _name = sName.toLowerCase();
        const _val = generateUuid();

        if (displayname === undefined)
            displayname = sName;

        this.#playersHashed[_val] = _name;
        this.#players[_name] = {
            "key": _val,
            "name": displayname
        };
    }

    playerExits(name:string)
    {
        return name !== undefined && this.#players[name.toLowerCase()] !== undefined;
    }

    getPlayerByName(name:string) : TPlayerData | null
    {
        const data = this.#players[name];
        if (data !== undefined)
            return data;
        else
            return null;
    }

    getNameFromHash(sKey:string)
    {
        if (sKey !== "" && this.#playersHashed[sKey] !== undefined)
           return this.#playersHashed[sKey];
        else
            return "";
    }

    getUserDisplayName(sUser:string)
    {
        return typeof sUser === "string" && sUser !== "" ? this.#players[sUser].name : "";
    }

    getUserKey(sUser:string)
    {
        return typeof sUser === "string" && sUser !== "" ? this.#players[sUser].key : "";
    }
}

export default class SimpleFileAuthenticator extends Authenticator
{
    #SESSION_COOKIE_NAME = generateUuid();
    #FIELD_USER = generateFlatUuid();

    #triesCount = 0;
    #staticPlayers = StaticPlayers.create(g_pLoginData);

    isEmpty()
    {
        return this.#staticPlayers.isEmpty();
    }
    
    updateFieldNames()
    {
        this.#FIELD_USER = generateFlatUuid();
        this.#triesCount = 0;
    }

    getLoginPageData()
    {
        this.#triesCount++;
        if (this.#triesCount > 10)
            this.updateFieldNames();
    
        return g_sLoginPage.replace("{FIELD1}", this.#FIELD_USER)
    }

    isValidUser(sUser:string)
    {
        return this.#staticPlayers.playerExits(sUser);
    }

    signInFromPWA(res:Response)
    {
        try
        {
            this.signInWithData("gollum", res);
            Logger.info("PWA user logged in successfully");
        }
        catch(err)
        {
            res.clearCookie(this.#SESSION_COOKIE_NAME);
            Logger.error(err);
        }
    }

    signInWithData(sUser:string, res:Response)
    {
        if (!this.isValidUser(sUser))
            throw new Error("Invalid user " + sUser);
        
        const userKey = this.#staticPlayers.getUserKey(sUser);
        if (userKey === undefined || userKey === "")
            throw new Error("Invalid key");

        res.cookie(this.#SESSION_COOKIE_NAME, userKey, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true });
            
        const displayname = this.#staticPlayers.getUserDisplayName(sUser);
        if (displayname !== "")
            res.cookie('username', displayname, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true });
        
        return true;
    }

    signIn(req:Request, res:Response)
    {
        try
        {
            const jData = req.body;
            
            if (this.signInWithData(jData[this.#FIELD_USER].toLowerCase(), res))
            {
                Logger.info("User " + jData[this.#FIELD_USER] + " logged in successfully");
                return true;
            }
        }
        catch(err:any)
        {
            Logger.error(err.message);
        }

        res.clearCookie(this.#SESSION_COOKIE_NAME);
        return false;
    }

    isSignedIn(req:Request)
    {
        return this.isSignedInPlay(req);
    }

    isSignedInPlay(req:Request)
    {
        return this.#getPlayerPermissions(req) !== null;
    }

    isSignedInMap(req:Request)
    {
        return this.isSignedInPlay(req);
    }

    isSignedInCards(req:Request)
    {
        return this.isSignedInPlay(req) === true;
    }

    isSignedInDeckbuilder(req:Request)
    {
        return this.isSignedInPlay(req) === true;
    }

    #getPlayerPermissions(req:Request)
    {
        const sKey = req.cookies === undefined || req.cookies[this.#SESSION_COOKIE_NAME] === undefined ? "" : req.cookies[this.#SESSION_COOKIE_NAME];
        if (sKey === "")
            return null;
        return this.#staticPlayers.getPlayerByName(this.#staticPlayers.getNameFromHash(sKey));
    }
}
