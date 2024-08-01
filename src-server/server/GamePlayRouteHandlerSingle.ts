import { CardDataProvider } from "../plugins/CardDataProvider";
import { DeckValidateArda } from "../plugins/Types";
import GamePlayRouteHandler from "./GamePlayRouteHandler";

export default class GamePlayRouteHandlerSingle extends GamePlayRouteHandler
{
    validateDeck(jDeck:DeckValidateArda, roomSize:number, randomHazards:boolean = false)
    {
        return CardDataProvider.validateDeckSingleplayer(jDeck, randomHazards);
    }

    isSinglePlayer()
    {
        return true;
    }

    isArda()
    {
        return true;
    }
}


