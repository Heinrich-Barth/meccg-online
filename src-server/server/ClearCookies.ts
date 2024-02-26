import { NextFunction, Request, Response } from "express";

export function clearCookies(req:Request, res:Response)
{
    if (req === undefined || req.cookies === undefined)
        return;

    if (req.cookies.userId !== undefined)
        res.clearCookie('userId');

    if (req.cookies.joined !== undefined)
        res.clearCookie('joined');

    if (req.cookies.room !== undefined)
        res.clearCookie('room');
    
    if (req.cookies.userId !== undefined)
        res.clearCookie('userId');
}

export function clearRoomCookies(req:Request, res:Response)
{
    if (req === undefined || req.cookies === undefined)
        return;

    if (req.cookies.joined !== undefined)
        res.clearCookie('joined');

    if (req.cookies.room !== undefined)
        res.clearCookie('room');
}

export function clearCookiesCallback(req:Request, res:Response, next:NextFunction)
{
    clearCookies(req, res);
    next();
}


