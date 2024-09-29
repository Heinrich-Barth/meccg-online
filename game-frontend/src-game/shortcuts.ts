import CardPreview from "./card-preview";
import DomUtils from "./utils/libraries";
import MapWindow from "./map/map";
import MeccgApi, { MeccgPlayers } from "./meccg-api";

const ShotcutManager = 
{
    clickProgressionLink: function(sPhase:string)
    {
        const elem = MeccgPlayers.isMyTurn() ? document.getElementById("progression-phase-box") : null;
        if (elem === null)
            return;

        const link:any = elem.querySelector('a[data-phase="' + sPhase + '"]');
        if (link && !link.classList.contains("act"))
            link.click();      
    },

    getKey: function(ev:any)
    {
        if (ev.key !== undefined)
            return "" + ev.key;
        else if (ev.keyIdentifier !== undefined)
            return "" + ev.keyIdentifier;

        return "";
    },

    isDraggable : function(uuid:string)
    {
        return ShotcutManager.getDraggableDiv(uuid) !== null;
    },

    getDraggableDiv : function(uuid:string)
    {
        if (uuid === null || uuid === "")
            return null;

        const pStage =  document.getElementById("stagecard_" + uuid);
        if (pStage)
            return pStage;
        else
            return document.getElementById("ingamecard_" + uuid);
    },

    discardHoveredCard : function(uuid:string)
    {
        const div = ShotcutManager.getDraggableDiv(uuid);
        if (div === null)
            return;

        const src = div.hasAttribute("data-location") ? div.getAttribute("data-location") : "";
        if (src !== "")
        {
            DomUtils.removeNode(div);
            MeccgApi.send("/game/card/move", {uuid: uuid, target: "discardpile", source: src, drawTop : false});
        }
    },

    onKeyUp : function(evt:any)
    {
        const code = this.getKey(evt);
        switch(code)
        {
            /* ESC */
            case "Escape":
                MapWindow.close();
                break;

            case "w":
            case "r":

                if (CardPreview.currentCharacterId !== "")
                {
                    const elem = document.getElementById(CardPreview.currentCharacterId);
                    const diceIcon = elem === null ? null : elem.querySelector(".card-dice");
                    if (diceIcon != null)
                    {
                        diceIcon.dispatchEvent(new Event("click"));
                        break;
                    }
                }

                document.getElementById("roll_dice_icons")?.dispatchEvent(new Event("click"));
                break;

            case "d":
                document.getElementById("draw_card")?.click();
                break;

            case "e":
                this.clickProgressionLink("eotdiscard");
                break;

            case "f":
                if (CardPreview.currentCardId !== "" && ShotcutManager.isDraggable(CardPreview.currentCardId))
                    MeccgApi.send("/game/card/state/reveal", {uuid : CardPreview.currentCardId, code: "" }); 
                break;

            case "+":
                if (CardPreview.currentCardId !== "" && CardPreview.currentCardCode !== "")
                    MeccgApi.send("/game/card/token", {uuid : CardPreview.currentCardId, code: CardPreview.currentCardCode, add: true });
                break;

            case "-":
                if (CardPreview.currentCardId !== "" && CardPreview.currentCardCode !== "")
                    MeccgApi.send("/game/card/token", {uuid : CardPreview.currentCardId, code: CardPreview.currentCardCode, add: false });
                break;

            case "x":
                if (CardPreview.currentCardId !== "")
                    ShotcutManager.discardHoveredCard(CardPreview.currentCardId);
                break;
            case "q":
                this.clickProgressionLink("eot");
                break;

            case "s":
                this.clickProgressionLink("site");
                break;

            default:
                break;
        }
    },

    init()
    {
        document.body.addEventListener("keyup", ShotcutManager.onKeyUp.bind(ShotcutManager), false);

        const elem = document.getElementById("playercard_hand");
        if (elem !== null)
        {
            const icons = elem.querySelector(".icons");
            if (icons !== null && !icons.hasAttribute("id"))
                icons.setAttribute("id", "progression-phase-box");
        }
    }
}

export default ShotcutManager;

export function InitShotcutManager()
{
    if (document.body.getAttribute("data-is-watcher") !== "true")
        ShotcutManager.init();
}
