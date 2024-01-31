
import { CardDataProvider } from "../plugins/CardDataProvider";
import { DeckValidateArda } from "../plugins/Types";
import GamePlayRouteHandler from "./GamePlayRouteHandler";

export default class GamePlayRouteHandlerArda extends GamePlayRouteHandler
{
    validateDeck(jDeck:DeckValidateArda)
    {
        return CardDataProvider.validateDeckArda(jDeck);
    }

    isArda()
    {
        return true;
    }
}
