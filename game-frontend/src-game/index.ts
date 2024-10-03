import CreateTableHtml from "./table";
import { InitArda } from "./arda/game-arda";
import InitChat from "./chat/chat";
import { InitDice } from "./dice/dice";
import { InitDiceStats } from "./dice/dicestats";
import { InitTurnStats } from "./dice/TurnStats";
import InitDiscardPileAtTable from "./discardpile/discardpile";
import InitGameEvents from "./game-events";
import InitGame from "./game-tabletop";
import { InitInfoBoxCard } from "./InfoBoxCard";
import InitIntroTip from "./introtip/introtip";
import { InitMapwindow } from "./map/map";
import { InitMeccgApi } from "./meccg-api";
import { InitNotification } from "./notification/notification";
import { InitBackgroundChooser } from "./preferences/BackgroundChooser";
import InitDiceChooser from "./preferences/DiceChooser";
import { InitPreferences } from "./preferences/preferences-game";
import { InitQuestion } from "./question/question";
import { InitSoundEffects } from "./sfx/sfx";
import { InitShotcutManager } from "./shortcuts";
import InitWatchOnly from "./watch/watch";

CreateTableHtml();

InitMeccgApi();
InitGameEvents();

InitNotification();
InitQuestion();
InitDiceStats();
InitTurnStats();
InitMapwindow();
InitIntroTip();
InitInfoBoxCard();

InitPreferences();
InitBackgroundChooser();
InitDiceChooser();
InitSoundEffects();
InitWatchOnly();

InitArda();
InitDice();
InitDiscardPileAtTable();
InitChat();
InitShotcutManager();
InitIntroTip();


/** allow content paint */
setTimeout(() => {

    document.body.dispatchEvent(new CustomEvent("meccg-init-ready"));

    InitGame();

}, 100);


