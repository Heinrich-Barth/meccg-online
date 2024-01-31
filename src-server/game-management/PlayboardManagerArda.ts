
import PlayboardManager from "./PlayboardManager";
import DeckManagerArda from "./DeckManagerArda";

export default class PlayboardManagerArda extends PlayboardManager
{
    constructor()
    {
        super(new DeckManagerArda())
    }
}

