import { Request, Response } from "express";

export default class Authenticator {

    signIn(req: Request, res: Response):boolean {
        return true;
    }

    isSignedInPlay(req: Request):boolean {
        return true;
    }

    isSignedInCards(req: Request):boolean {
        return true;
    }

    isSignedIn(req: Request):boolean
    {
        return true;
    }

    isSignedInDeckbuilder(req: Request):boolean {
        return true;
    }

    isSignedInMap(req: Request):boolean {
        return true;
    }

    getLoginPageData():string {
        return "";
    }

    signInFromPWA(res: Response):void
    {
        /** do nothing */
    }

    isSignedInPWA(req: Request):boolean
    {
        return false;
    }
}
