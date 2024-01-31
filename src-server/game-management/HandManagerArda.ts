import HandManager from "./HandManager";

export default class HandManagerArda extends HandManager
{
    handCardsCharacters(playerId:string)
    {
        return this.getCardPils(playerId, "handCardsCharacters");
    }

    handMinorItems(playerId:string)
    {
        return this.getCardPils(playerId, "handMinorItems");
    }

    handStage(playerId:string)
    {
        return this.getCardPils(playerId, "handStage");
    }

    sites(_playerId:string)
    {
        return [];
    }

    handMarshallingPoints(playerId:string)
    {
        return this.getCardPils(playerId, "handCardsMP");
    }

    discardPileMinor(playerId:string)
    {
        return this.getCardPils(playerId, "discardPileMinorItems");
    }

    playdeckMinor(playerId:string)
    {
        return this.getCardPils(playerId, "playdeckMinorItems");
    }

    playdeckMPs(playerId:string)
    {
        return this.getCardPils(playerId, "playdeckMP");
    }
    
    discardPileMPs(playerId:string)
    {
        return this.getCardPils(playerId, "discardPileMP");
    }

    discardPileStage(playerId:string)
    {
        return this.getCardPils(playerId, "discardPileStage");
    }

    playdeckStage(playerId:string)
    {
        return this.getCardPils(playerId, "playdeckStage");
    }

    playdeckCharacters(playerId:string)
    {
        return this.getCardPils(playerId, "playdeckCharacters");
    }
    
    discardPileCharacters(playerId:string)
    {
        return this.getCardPils(playerId, "discardPileCharacters");
    }
}
