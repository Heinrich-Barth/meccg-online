import DeckManager from "./DeckManager";

import HandManager from "./HandManager";

import DeckDefault from "./DeckDefault";

export default class DeckManagerDefault extends DeckManager 
{
    creatHandManager():HandManager
    {
        return new HandManager(this);
    }

    newDeckInstance(playerId:string)
    {
        return new DeckDefault(playerId);
    }

}

