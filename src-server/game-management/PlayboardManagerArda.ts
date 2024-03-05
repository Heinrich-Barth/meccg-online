
import PlayboardManager from "./PlayboardManager";
import DeckManagerArda, { DeckManagerSinglePlayer } from "./DeckManagerArda";

export default class PlayboardManagerArda extends PlayboardManager
{
    constructor()
    {
        super(new DeckManagerArda())
    }
}

export class PlayboardManagerSingleplayer extends PlayboardManager
{
    constructor()
    {
        super(new DeckManagerSinglePlayer())
    }
}
