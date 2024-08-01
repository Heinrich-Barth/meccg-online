
import { CardDataProvider } from "../plugins/CardDataProvider";
import { DeckValidate, DeckValidateArda } from "../plugins/Types";
import GamePlayRouteHandler from "./GamePlayRouteHandler";

export default class GamePlayRouteHandlerArda extends GamePlayRouteHandler
{
    validateDeck(jDeck:DeckValidateArda, roomSize:number)
    {
        if (roomSize === 0)
            return CardDataProvider.validateDeckArda(jDeck);
        
        const res:DeckValidate = {
            pool: {},
            playdeck: {},
            sideboard: {},
            sites: {}
        }
        
        return res;
    }

    isArda()
    {
        return true;
    }
}
