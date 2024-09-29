import CardPreview from "./card-preview";
import { CardListImpl } from "./utils/cardlist";
import GameCompanies from "./game-companies";
import { TaskBarCardsInterface } from "./game-taskbarcards";
import createGameBuilder from "./gamebuilder";
import { createHandCardsDraggable } from "./handcards-draggable";
import { createScoringApp } from "./score/score";

const g_Game:any = { 
    CardPreview : CardPreview,
    TaskBarCards : TaskBarCardsInterface
};

export default function InitGame()
{
    g_Game.CardList = CardListImpl.createInstance();
    g_Game.Scoring = createScoringApp();
    g_Game.HandCardsDraggable = createHandCardsDraggable();
    g_Game.CompanyManager = GameCompanies;
    g_Game.GameBuilder = createGameBuilder();
    
    document.body.dispatchEvent(new CustomEvent('meccg-api-init'));
}
