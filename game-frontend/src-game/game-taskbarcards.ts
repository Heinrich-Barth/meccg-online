import CardPreview from "./card-preview";
import CardList from "./utils/cardlist";
import ContextMenu from "./contextmenu/contextmenu";
import Dictionary from "./utils/dictionary";
import DomUtils from "./utils/libraries";
import MeccgApi, { MeccgPlayers } from "./meccg-api";
import { PlayerSelectorActionCallback } from "./preferences/PlayerSelectorAction";
import { GamePreferences } from "./preferences/preferences-game";
import Question from "./question/question";

declare const Arda:any;

export class ViewCardListContainer {

    static CONTAINER_ID = "view_card_list_container";

    static CardList:any = null;

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
                        <div class="container-title-bar-divider hideOnOffer fl">&nbsp;&dash;&nbsp;</div>
                        <div class="container-title-bar-reveal hideOnOffer fl"><a href="#" title="show to your opponent" data-type="">reveal to opp.</a></div>
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

    static createCardContainer(code:string, uuid:string, type:string, bShowCardPreview:boolean, cardNumber:number) 
    {
        let _img = ViewCardListContainer.CardList?.getImage(code) ?? "";
        let sCode = ViewCardListContainer.CardList?.getSafeCode(code) ?? "";

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
        elem.innerHTML = `<img src="${_img}" data-id="${uuid}" class="card-icon" crossorigin="anonymous" decoding="async" data-image-backside="/data/backside">
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
            data.innerText = "" + cardNumber;
            elem.appendChild(data);
        } 
    
        return elem;
    }

    static requestTitle(sTitle:string)
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

    static insertHtmlIntoContainer(pContainer:any, pHtml:any, type:string, sTitle:string)
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

    static insertHtml(pHtml:any, type:string, sTitle:string) 
    {
        return ViewCardListContainer.insertHtmlIntoContainer(ViewCardListContainer.GetViewContainer(), pHtml, type, sTitle);
    }

    static createListHtml(vsList:any, bRevealPreview:boolean) 
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

    static scrollToTop(elem:any)
    {
        if (elem)
            elem.scrollTo(0,0);
    }
}

export class DiceRoller 
{
    static getDiceValue() : number
    {
        let val = Math.trunc(Math.random() * 10) + 1;
        return val >= 1 && val <= 6 ? val : DiceRoller.getDiceValue();
    }
        
    static rollDice()
    {
        let val = 0;

        const times = 50 + Math.floor(Math.random() * 100);
        for (let i = 0; i < times; i++)
            val = DiceRoller.getDiceValue();

        return val;
    }
}

export class TaskBarCards 
{
    static #cardPreview:any = null;
    static #sageList:any = null;

    static getCardPreview()
    {
        return TaskBarCards.#cardPreview;
    }

    constructor()
    {
        ViewCardListContainer.CardList = CardList();
        TaskBarCards.#cardPreview = CardPreview;
        TaskBarCards.#requireStageCardList();

        ViewCardListContainer.init();
        
        const view:any = ViewCardListContainer.GetViewContainer();
        if (view === null)
            return;

        view.onclick = TaskBarCards.HideList;
        view.querySelector(".container-title-bar-shuffle").onclick = TaskBarCards.OnClickContainerShuffle;

        for (let elem of view.querySelectorAll(".container-title-bar-reveal a"))
        {
            elem.onclick = (e:any) => {
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

        document.getElementById("shared_outofplay")!.onclick = (e:any) => 
        {
            TaskBarCards.Show("outofplay");
            e.stopPropagation();
            return false;
        };

        document.getElementById("shared_victories")!.onclick = (e:any) => 
        {
            TaskBarCards.Show("victory");
            e.stopPropagation();
            return false;
        };

        document.getElementById("shared_victories")!.oncontextmenu = (e:any) => 
        {
            ContextMenu.contextActions.onContextVictoryActions(e);
            return false;
        }
       
        {
            const dice = document.getElementById("roll_dice_icons");
            if (dice !== null)
            {
                dice.onclick = (e:any) => 
                {
                    TaskBarCards.rollDiceCharacter("", "");
                    e.stopPropagation();
                    return false;
                };
        
                dice.oncontextmenu = (e:any) => 
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
                img.onclick = (e:any) => document.body.dispatchEvent(new CustomEvent("meccg-background-chooser"));
        }

        {
            const iconHand = document.getElementById("roll_dice_icon_hand");
            if (iconHand !== null)
            {
                iconHand.onclick = (e:any) => 
                {
                    TaskBarCards.rollDiceCharacter("", "");
                    e.stopPropagation();
                    return false;
                };
            }
        }

        (document.querySelector(".card-bar .sideboard") as any).onclick = (e:any) => 
        {
            TaskBarCards.Show("sideboard", true);
            e.stopPropagation();
            return false;
        };

        (document.querySelector(".card-bar-play .victory") as any).onclick = (e:any) => 
        {
            TaskBarCards.Show("victory", true);
            e.stopPropagation();
            return false;
        };

        (document.querySelector(".taskbar-score") as any).onclick = (e:any) => 
        {
            const elem = document.getElementById("scoring-sheet");
            if (elem !== null && !elem.classList.contains("hidden"))
                elem.dispatchEvent(new CustomEvent("meccg-scoretable-close"));
            else
                MeccgApi.send("/game/score/show", "");

            e.stopPropagation();
            return false;
        };
        
        
        const pDiscard:any = document.querySelector(".card-bar .discardpile");
        if (pDiscard !== null)
        {
            pDiscard.onclick = TaskBarCards.onCLickDiscardPile;
            pDiscard.oncontextmenu = TaskBarCards.onRightClickDiscardPile;
        }

        const pPlaydeck:any = document.querySelector(".card-bar .playdeck");
        if (pPlaydeck !== null)
        {
            pPlaydeck.onclick = TaskBarCards.onClickPlaydeck;
            pPlaydeck.oncontextmenu = TaskBarCards.onRightClickPlaydeck;
        }

        for (let elem of document.querySelectorAll(".taskbar .taskbar-turn") as any)
            (elem as any).onclick = TaskBarCards.OnTurnClick;
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

    static onClickPlaydeck(e:any)
    {
        TaskBarCards.Show("playdeck", true);
        return false;
    }

    static onRightClickPlaydeck(e:any)
    {
        ContextMenu.contextActions.onContextPlayDeckActions(e);
        return false;
    }

    static onCLickDiscardPile(e:any)
    {
        TaskBarCards.Show("discard", true);
        return false;
    }

    static onRightClickDiscardPile(e:any)
    {
        ContextMenu.contextActions.onContextDiscardPileActions(e);
        return false;
    }

    static rollDiceCharacter(uuid:string, code:string)
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

    static OnClickContainerShuffle(e:any) 
    {
        TaskBarCards.HideList();
        TaskBarCards.ShufflePlaydeck(null);
        
        e.stopPropagation();
        return false;
    }

    static OnRevealToOpponent(type:string) 
    {
        switch (type) 
        {
            case "discard":
            {
                new Question("fa-sign-out")
                .onOk(() => {

                    TaskBarCards.ShuffleDiscardPile(null);

                    new PlayerSelectorActionCallback()
                    .includeAllOption(true)
                    .setCallback((_myid:string, other:string) => {
                        const data = {
                            type: type,
                            opponentid: other
                        }
                        MeccgApi.send("/game/view-cards/reveal-pile", data);
                    })
                    .onChoosePlayer(null);
                })
                .onCancel(() => {
                    
                    new PlayerSelectorActionCallback()
                    .includeAllOption(true)
                    .setCallback((_myid:string, other:string) => {
                        const data = {
                            type: type,
                            opponentid: other
                        }
                        MeccgApi.send("/game/view-cards/reveal-pile", data);
                    })
                    .onChoosePlayer(null);
                })
                .show("Shuffle discardpile first?", "Do you want to shuffle your discard pile before revealing it?", "Yes, shuffle first", "No");
                break;
            }
            case "sideboard":
            case "playdeck":
            case "hand":

                new PlayerSelectorActionCallback()
                    .includeAllOption(true)
                    .setCallback((_myid:string, other:string) => {
                        const data = {
                            type: type,
                            opponentid: other
                        }
                        MeccgApi.send("/game/view-cards/reveal-pile", data);
                    })
                    .onChoosePlayer(null);

                break;

            default:
                break;
        }
    }

    static Show(type:string, isSorted = true) 
    {
        MeccgApi.send("/game/view-cards/list", {type: type, sorted: isSorted=== true });
    }

    static SetPileSize(span:any, val:any)
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

    static onShowVictorySheet(e:any) 
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
            TaskBarCards.getCardPreview()?.initGeneric(hov[i]);
    }

    onShow(jData:any) 
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

    onShowOnOffer(bIsMe:boolean, jData:any) 
    {
        if (!bIsMe && jData.playerid !== "" && jData.playerid !== MeccgPlayers.getChallengerId())
            return false;

        const bICanSee = !GamePreferences.offerBlindly();
        const elem = this.#onShowList(jData, bIsMe ? "Offer to show cards from " : "Opponents card from ", bICanSee);
        if (elem === null)
            return false;

        if (bIsMe) 
        {
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

    #addOfferedInfo(sIdentifier:string, sAddCss:string)
    {
        const jContainer:any = ViewCardListContainer.GetViewContainer();
        for (let elem of jContainer.querySelectorAll(sIdentifier))
            elem.classList.add(sAddCss);

        jContainer.classList.remove("hidden");
    }

    onShowOnOfferReveal(sUuid:string) 
    {
        const jImage:any = ViewCardListContainer.GetViewContainer()?.querySelector(".container-data")?.querySelector('div[data-uuid="' + sUuid + '"] img');
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

    onShowOnOfferRemove(sUuid:string) 
    {
        const cardDiv:any = ViewCardListContainer.GetViewContainer()?.querySelector('div[data-uuid="' + sUuid + '"]');
        if (cardDiv !== null)
            cardDiv.classList.add("hiddenVisibility");
    }

    hideOffer() 
    {
        const jViewContainer = ViewCardListContainer.GetViewContainer();
        if (jViewContainer && !jViewContainer.classList.contains("hidden"))
            TaskBarCards.HideListContainer(jViewContainer, jViewContainer.querySelector(".view-card-list-container"));
    }

    #flipCards(jContainer:any) 
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
        const jViewContainer:any = ViewCardListContainer.GetViewContainer();
        if (jViewContainer === null || jViewContainer.classList.contains("hidden"))
            return;

        const jContainer:any = jViewContainer.querySelector(".view-card-list-container");
        if (jContainer === null)
            return;

        let isOfferred = jContainer.classList.contains("offered");
        let isOffer = jContainer.classList.contains("offer");

        TaskBarCards.HideListContainer(jViewContainer, jContainer);

        if (isOfferred)
            MeccgApi.send("/game/view-cards/list/close", { offered: true });
        else if (isOffer)
            MeccgApi.send("/game/view-cards/list/close", { offered: false });
    }

    #sortCardList(list:any)
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

    #sortCards(a:any,b:any)
    {
        return a.code.localeCompare(b.code)
    }

    #isStageCode(code:string)
    {
        return TaskBarCards.#sageList !== null && TaskBarCards.#sageList.includes(code.toLowerCase());
    }

    #onShowList(jData:any, sTitle:string, bICanSeeIt:boolean) 
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

    static OnClickCardIconOffered(e:any) 
    {
        TaskBarCards.#OnClickCardIcon(true, e.target);
        e.stopPropagation();
        return false;
    }

    static OnClickCardIconNonOffered(e:any) 
    {
        TaskBarCards.#OnClickCardIcon(false, e.target);
        e.stopPropagation();
        return false;
    }

    static #OnClickCardIcon(isOffer:boolean, jLink:any) 
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

    static HideListContainer(jViewContainer:any, jContainer:any) 
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

    static ShuffleDiscardPile(e:any)
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "discardpile" });
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("game.shuffled", "Discardpile shuffled.") }));

        if (e !== undefined && typeof e.stopPropagation !== "undefined")
            e.stopPropagation();

        return false
    }

    static ShufflePlaydeck(e:any) 
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "playdeck" });
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("taskbar_shuffled", "Playdeck shuffled.") }));

        if (e && typeof e.stopPropagation !== "undefined")
            e.stopPropagation();

        return false
    }

    static #onArdaHandToggle()
    {
        const elem = document.getElementById("arda-action-container-mps");
        if (elem)
            Arda.toggleViewOnElement("arda_mps")
    }

    static OnClickIconHand(e:any) 
    {
        const elem = document.getElementById("icon_hand");
        if (elem !== null)
        {
            if (elem.classList.contains("act")) 
            {
                document.getElementById("playercard_hand")?.classList.add("card-hands-hidden");
                elem.classList.remove("act");
            }
            else 
            {
                document.getElementById("playercard_hand")?.classList.remove("card-hands-hidden");
                elem.classList.add("act");

                /** query cards in hand */
                MeccgApi.send("/game/card/hand", {});
            }
        }

        TaskBarCards.#onArdaHandToggle();

        e.stopPropagation();
        return false;
    }

    static ShuffleDiscardpile(e:any) 
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "discardpile" });
        e.stopPropagation();
        return false
    }

    static OnTurnClick(e:any) 
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
    

class TaskBarCardsInterfaceImpl
{
    #TaskBarCards = new TaskBarCards();

    onShow(_bIsMe:boolean, jData:any) 
    {
        this.#TaskBarCards.onShow(jData);
    }

    onShowOnOffer(bIsMe:boolean, jData:any)
    {
        this.#TaskBarCards.onShowOnOffer(bIsMe, jData);
    }

    onShowOnOfferReveal(uuid:string) 
    {
        this.#TaskBarCards.onShowOnOfferReveal(uuid)
    }

    onShowOnOfferRemove(uuid:string) 
    {
        this.#TaskBarCards.onShowOnOfferRemove(uuid)
    }

    hideOffer()
    {
        this.#TaskBarCards.hideOffer();
    }

    SetPileSize(span:any, val:any)
    {
        TaskBarCards.SetPileSize(span, val);
    }
}

const TaskBarCardsInterface = new TaskBarCardsInterfaceImpl();
export { TaskBarCardsInterface }

document.body.addEventListener("meccg-show-victory-sheet", TaskBarCards.onShowVictorySheet, false);
