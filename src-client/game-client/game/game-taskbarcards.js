
class ViewCardListContainer {

    static CONTAINER_ID = "view_card_list_container";

    static CardList = null;

    static init()
    {
        let elem = document.getElementById(ViewCardListContainer.CONTAINER_ID);
        if (elem !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("id", "view_card_list_container");
        div.setAttribute("class", "hidden");
        div.innerHTML = `
                <div data-class="view-card-list-container blue-box" class="view-card-list-container blue-box">
                    <div class="container-title-bar smallCaps">
                        <div class="container-title-bar-title fl"></div>
                        <div class="container-title-bar-reveal hideOnOffer fl"><a href="#" class="fa fa-eye" title="show to your opponent" data-type="">reveal to opp.</a></div>
                        <div class="container-title-bar-shuffle hideOnOffer fr">Close &amp; Shuffle</div>
                        <div class="clear"></div>
                    </div>
                    <div class="container-data"></div>
                    <div class="clear"></div>
                </div>`;

        document.body.appendChild(div);
    }

    static GetViewContainer() 
    {
        return document.getElementById(ViewCardListContainer.CONTAINER_ID);
    }

    static ShowViewContainer() 
    {
        const container = document.getElementById(ViewCardListContainer.CONTAINER_ID);
        if (container === null)
            return;

        container.classList.remove("hidden");
        ViewCardListContainer.scrollToTop(container.querySelector(".container-data"));
    }

    static createCardContainer(code, uuid, type, bShowCardPreview, cardNumber) 
    {
        let _img = ViewCardListContainer.CardList.getImage(code);
        let sCode = ViewCardListContainer.CardList.getSafeCode(code);

        if (!bShowCardPreview) 
        {
            _img = "/data/backside";
            sCode = "";
        }

        const elem = document.createElement("div");
        elem.setAttribute("class", "card-hand pos-rel");
        elem.setAttribute("id", "offer_" + uuid);
        elem.setAttribute("data-uuid", uuid);
        elem.setAttribute("draggable", "false");
        elem.setAttribute("data-code", sCode);
        elem.setAttribute("data-type", type);
        const crossOrig = g_bSetImgAnonymous ? 'crossorigin="anonymous"' : ""
        elem.innerHTML = `<img src="${_img}" data-id="${uuid}" class="card-icon" ${crossOrig} decoding="async" data-image-backside="/data/backside">
            <div class="view-card-list-actions icons">
                <a href="#" class="icon hand" data-move-to="hand" data-shuffle="false" title="Move to hand">&nbsp;</a>
                <a href="#" class="icon playdeck playdeck-shuffle" data-move-to="playdeck" data-shuffle="true" title="Shuffle into playdeck">&nbsp;</a>
                <a href="#" class="icon discardpile" data-move-to="discardpile" data-shuffle="false" title="Move to top of discard pile">&nbsp;</a>
                <a href="#" class="icon sideboard" data-move-to="sideboard" data-shuffle="false" title="Move to sideboard">&nbsp;</a>
                <a href="#" class="icon playdeck" data-move-to="playdeck" data-shuffle="false" title="Move to top of playdeck">&nbsp;</a>
                <a href="#" class="icon onoffer" data-move-to="offer" data-shuffle="false" title="Reveal to opponent">&nbsp;</a>
            </div>`;

        if (cardNumber !== undefined && cardNumber > 0)
        {
            const data = document.createElement("span");
            data.setAttribute("class", "card-list-number");
            data.innerText = cardNumber;
            elem.appendChild(data);
        } 
    
        return elem;
    }

    static requestTitle(sTitle)
    {
        switch(sTitle.toUpperCase())
        {
            case "MINOR":
                return "Minor Items";
            case "MPS":
                return "Marshalling points";
            case "CHARACKTERS":
                return "Rowing Characters";
            case "DISCARD":
                return "Discard pile";
            default:
                return sTitle;
        }
    }

    static insertHtmlIntoContainer(pContainer, pHtml, type, sTitle)
    {
        const container = pContainer.querySelector(".view-card-list-container");
        
        if (container.hasAttribute("data-class"))
            container.setAttribute("class", container.getAttribute("data-class"));

        if (type !== "")
            container.classList.add("view-" + type);
        
        if (sTitle !== undefined && sTitle !== "")
        {
            const pTitle = pContainer.querySelector(".container-title-bar-title");
            if (pTitle !== null)
                pTitle.innerText = sTitle + " (" +  pHtml.childElementCount + ")";
        }

        const link = pContainer.querySelector(".container-title-bar-reveal a");
        if (link !== null)
            link.setAttribute("data-type", type);

        const elem = container.querySelector(".container-data");
        if (elem !== null)
        {
            DomUtils.removeAllChildNodes(elem);
            elem.appendChild(pHtml);
        }
        return elem;
    }

    static insertHtml(pHtml, type, sTitle) 
    {
        return ViewCardListContainer.insertHtmlIntoContainer(ViewCardListContainer.GetViewContainer(), pHtml, type, sTitle);
    }

    static createListHtml(vsList, bRevealPreview) 
    {
        if (typeof bRevealPreview === "undefined")
            bRevealPreview = true;

        let count = 0;
        const elem = document.createDocumentFragment();
        for (let card of vsList)
        {
            count++;
            elem.appendChild(ViewCardListContainer.createCardContainer(card.code, card.uuid, card.type, bRevealPreview, count));
        }

        return elem;
    }

    static scrollToTop(elem)
    {
        if (elem !== null)
            elem.scrollTo(0,0);
    }
}


class DiceRoller 
{
    /**
     * Create random number between [min,max]
     * @param {Number} min 
     * @param {Number} max 
     * @returns number between [min,max]
     */
    static #randomRoll(min=1, max=6)
    {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * Roll dice 1-6
     * @returns Number between [1,6]
     */
    static rollDice()
    {
        // create some random rolls first to add extra randomness
        const n = DiceRoller.#randomRoll(10, 20);
        for (let i = 0; i < n; i++)
            DiceRoller.#randomRoll(1, 6);

        return DiceRoller.#randomRoll(1, 6);
    }
}

class DynamicZoom {

