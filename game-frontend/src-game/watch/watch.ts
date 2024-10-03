import Dictionary from "../utils/dictionary";
import { RegisterGenericEvent } from "../game-events";
import DomUtils from "../utils/libraries";
import MeccgApi from "../meccg-api";

const WatchOnly = {

    getIconContainer : function()
    {
        return document.querySelector(".card-bar-shared .icons");
    },

    showVictory : function()
    {
        MeccgApi.send("/game/watch/victory", "victory");
        return false;
    },

    showHands : function()
    {
        MeccgApi.send("/game/watch/hand", {});
        return false;
    },

    onProgressToPhase(e:any)
    {
        if (e.detail.phase === "organisation")
            return WatchOnly.showHands();
    },

    injectIcons : function()
    {
        const container = this.getIconContainer();
        if (container === null)
            return;

        let elemScore = document.createElement("a");
        elemScore.onclick = this.showVictory;
        elemScore.setAttribute("class", "icon victory");
        elemScore.setAttribute("title", Dictionary.get("watch_score", "Open score sheet"));
        container.appendChild(elemScore);

        elemScore = document.createElement("a");
        elemScore.onclick = this.showHands;
        elemScore.setAttribute("id", "watch_togglehand");
        elemScore.setAttribute("class", "icon hand");
        elemScore.setAttribute("title", Dictionary.get("watch_showhide", "Show/Hide hand cards"));
        container.appendChild(elemScore);
    },

    init : function()
    {
        document.body.classList.add("game-watch-only");

        WatchOnly.injectIcons();

        RegisterGenericEvent("discard", WatchOnly.onDiscardEvent);
    },

    onDiscardEvent : function(data:{uuid:string})
    {
        if (data === undefined || data.uuid === undefined)
            return;

        const elem = document.getElementById("card_icon_nr_" + data.uuid);
        if (elem !== null)
            DomUtils.remove(elem);
    }
};


export default function InitWatchOnly()
{
    if (document.body.getAttribute("data-is-watcher") === "true")
    {
        document.body.addEventListener("meccg-api-init", WatchOnly.init, false);
        document.body.addEventListener("meccg-event-phase", WatchOnly.onProgressToPhase, false);   
    }        
}