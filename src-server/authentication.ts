import { NextFunction, Request, Response } from "express";
import Authenticator from "./authenticator";
import SimpleFileAuthenticator from "./authentication-simple"
import Logger from "./Logger";

/**
 * Load renderer modules from a given directory
 */
const requireAuthenticationModule = function() : Authenticator
{
    const instance = new SimpleFileAuthenticator();
    if (!instance.isEmpty())
    {
        Logger.info("Authentication module added.");    
        return instance;
    }
     
    Logger.info("No authentication module necessary.");
    return new Authenticator();
};

const pInstance = requireAuthenticationModule();

export function showLoginPage(req: Request, res: Response, next:NextFunction = () =>{})
{
    let data = pInstance.getLoginPageData();
    if (data === "")
        res.status(404).send();
    else
        res.status(200).send(data);
}

export function signIn(req: Request, res: Response) 
{ 
    return pInstance.signIn(req, res); 
}

export function isSignedInPlay(req: Request, res: Response, next:NextFunction) 
{
    if (pInstance.isSignedInPlay(req))
        next();
    else 
        res.status(403).send(pInstance.getLoginPageData());
}

export function isSignedInCards(req: Request, res: Response, next:NextFunction) 
{
    if (pInstance.isSignedInCards(req))
        next();
    else 
        res.status(403).send(pInstance.getLoginPageData());
}

export function isSignedInDeckbuilder(req: Request, res: Response, next:NextFunction) 
{
    if (pInstance.isSignedInDeckbuilder(req))
        next();
    else 
        res.status(403).send(pInstance.getLoginPageData());
}

export function isSignedInMap(req: Request, res: Response, next:NextFunction)
{
    if (pInstance.isSignedInMap(req))
        next();
    else 
        res.status(403).send(pInstance.getLoginPageData());
}

export function signInFromPWA(req: Request, res: Response, next:NextFunction)
{
    if (!pInstance.isSignedInPlay(req))
        pInstance.signInFromPWA(res);

    next();
}

export function isSignedInPWA(req: Request, res?: Response, next?:NextFunction)
{
    return pInstance.isSignedInPWA(req);
}

export function isSignedIn(req: Request, res: Response, next:NextFunction)
{
    return pInstance.isSignedIn(req);
}
