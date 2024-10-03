import Dictionary from "../utils/dictionary";
import DomUtils from "../utils/libraries";

declare const location:string|URL;

function onTimeoutIntrotip()
{
    const elem = document.createElement("i");
    elem.setAttribute("class", "fa fa-power-off");
    elem.setAttribute("aria-hidden", "true");

    const div = document.createElement("div");
    div.setAttribute("class", "icons");
    div.appendChild(elem);

    const divParent = document.createElement("div");
    divParent.setAttribute("class", "wrapper-topleft help-wrapper cursor-pointer");
    divParent.setAttribute("title", Dictionary.get("into_end", "End this game and show final scores (after final confirmation)"));
    divParent.onclick = () => document.body.dispatchEvent(new CustomEvent("meccg-query-end-game", {}));;
    divParent.appendChild(div);

    document.body.querySelector(".player-selector-box")?.prepend(divParent);
}

export default function InitIntroTip()
{
    /**
     * insert help icon. This will make use of the map window IFrame.
     * Since this is not essential, it will be added after a short timeout.
     */
    setTimeout(onTimeoutIntrotip, 200);
}

/** add a second history entry to avoid a "back" mistake */
(function() {

    try {
        history.pushState({}, "", new URL(location));
    }
    catch (ex)
    {
        console.warn(ex);
    }
})();

/**
 * Show the intro overlay
 */
(function () {
    function getConnectionCount() {
        try {
            const val = document.body.getAttribute("data-connected-count");
            if (val !== null && val !== "")
                return parseInt(val);
        }
        catch (err) {
            console.error(err);
        }

        return 0;
    }

    function createIntoTipHtml() {
        const lang = Dictionary.currentLangauge() ?? "en";
        switch (lang) {
            case "fr":
            case "es":
                return createNonEnglishTip();
            default:
                return createEnglishTip();
        }
    }

    function createIcon(icon:string)
    {
        const i = document.createElement("i");
        i.setAttribute("class", "fa " + icon);
        i.setAttribute("aria-hidden", "true");
        return i;
    }

    function createHeadline(text:string)
    {
        const h2 = document.createElement("h2");
        h2.append(
            createIcon("fa-info-circle"),
            document.createTextNode(" "),
            document.createTextNode(text)
        )
        return h2;
    }

    function createTextNode(text:string)
    {
        const p = document.createElement("p");
        p.innerText = text;
        return p;
    }

    function createTextNodeHtml(text:string)
    {
        const p = document.createElement("p");
        p.innerHTML = text;
        return p;
    }

    function createNonEnglishTip() {
        const fragment = document.createDocumentFragment();
        fragment.append(
            createHeadline(Dictionary.get("into.howto", "How to play")),
            createTextNode((Dictionary.get("into.howto.text", 'Simply <span class="text-white">drag &amp; drop</span> cards as you would intuitively do. Depending on your card, different targets/options will be made available visually.')))
        )
        fragment.append(
            createHeadline(Dictionary.get("into.tips", "Tips & Shortcuts")),
            createTextNode(Dictionary.get("into.tips.text", "Click on the help icon at the top bar to access shortcuts and tips."))
        )

        fragment.append(
            createHeadline(Dictionary.get("into.resume", "Resume a saved game")),
            createTextNode(Dictionary.get("into.resume.text", "Once all players are at the table, access game settings (top, center) and click on Restore a saved game. The players at the table need to match the number of players of your saved game."))
        )

        return fragment;
    }

    function createEnglishTip() {
        const fragment = document.createDocumentFragment();
        fragment.append(
            createHeadline("How to play"),
            createTextNodeHtml(`Simply <span class="text-white">drag &amp; drop</span> cards as you would intuitively do. Depending on your card, different targets/options will be made available visually.`)
        )
        fragment.append(
            createHeadline("Tips & Shortcuts"),
            createTextNodeHtml(`Click on the <span class="text-white"><i class="fa fa-question-circle"></i> help icon</span> at the top bar to access shortcuts and tips.`)
        )

        fragment.append(
            createHeadline("Resume a saved game"),
            createTextNodeHtml(`Once all players are at the table, access the <span class="text-white cursor-pointer" data-event="settings"><i class="fa fa-sliders"></i> <b>game settings</b></span> (upper left corner) and click on <span class="text-white cursor-pointer" data-event="settings"><i class="fa fa-folder-open"></i> <b>Restore a saved game</b></span>. The players at the table need to match the number of players of your saved game.`)
        )

        return fragment;
    }

    function addContent() {
        const div = document.createElement("div");
        div.setAttribute("class", "intro-tooltip");
        div.setAttribute("id", "intro-tooltip");

        const divOverlay = document.createElement("div");
        divOverlay.setAttribute("id", "tip-opverlay");
        divOverlay.setAttribute("class", "tip-opverlay");
        divOverlay.setAttribute("title", "Click here to close");
        divOverlay.onclick = () => document.getElementById("close_tip")?.click();

        const divContent = document.createElement("div");
        divContent.setAttribute("class", "blue-box tip-content");
        divContent.append(createIntoTipHtml());

        const button = document.createElement("button")
        button.setAttribute("id", "close_tip");
        button.setAttribute("type", "button");
        button.onclick = () => DomUtils.remove(document.getElementById("intro-tooltip"));
        button.innerText = Dictionary.get("close", "Close tip");
        const p = document.createElement("p");
        p.setAttribute("class", "text-center");
        p.append(button);
        divContent.append(p);

        divContent.querySelectorAll("span").forEach(span => {
            if (span.hasAttribute("data-event")) {
                span.onclick = () => {
                    document.getElementById("preferences-wrapper")?.classList.remove("hide");
                    document.getElementById("close_tip")?.click();
                }
            }
        });

        div.appendChild(divOverlay);
        div.appendChild(divContent);
        document.body.appendChild(div);
        
    }

    if (getConnectionCount() === 0 && document.body.getAttribute("data-is-watcher") !== "true")
        addContent();
})();