    static #PROP_W = "--card-size-w";
    static #PROP_W_DEF = "--card-size-def-w";

    static #PROP_H = "--card-size-h";
    static #PROP_H_DEF = "--card-size-def-h";

    static #RATIO_94 = 94/130;

    static #saveChanges(w,h) 
    {
        const val = JSON.stringify({
            w: w, h:h
        })
        localStorage.setItem("zoom", val);
    }

    static #removeChanges()
    {
        if (localStorage.getItem("zoom"))
            localStorage.removeItem("zoom");
    }

    static #onReset()
    {
        const root = document.querySelector(':root');
        const styles = getComputedStyle(root);

        root.style.setProperty(DynamicZoom.#PROP_W, styles.getPropertyValue(DynamicZoom.#PROP_W_DEF));
        root.style.setProperty(DynamicZoom.#PROP_H, styles.getPropertyValue(DynamicZoom.#PROP_H_DEF));
        DynamicZoom.#removeChanges();
        return false;
    }

    static #inOrOut(val)
    {
        const root = document.querySelector(':root');
        const styles = getComputedStyle(root);
        const w = DynamicZoom.#getPropInt(styles, DynamicZoom.#PROP_W) + (val * DynamicZoom.#RATIO_94);
        const h = DynamicZoom.#getPropInt(styles, DynamicZoom.#PROP_H) + val;

        if (w <= 0 || h <= 0)
            return;

        root.style.setProperty(DynamicZoom.#PROP_W, w + "px");
        root.style.setProperty(DynamicZoom.#PROP_H, h + "px");
        DynamicZoom.#saveChanges(w, h);
    }

    static #getPropInt(styles, name)
    {
        let w = styles.getPropertyValue(name);
        if (typeof w !== "string" || w === "")
            return 0;

        const val = parseInt(w.replace("px", ""));
        if (isNaN(val))
            return 0;

        return Math.round(val);
    }

    static #onZoomIn()
    {
        DynamicZoom.#inOrOut(5);
    }

    static #onZoomOut()
    {
        DynamicZoom.#inOrOut(-5);
    }

    static init(bZoomIn, elem)
    {
        if (elem)
        {
            elem.onclick = bZoomIn ? DynamicZoom.#onZoomIn : DynamicZoom.#onZoomOut;
            elem.oncontextmenu = DynamicZoom.#onReset;
        }
    }

    static loadDefaults()
    {
        const val = localStorage.getItem("zoom");
        if (!val)
            return;

        try {
            const json = JSON.parse(val);
            const w = json.w;
            const h = json.h;

            if (w <= 0 || h <= 0)
                return;

            const root = document.querySelector(':root');
            root.style.setProperty(DynamicZoom.#PROP_W, w + "px");
            root.style.setProperty(DynamicZoom.#PROP_H, h + "px");
        }
        catch (err)
        {
            console.error(err);
        }
    }
}

class TaskBarCards 
{
    static #cardPreview = null;
    static #sageList = null;

    constructor(_CardList, _CardPreview)
    {
        ViewCardListContainer.CardList = _CardList;
        TaskBarCards.#cardPreview = _CardPreview;
        TaskBarCards.#requireStageCardList();

        ViewCardListContainer.init();
        
        const view = ViewCardListContainer.GetViewContainer();
        view.onclick = TaskBarCards.HideList;
        view.querySelector(".container-title-bar-shuffle").onclick = TaskBarCards.OnClickContainerShuffle;

        for (let elem of view.querySelectorAll(".container-title-bar-reveal a"))
        {
            elem.onclick = (e) => {
                const _data = e.target.getAttribute("data-type") || "";
                TaskBarCards.HideList();
                TaskBarCards.OnRevealToOpponent(_data);
                e.stopPropagation();
                return false;
            }
        }

        const iconHand = document.getElementById("icon_hand");
        if (iconHand !== null)
        {
            iconHand.onclick = TaskBarCards.OnClickIconHand;
            iconHand.oncontextmenu = () => 
            {
                TaskBarCards.OnRevealToOpponent("hand");
                return false;
            };
        }

        const iconHandEye = document.getElementById("icon_hand_eye");
        if (iconHandEye !== null)
        {
            iconHandEye.onclick = TaskBarCards.OnClickIconHand;
            iconHandEye.oncontextmenu = () => 
            {
                TaskBarCards.OnRevealToOpponent("hand");
                return false;
            };
        }

        document.getElementById("shared_outofplay").onclick = (e) => 
        {
            TaskBarCards.Show("outofplay");
            e.stopPropagation();
            return false;
        };

        document.getElementById("shared_victories").onclick = (e) => 
        {
            TaskBarCards.Show("victory");
            e.stopPropagation();
            return false;
        };

        document.getElementById("shared_victories").oncontextmenu = (e) => 
        {
            ContextMenu.contextActions.onContextVictoryActions(e);
            return false;
        }
       
        {
            const dice = document.getElementById("roll_dice_icons");
            if (dice !== null)
            {
                dice.onclick = (e) => 
                {
                    TaskBarCards.rollDiceCharacter("", "");
                    e.stopPropagation();
                    return false;
                };
        
                dice.oncontextmenu = (e) => 
                {
                    document.body.dispatchEvent(new CustomEvent("meccg-dice-chooser"));
                    e.stopPropagation();
                    return false;
                };
        
                dice.setAttribute("title", Dictionary.get("title_dice", "Click to roll the dice (press r or w)\nRIGHT CLICK to change dices"));
            }
        }
        

        {
            const img = document.getElementById("taskbar-background");
            if (img !== null)
                img.onclick = (e) => document.body.dispatchEvent(new CustomEvent("meccg-background-chooser"));

            DynamicZoom.init(true, document.getElementById("taskbar-zoom-in"));
            DynamicZoom.init(false, document.getElementById("taskbar-zoom-out"));
            DynamicZoom.loadDefaults();
        }

        {
            const iconHand = document.getElementById("roll_dice_icon_hand");
            if (iconHand !== null)
            {
                iconHand.onclick = (e) => 
                {
                    TaskBarCards.rollDiceCharacter("", "");
                    e.stopPropagation();
                    return false;
                };
            }
        }

        document.querySelector(".card-bar .sideboard").onclick = (e) => 
        {
            TaskBarCards.Show("sideboard", true);
            e.stopPropagation();
            return false;
        };

        document.querySelector(".card-bar-play .victory").onclick = (e) => 
        {
            TaskBarCards.Show("victory", true);
            e.stopPropagation();
            return false;
        };

        document.querySelector(".taskbar-score").onclick = (e) => 
        {
            const elem = document.getElementById("scoring-sheet");
            if (elem !== null && !elem.classList.contains("hidden"))
                elem.dispatchEvent(new CustomEvent("meccg-scoretable-close"));
            else
                MeccgApi.send("/game/score/show", "");

            e.stopPropagation();
            return false;
        };
        
        
        const pDiscard = document.querySelector(".card-bar .discardpile");
        if (pDiscard !== null)
        {
            pDiscard.onclick = TaskBarCards.onCLickDiscardPile;
            pDiscard.oncontextmenu = TaskBarCards.onRightClickDiscardPile;
        }

        const pPlaydeck = document.querySelector(".card-bar .playdeck");
        if (pPlaydeck !== null)
        {
            pPlaydeck.onclick = TaskBarCards.onClickPlaydeck;
            pPlaydeck.oncontextmenu = TaskBarCards.onRightClickPlaydeck;
        }

        for (let elem of document.querySelectorAll(".taskbar .taskbar-turn"))
            elem.onclick = TaskBarCards.OnTurnClick;
    }

    static #requireStageCardList()
    {
        if (TaskBarCards.#sageList !== null)
            return;

        fetch("/data/list/stages")
        .then(result => result.json())
        .then(list => TaskBarCards.#sageList = Array.isArray(list) ? list : [])
        .catch(() => TaskBarCards.#sageList = []);        
    }

    static onClickPlaydeck(e)
    {
        if (localStorage.getItem("draw_onclick_deck"))
        {
            const elem = document.getElementById("draw_card");
            if (elem && elem.click)
            {
                elem.click();
                return false;                
            }
        }

        TaskBarCards.Show("playdeck", true);
        return false;
    }

    static onRightClickPlaydeck(e)
    {
        ContextMenu.contextActions.onContextPlayDeckActions(e);
        return false;
    }

    static onCLickDiscardPile(e)
    {
        TaskBarCards.Show("discard", true);
        return false;
    }

    static onRightClickDiscardPile(e)
    {
        ContextMenu.contextActions.onContextDiscardPileActions(e);
        return false;
    }

    static rollDiceCharacter(uuid, code)
    {
        const val1 = DiceRoller.rollDice();
        const val2 = DiceRoller.rollDice();
        MeccgApi.send("/game/dices/roll", { 
            r1: val1, 
            r2: val2,
            uuid : uuid,
            code: code
        });
        return false;
    }

    static OnClickContainerShuffle(e) 
    {
        TaskBarCards.HideList();
        e.stopPropagation();
        return false;
    }

    static OnRevealToOpponent(type) 
    {
        switch (type) 
        {
            case "discard":
            {
                new Question("fa-sign-out")
                .onOk(() => {

                    TaskBarCards.ShuffleDiscardPile();

                    new PlayerSelectorActionCallback()
                    .includeAllOption(true)
                    .setCallback((_myid, other) => {
                        const data = {
                            type: type,
                            opponentid: other
                        }
                        MeccgApi.send("/game/view-cards/reveal-pile", data);
                    })
                    .onChoosePlayer();
                })
                .onCancel(() => {
                    
                    new PlayerSelectorActionCallback()
                    .includeAllOption(true)
                    .setCallback((_myid, other) => {
                        const data = {
                            type: type,
                            opponentid: other
                        }
                        MeccgApi.send("/game/view-cards/reveal-pile", data);
                    })
                    .onChoosePlayer();
                })
                .show("Shuffle discardpile first?", "Do you want to shuffle your discard pile before revealing it?", "Yes, shuffle first", "No");
                break;
            }
            case "sideboard":
            case "playdeck":
            case "hand":

                new PlayerSelectorActionCallback()
                    .includeAllOption(true)
                    .setCallback((_myid, other) => {
                        const data = {
                            type: type,
                            opponentid: other
                        }
                        MeccgApi.send("/game/view-cards/reveal-pile", data);
                    })
                    .onChoosePlayer();

                break;

            default:
                break;
        }
    }

    static Show(type, isSorted) 
    {
        MeccgApi.send("/game/view-cards/list", {type: type, sorted: isSorted=== true });
    }

    static SetPileSize(span, val)
    {
        if (span == null || typeof val === "undefined")
            return;

        span.innerText = val;

        const num = typeof val === "number" ? val : parseInt(val);

        let cssClass = "";
        if (!isNaN(num)) try
        {
            if (num > 40)
                cssClass = "size-many"
            else if (num > 20)
                cssClass = "size-middle";
            else if (num > 5)
                cssClass = "size-few";
        }
        catch (exIgnore)
        {

        }

        span.parentElement.setAttribute("data-size", cssClass);
    }

    static onShowVictorySheet(e) 
    {
        const vsList = e === undefined ? null : e.detail;
        if (vsList === null || typeof vsList === "undefined" || vsList.length === 0)
            return;

        const type = "victory";
        const pHtml = ViewCardListContainer.createListHtml(vsList, true);

        const elem = ViewCardListContainer.insertHtmlIntoContainer(document.getElementById("view-score-sheet-card-list"), pHtml, type, "");
        const hov = elem.querySelectorAll(".card-hand");
        const len = hov.length;
        for (let i = 0; i < len; i++)
            TaskBarCards.#cardPreview.initGeneric(hov[i]);
    }

    onShow(jData) 
    {
        const bICanSee = !GamePreferences.offerBlindly();
        const elem = this.#onShowList(jData, "Looking at your ", bICanSee);
        if (elem === null)
            return false;

        for (let _dom of elem.querySelectorAll(".card-hand a"))
            _dom.onclick = TaskBarCards.OnClickCardIconNonOffered;

        ViewCardListContainer.ShowViewContainer();
        return true;
    }

    onShowOnOffer(bIsMe, jData) 
    {
        if (!bIsMe && jData.playerid !== "" && jData.playerid !== MeccgPlayers.getChallengerId())
            return false;

        const bICanSee = !GamePreferences.offerBlindly();
        const elem = this.#onShowList(jData, bIsMe ? "Offer to show cards from " : "Opponents card from ", bICanSee);
        if (elem === null)
            return false;

        if (bIsMe) 
        {
            for (let _elem of elem.querySelectorAll("img"))
            {
                const backside = _elem.getAttribute("data-image-backside");
                _elem.setAttribute("data-image-backside", _elem.getAttribute("src"));
                _elem.setAttribute("src", backside);
            }
            
            for (let _elem of elem.querySelectorAll(".card-hand a"))
                _elem.onclick = TaskBarCards.OnClickCardIconOffered;
        }
        else
            this.#flipCards(elem);

        if (bIsMe)
            this.#addOfferedInfo(".view-card-list-container", "offer");
        else
            this.#addOfferedInfo(".view-card-list-container", "offered");

        return true;
    }

    #addOfferedInfo(sIdentifier, sAddCss)
    {
        const jContainer = ViewCardListContainer.GetViewContainer();
        for (let elem of jContainer.querySelectorAll(sIdentifier))
            elem.classList.add(sAddCss);

        jContainer.classList.remove("hidden");
    }

    onShowOnOfferReveal(sUuid) 
    {
        let jImage = ViewCardListContainer.GetViewContainer().querySelector(".container-data").querySelector('div[data-uuid="' + sUuid + '"] img');
        if (jImage === null)
            return;

        const backside = jImage.getAttribute("data-image-backside");
        if (backside !== null && backside.indexOf("/backside") === -1) 
        {
            let sSrc = jImage.getAttribute("src") || "";
            jImage.setAttribute("src", jImage.getAttribute("data-image-backside"));
            jImage.setAttribute("data-image-backside", sSrc);
        }
    }

    onShowOnOfferRemove(sUuid) 
    {
        let cardDiv = ViewCardListContainer.GetViewContainer().querySelector('div[data-uuid="' + sUuid + '"]');
        if (cardDiv !== null)
            cardDiv.classList.add("hiddenVisibility");
    }

    hideOffer() 
    {
        const jViewContainer = ViewCardListContainer.GetViewContainer();
        if (!jViewContainer.classList.contains("hidden"))
            TaskBarCards.HideListContainer(jViewContainer, jViewContainer.querySelector(".view-card-list-container"));
    }

    #flipCards(jContainer) 
    {
        const res = jContainer.querySelectorAll("img.card-icon");
        const len = res === null ? 0 : res.length;
        for (let i = 0; i < len; i++)
        {
            let jthis = res[i];
            const backside = jthis.getAttribute("data-image-backside") || "";
            if (backside.indexOf("/backside") !== -1) 
            {
                let sSrc = jthis.getAttribute("src");
                jthis.setAttribute("src", jthis.getAttribute("data-image-backside"));
                jthis.setAttribute("data-image-backside", sSrc);
            }
        }
    }

    static HideList() 
    {
        const jViewContainer = ViewCardListContainer.GetViewContainer();
        if (jViewContainer === null || jViewContainer.classList.contains("hidden"))
            return;

        const jContainer = jViewContainer.querySelector(".view-card-list-container");

        let isOfferred = jContainer.classList.contains("offered");
        let isOffer = jContainer.classList.contains("offer");

        TaskBarCards.HideListContainer(jViewContainer, jContainer);

        if (isOfferred)
            MeccgApi.send("/game/view-cards/list/close", { offered: true });
        else if (isOffer)
            MeccgApi.send("/game/view-cards/list/close", { offered: false });
    }

    #sortCardList(list)
    {
        const arrChars = [];
        const arrStage = [];
        const arrHaz = [];
        const arrRes = [];

        for (let card of list)
        {
            if (this.#isStageCode(card.code))
                arrStage.push(card);
            else if (card.type === "hazard")
                arrHaz.push(card);
            else if (card.type === "resource")
                arrRes.push(card);
            else
                arrChars.push(card);
        }

        arrChars.sort(this.#sortCards.bind(this));
        arrStage.sort(this.#sortCards.bind(this));
        arrHaz.sort(this.#sortCards.bind(this));
        arrRes.sort(this.#sortCards.bind(this));

        return arrChars.concat(arrStage, arrRes, arrHaz);
    }

    #sortCards(a,b)
    {
        return a.code.localeCompare(b.code)
    }

    #isStageCode(code)
    {
        return TaskBarCards.#sageList !== null && TaskBarCards.#sageList.includes(code.toLowerCase());
    }

    #onShowList(jData, sTitle, bICanSeeIt) 
    {
        TaskBarCards.HideList();

        if (typeof bICanSeeIt === "undefined")
            bICanSeeIt = false;

        if (jData.list === null || typeof jData.list === "undefined" || !Array.isArray(jData.list) || jData.list.length === 0) 
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "no cards to display in " + jData.type }));
            return null;
        }

        const type = jData.type;
        const  vsList = type === "sideboard" || jData.sorted === true ? this.#sortCardList(jData.list) : jData.list;
        const pHtml = ViewCardListContainer.createListHtml(vsList, bICanSeeIt);
        const elem = ViewCardListContainer.insertHtml(pHtml, type, sTitle + ViewCardListContainer.requestTitle(type).toUpperCase());
        
        /** I myself should not see my own offering cards so only the opponent knows it */
        if (bICanSeeIt) 
        {
            const res = elem.querySelectorAll(".card-hand");
            for (let _elem of res)
                TaskBarCards.#cardPreview.initGeneric(_elem);
        }

        return elem;
    }

    static OnClickCardIconOffered(e) 
    {
        TaskBarCards.#OnClickCardIcon(true, e.target);
        e.stopPropagation();
        return false;
    }

    static OnClickCardIconNonOffered(e) 
    {
        TaskBarCards.#OnClickCardIcon(false, e.target);
        e.stopPropagation();
        return false;
    }

    static #OnClickCardIcon(isOffer, jLink) 
    {
        const target = jLink.getAttribute("data-move-to");
        const bShuffle = jLink.getAttribute("data-shuffle") === "true";
        const cardDiv = jLink.parentElement.parentElement;
        const sUuid = cardDiv.getAttribute("data-uuid");

        if (target === "offer") /* offer the card */
        {
            MeccgApi.send("/game/view-cards/offer-reveal", { uuid: sUuid });
        
            cardDiv.querySelector("img.card-icon").classList.add("on-offer-orevealed");
            return;
        }

        cardDiv.classList.add("hiddenVisibility");

        MeccgApi.send("/game/card/move", { uuid: sUuid, target: target, drawTop: target === "hand", shuffle: bShuffle });
        if (isOffer) 
        {
            MeccgApi.send("/game/view-cards/offer-remove", { uuid: sUuid });
            DomUtils.removeAllChildNodes(document.getElementById("card_icon_nr_" + sUuid));
        }
    }

    static HideListContainer(jViewContainer, jContainer) 
    {
        if (!jViewContainer.classList.contains("hidden"))
            jViewContainer.classList.add("hidden");

        jContainer.setAttribute("class", jContainer.getAttribute("data-class"));

        DomUtils.removeAllChildNodes(jContainer.querySelector(".container-data"));

        if (jContainer.classList.contains("offered"))
            jContainer.classList.remove("offered");

        if (jContainer.classList.contains("offer"))
            jContainer.classList.remove("offer");
    }

    static ShuffleDiscardPile(e)
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "discardpile" });
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("game.shuffled", "Discardpile shuffled.") }));

        if (e !== undefined && typeof e.stopPropagation !== "undefined")
            e.stopPropagation();

        return false
    }

    static ShufflePlaydeck(e) 
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "playdeck" });
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("taskbar_shuffled", "Playdeck shuffled.") }));

