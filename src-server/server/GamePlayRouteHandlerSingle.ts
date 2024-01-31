import { CardDataProvider } from "../plugins/CardDataProvider";
import { DeckValidateArda } from "../plugins/Types";
import GamePlayRouteHandler from "./GamePlayRouteHandler";

export default class GamePlayRouteHandlerSingle extends GamePlayRouteHandler
{
    validateDeck(jDeck:DeckValidateArda)
    {
        return CardDataProvider.validateDeckSingleplayer(jDeck);
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


