import { Express, NextFunction, Request, Response } from "express";
import Logger from "../Logger";
import * as ClearCookies from "./ClearCookies";
import * as UTILS from "../meccg-utils";
import { Caching, ServerInstance } from "../Server";
import readAndCreateUniqueVersion from "./ReadFileUniqueVersion";


export default class GamePlayRouteHandlerUtil
{
    #startupTime = Date.now();

    clearCookies(req:Request, res:Response, next:NextFunction|null = null)
    {
        ClearCookies.clearCookies(req, res);
    }

    static readFile(file:string)
    {
        return readAndCreateUniqueVersion(file);
    }

    clearSocialMediaCookies(res:Response)
    {        
        res.clearCookie('socialMedia');
    }

    onValidateGameCookies(_req:Request, _res:Response, next:NextFunction)
    {
        next();
    }

    userIsAlreadyInGame(req:Request)
    {
        return this.validateCookies(req);
    }

    onVerifyGameRoomParam(req:any, res:Response, next:NextFunction)
    {
        const room = req.params === undefined || req.params.room === undefined ? "" : req.params.room.toLocaleLowerCase();
        if (UTILS.isAlphaNumeric(room))
        {
            req.room = room;
            next();
        }
        else
            this.createExpireResponse(res, "").redirect("/error");
    }

    clearRoomCookies(req:Request, res:Response)
    {
        ClearCookies.clearRoomCookies(req, res);
    }

    /**
     * Check if all necessary cookies are still valid
     * 
     * @param {Object} res 
     * @param {Object} req 
     * @returns 
     */
    validateCookies(req:Request)
    {
        /** no cookies available */
        if (req.cookies.userId === undefined ||
            req.cookies.room === undefined ||
            req.cookies.joined === undefined)
            return false;

        try
        {
            if (req.cookies.userId.length !== UTILS.uuidLength())
                throw new Error("Invalid player uuid.");
            else if (req.cookies.joined < this.#startupTime) 
                throw new Error("Cookie server time is old.");
            else if (!this.getRoomManager().isValidRoomCreationTime(req.cookies.room, req.cookies.joined))
                throw new Error("Cookie does not match room.");

            return true;
        }
        catch (err:any)
        {
            Logger.warn(err.message);
        }

        return false;
    }

    createExpireResponse(res:Response, sResponseType:string = "")
    {
        Caching.expires.withResultType(res, sResponseType);
        return res;
    }


    getServerInstance():Express
    {
        return ServerInstance.getServerInstance();
    }

    getRoomManager()
    {
        return ServerInstance.getRoomManager();
    }

    getServerRouteInstance()
    {
        return this.getServerInstance();
    }

    /**
     * Simple cookie value check to avoid some illegal characters that could add 
     * custom code snippets - it basically removes potential string breaking characters
     * such as Quotes, Single Quotes, line break, tabs
     * 
     * @param {String} value 
     * @returns Value or random UUID to avoid any problems
     */
    sanatiseCookieValue(value:any)
    {
        if (typeof value !== "string" ||
            value.indexOf("\"") !== -1 || 
            value.indexOf("'") !== -1 || 
            value.indexOf("\t") !== -1 || 
            value.indexOf(" ") !== -1 || 
            value.indexOf(";") !== -1 || 
            value.indexOf("\n") !== -1)
            return UTILS.generateFlatUuid();
        else
            return value.trim();
    }


}