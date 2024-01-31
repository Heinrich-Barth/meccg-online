
import { DeckValidate } from "../plugins/Types";
import Player from "./Player";

const EmptyDeck:DeckValidate = {
    pool: { },
    playdeck: { },
    sideboard: { },
    sites: { },
}

export default class Visitor extends Player
{
    constructor(displayname:string,  timeAdded:number)
    {
        super(displayname, EmptyDeck, false, timeAdded);
    }

    isVisitor()
    {
        return true;
    }

    isAdmin()
    {
        return false;
    }
}