        if (e !== undefined && typeof e.stopPropagation !== "undefined")
            e.stopPropagation();

        return false
    }

    static #onArdaHandToggle()
    {
        const elem = document.getElementById("arda-action-container-mps");
        if (elem === null || Arda === null || Arda === undefined)
            return;

        if (typeof Arda.toggleViewOnElement === "function")
            Arda.toggleViewOnElement("arda_mps")
    }

    static OnClickIconHand(e) 
    {
        const elem = document.getElementById("icon_hand");
        if (elem !== null)
        {
            if (elem.classList.contains("act")) 
            {
                document.getElementById("playercard_hand").classList.add("card-hands-hidden");
                elem.classList.remove("act");
            }
            else 
            {
                document.getElementById("playercard_hand").classList.remove("card-hands-hidden");
                elem.classList.add("act");

                /** query cards in hand */
                MeccgApi.send("/game/card/hand", {});
            }
        }

        TaskBarCards.#onArdaHandToggle();

        e.stopPropagation();
        return false;
    }

    static ShuffleDiscardpile(e) 
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "discardpile" });
        e.stopPropagation();
        return false
    }

    static OnTurnClick(e) 
    {
        if (!e.target.classList.contains("act")) 
        {
            const sPhase = e.target.getAttribute("data-phase") || "";
            MeccgApi.send("/game/phase/set", sPhase);
        }

        e.stopPropagation();
        return false;
    }
}
    

class TaskBarCardsInterface 
{
    #TaskBarCards;

    constructor(pCardList, pCardPreview)
    {
        this.#TaskBarCards = new TaskBarCards(pCardList, pCardPreview);
    }

    onShow(_bIsMe, jData) 
    {
        this.#TaskBarCards.onShow(jData);
    }

    onShowOnOffer(bIsMe, jData) 
    {
        this.#TaskBarCards.onShowOnOffer(bIsMe, jData);
    }

    onShowOnOfferReveal(uuid) 
    {
        this.#TaskBarCards.onShowOnOfferReveal(uuid)
    }

    onShowOnOfferRemove(uuid) 
    {
        this.#TaskBarCards.onShowOnOfferRemove(uuid)
    }

    hideOffer()
    {
        this.#TaskBarCards.hideOffer();
    }
}

document.body.addEventListener("meccg-show-victory-sheet", TaskBarCards.onShowVictorySheet, false);
