import CardList from "../utils/cardlist";
import Dictionary from "../utils/dictionary";
import { HandCardsDraggable } from "../handcards-draggable";
import DomUtils, { ArrayList } from "../utils/libraries";
import MeccgApi from "../meccg-api";
import Question from "../question/question";
import { ResolveHandSizeContainer, ResolveHandSizeFirst } from "./resolvehandsize";
import CreateHandCardsDraggableUtils from "../utils/CreateHandCardsDraggableUtils";
import ArdaExchangeBox, { ArdaOnTradeSuccess } from "./exchangebox";
import { TaskBarCardsInterface } from "../game-taskbarcards";
import CardPreview from "../card-preview";

declare const g_sLobbyToken:string;

class Arda implements ArdaOnTradeSuccess {

    _ready = false;
    _hasReceivedMinor = false;
    _hasReceivedMps = false;
    _hasReceivedCharacters = false;
    _idCount = 1;
    _exchangeBox = new ArdaExchangeBox(this);

    createHtmlElement(_code:string, _img:string, _uuid:string, type:string)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "card-hand transition-grow-shrink");
        div.setAttribute("draggable", "true");
        div.setAttribute("id", "arda-hand-card-" + _uuid);
        div.setAttribute("data-location", "hand");
        div.setAttribute("data-uuid", _uuid);
        div.setAttribute("data-card-code", CardList().getSafeCode(_code));

        if (type === "charackters")
        {
            div.setAttribute("title", Dictionary.get("arda_drag_char", "Drag card to play it or \nDOUBLECLICK to create new company without dragging it."));
            div.setAttribute("data-card-type", "character");
            div.setAttribute("data-translate-title", "arda_drag_char");
        }
        else 
        {
            div.setAttribute("title", Dictionary.get("arda_drag_res", "Drag card to play it or \nDOUBLECLICK to play card without dragging it."));
            div.setAttribute("data-card-type", "resource");
            div.setAttribute("data-translate-title", "arda_drag_res");
        }

        const cardImage = document.createElement("img");
        cardImage.setAttribute("crossorigin", "anonymous");
        cardImage.setAttribute("data-id", _code);
        cardImage.setAttribute("class", "card-icon");
        cardImage.setAttribute("src", _img);
        cardImage.ondblclick = this.onDoubleClickCard.bind(this);
        div.append(cardImage);

        const divHover = document.createElement("div");
        divHover.setAttribute("class", "arda-actions");

        let aHand;
        
        aHand = document.createElement("img");
        aHand.setAttribute("src", "/media/assets/images/icons/icon-discardpile.png");
        aHand.setAttribute("data-to", "discardpile");
        aHand.setAttribute("data-from", type);
        aHand.setAttribute("data-uuid", _uuid);
        aHand.setAttribute("data-code", _code);
        aHand.setAttribute("data-translate-title", "arda_discard")
        aHand.setAttribute("title", Dictionary.get("arda_discard", "Discard this card"));
        aHand.onclick = this.onCardAction.bind(this);
        divHover.appendChild(aHand);

        aHand = document.createElement("img");
        aHand.setAttribute("src", "/media/assets/images/icons/icon-hand.png");
        aHand.setAttribute("data-to", "hand");
        aHand.setAttribute("data-from", type);
        aHand.setAttribute("data-uuid", _uuid);
        aHand.setAttribute("data-code", _code);
        aHand.setAttribute("data-translate-title", "arda_tohand")
        aHand.setAttribute("title", Dictionary.get("arda_tohand", "Move to your hand"));
        aHand.onclick = this.onCardAction.bind(this);
        divHover.appendChild(aHand);
        
        div.appendChild(divHover);

        HandCardsDraggable.initDraggableCard(div);
        return div;
    }

    onDoubleClickCard(e:any)
    {
        const elem = e.target.parentElement;
        const uuid = elem.hasAttribute("data-uuid") ? elem.getAttribute("data-uuid") : "";

        if (uuid === "")
            return false;

        CreateHandCardsDraggableUtils.removeDraggableDomElement(elem);
        HandCardsDraggable.onCreateNewCompany(uuid, "hand");
        return false;
    }

    /**
     * Take a card to hand or discard it
     * @param {Event} e 
     */
    onCardAction (e:any)
    {
        const elem = e.target;
        const data = {
            code : elem.getAttribute("data-code"),
            uuid : elem.getAttribute("data-uuid"),
            type : elem.getAttribute("data-from"),
            to : elem.getAttribute("data-to"),
        };

        MeccgApi.send("/game/arda/from-hand", data);
    }

    addCss ()
    {
        /** add CSS  */
        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href","/dist-client/css/game-arda.css?version=" + Date.now());
        document.head.appendChild(link);
        document.body.classList.add("game-arda");
    }

    updateSinglePlayer ()
    {
        if (this.isSinglePlayer())
        {
            DomUtils.remove(document.getElementById("arda-action-container-randomchars"));
            DomUtils.remove(document.getElementById("arda-action-container-minor"));
            DomUtils.remove(document.getElementById("arda-action-container-charackters"));

            DomUtils.remove(document.getElementById("arda_minors_hand"));
            DomUtils.remove(document.getElementById("arda_characters_hand"));
        }
    }

    init ()
    {
        if (this._ready)
            return;
    
        const bAllowRecyling = this.isAdraAdmin();

        this.addCss();

        if (!this.isSinglePlayer() && bAllowRecyling)
            this.insertArdaSetupContainer();

        const idMps = this.createContainer("arda_mps", "mps", "Marshalling Points", 5, false)
        document.getElementById(idMps)?.classList.remove("hidden");

        this.createContainer("arda_stage", "stage", "Common Stage Cards", 5, false);

        this.createContainer("arda_minors", "minor", "Minor Item Offerings", 4, bAllowRecyling);
        this.createContainer("arda_characters", "charackters", "Roving Characters", 4, bAllowRecyling);

        this.insertArdaContainer();
        this.getOpeningHands();
        this.updateSinglePlayer();

        if (!this.isSinglePlayer())
        {
            this._exchangeBox = new ArdaExchangeBox(this);
            this._exchangeBox.create("arda_mps_hand");
        }
        
        this._ready = true;
        MeccgApi.send("/game/arda/checkdraft", {});
        MeccgApi.send("/game/arda/sites", {});
    }

    isSinglePlayer()
    {
        return document.body.getAttribute("data-is-singleplayer") === "true";
    }

    getOpeningHands()
    {
        MeccgApi.send("/game/arda/hands", { });
    }

    getRegularHand()
    {
        MeccgApi.send("/game/card/hand", { });
    }

    insertArdaSetupContainer ()
    {
        if (document.getElementById("arda-setup-container") !== null)
            return;

        const container = document.createElement("div");
        container.setAttribute("id", "arda-setup-container");
        container.setAttribute("class", "blue-box arda-setup-container hidden");

        const title = document.createElement("h2");
        title.innerText = "Arda Setup Guide";
        container.appendChild(title);

        const divWrapp = document.createElement("div");
        divWrapp.setAttribute("id", "arda-setup-container-content");
        container.append(divWrapp);

        document.body.appendChild(container);
    }

    insertArdaContainer ()
    {
        const divChars = document.createElement("div");
        divChars.setAttribute("class", "arda-hand-wrapper arda-hand-wrapper-characters");
        this.insertMp(divChars, "fa-users", "Roving Characters", "charackters", "arda_characters", "");

        const divMinors = document.createElement("div");
        divMinors.setAttribute("class", "arda-hand-wrapper arda-hand-wrapper-minor");
        this.insertMp(divMinors, "fa-shield", "Minor Item Offerings", "minor", "arda_minors", "");

        const divStage = document.createElement("div");
        divStage.setAttribute("class", "arda-hand-wrapper arda-hand-wrapper-stage");
        this.insertMp(divStage, "fa-adjust", "Stage Cards", "stage", "arda_stage", "");

        document.body.append(divChars, divMinors, divStage);
    }

    isAdraAdmin ()
    {
        return g_sLobbyToken !== "";
    }

    insertPlayerSelectIndicator ()
    {
        /** not needed here */
    }
    
    insertOnceAction (parent:any, html:string, title:string, dataType:string, playerId:string, label:any, count:number)
    {
        const div = this.insertMp(parent, html, title, dataType, playerId, label);
        const i = div.querySelector("i");
        if (i === null)
            return;
        
        i.onclick = () =>
        { 
            DomUtils.empty(div);
            div.classList.add("hidden");

            const elem = document.getElementById("arda_characters_hand");
            if (elem !== null)
                elem.classList.remove("hidden");

            MeccgApi.send("/game/arda/assign-characters", { count: count });
        };
    }

    insertMp (parent:any, html:string, title:string, dataType:string, playerId:string, label:any)
    {
        const a = document.createElement("i");

        a.setAttribute("data-type", dataType);
        a.setAttribute("data-player", playerId);
        a.setAttribute("id", "arda-action-container-" + dataType);
        a.setAttribute("title", title + ".\n" + Dictionary.get("arda_tooglevis", "Left click to toggle visibility.\nRight click to refresh."));
        a.setAttribute("class", "blue-box fa act " + html);
        a.setAttribute("aria-hidden", "true");
        a.onclick = this.toogleView.bind(this);
        
        if (label !== "")
            a.innerText = label;

        const div = document.createElement("div");
        div.setAttribute("class", "arda-hand-container");
        div.oncontextmenu = this.onRefreshHands.bind(this);
        div.appendChild(a);

        parent.appendChild(div);
        return div;
    }

    onRefreshHands(e:any)
    {
        this.getOpeningHands();

        e.preventDefault();
        e.stopPropagation();
    }

    onShowHands ()
    {
        ArrayList(document).findByClassName("arda-card-hands").each((elem:any) => {
            if (elem.classList.contains("hidden"))
                elem.classList.remove("hidden");
        });
    }

    toggleViewOnElement (id:string)
    {
        const elem = this.getContainer(id);
        if (elem !== null)
        {
            if (elem.classList.contains("hidden"))
                elem.classList.remove("hidden");
            else
                elem.classList.add("hidden");
        }
    }
    
    toogleView (e:any)
    {
        this.toggleViewOnElement(e.target.getAttribute("data-player"));

        if (e.target.classList.contains("act"))
            e.target.classList.remove("act");
        else
            e.target.classList.add("act");

        e.preventDefault();
        return false;
    }

    getContainer (id:string)
    {
        return document.getElementById(id + "_hand");
    }

    createContainer (playerid:string, dataType:string, title:string, nHandSize:number, bRecycleOnce:boolean)
    {
        const id = playerid + "_hand";
        const idCardList = "arda_hand_container_" + dataType;
        let elem = document.getElementById(id);
        if (elem !== null)
            return id;

        const divHandTop = document.createElement("div");
        divHandTop.setAttribute("class", "arda-handbar-top");

        const div = document.createElement("div");
        div.setAttribute("class", "arda-card-hands hidden arda-card-hand-" + dataType);
        div.setAttribute("id", id);
        div.append(divHandTop);

        let _sizerId = "";
        
        if (!this.isSinglePlayer())
        {
            _sizerId = ResolveHandSizeContainer.create(divHandTop, Dictionary.get("handsizeis", "Hand size is"), nHandSize, "");
            divHandTop.getElementsByClassName("card-hands-sizer")[0].classList.add("arda-card-hands-sizer");
        }
        else 
            nHandSize = -1;

        let _div = document.createElement("div");
        _div.setAttribute("class", "arda-inline");
        _div.setAttribute("id", idCardList);
        div.appendChild(_div);

        _div = document.createElement("div");
        _div.setAttribute("class", "arda-inline arda-hand-card-actions");

        {
            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-pile-action" + (bRecycleOnce ? " hidden":""));
            _a.setAttribute("id", "arda-view-discard-" + dataType);
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("data-view", "discard");
            _a.setAttribute("title", Dictionary.get("arda_viewdiscard", "View discard pile"));
            _a.innerHTML = `<img src="/media/assets/images/icons/icon-discardpile.png" data-view="discard" data-type="${dataType}">`;
            _a.onclick = this.onViewPile.bind(this);
            divHandTop.prepend(_a);

            _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-pile-action context-cursor" + (bRecycleOnce ? " hidden":""));
            _a.setAttribute("id", "arda-view-playdeck-" + dataType);
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("title", Dictionary.get("arda_viewplaydeck", "View playdeck. Right click to shuffle"));
            _a.setAttribute("data-view", "playdeck");
            _a.innerHTML = `<img src="/media/assets/images/icons/icon-playdeck.png" data-view="playdeck" data-type="${dataType}">`;
            _a.onclick = this.onViewPile.bind(this);
            _a.oncontextmenu = this.onShufflePlaydeck.bind(this);
            divHandTop.prepend(_a);

            _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-draw" + (bRecycleOnce ? " hidden":""));
            _a.setAttribute("id", "arda-card-draw-" + dataType);
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("data-handsize", "" + nHandSize)
            _a.setAttribute("title", Dictionary.get("arda_drawnew", "Draw a new card"));
            _a.setAttribute("data-container-id", id);
            _a.onclick = this.onDrawNewCard.bind(this);
            divHandTop.prepend(_a);
        }
        div.appendChild(_div);

        document.body.appendChild(div);

        if (_sizerId !== "")
            ResolveHandSizeFirst.create(idCardList, _sizerId,  title + " cards", ["organisation", "eotdiscard"]);

        return id;
    }

    onShufflePlaydeck (e:any)
    {
        const type = e.target.getAttribute("data-type");
        if (type === "mps" || type === "minor" || type === "stage")
        {
            MeccgApi.send("/game/arda/shuffle", { target: type });
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("arda_shuffled", "Playdeck shuffled") + " (" + type + ")" }));
        }

        e.preventDefault();
    }

    static #showIfExitent (id:string)
    {
        const elem = id === "" ? null : document.getElementById(id);
        if (elem !== null)
            elem.classList.remove("hidden");

        return elem;
    }

    showStageCardHand ()
    {
        const elem = document.getElementById("arda_stage_hand");
        const cards = document.getElementById("arda_hand_container_stage");
        if (elem === null || cards === null)
            return;

        if (cards.getElementsByClassName("card-hand").length > 0)
        {
            if (elem.classList.contains("hidden"))
                elem.classList.remove("hidden");
        }
        else if (!elem.classList.contains("hidden"))
            elem.classList.add("hidden");
    }

    addDraftClass (bAdd:boolean)
    {
        if (bAdd)
            document.body.classList.add("arda-draft");
        else
            document.body.classList.remove("arda-draft");
    }

    updateArdaSetupContainer (bIsReady:boolean, bHideDraftCharacters:boolean, bHideDraftMinors:boolean)
    {
        if (bHideDraftCharacters && bHideDraftMinors)
        {
            DomUtils.remove(document.getElementById("arda-setup-container"));
            this.addDraftClass(false);
            this.showStageCardHand();
            return;
        }

        if (bHideDraftCharacters)
            this.addDraftClass(true);

        const containerWrapper = document.getElementById("arda-setup-container");
        const container = document.getElementById("arda-setup-container-content");
        if (container === null || containerWrapper === null)
            return;

        DomUtils.empty(container);

        containerWrapper.classList.remove("hidden");
        if (!bIsReady)
        {
            const elem1 = document.createElement("p");
            elem1.innerText = Dictionary.get("arda_setup_1a", " Once everybody is at the table, each player chooses their wizard. Once that is done, you assign random characters to each player's hand.");

            const elem2 = document.createElement("p");
            elem2.innerText = Dictionary.get("arda_setup_1b", "This will clear your hand and add random characters to your hand.");

            container.appendChild(elem1);
            
            this.insertOnceAction(container, "fa-users", Dictionary.get("arda_setup_1c", "Assign random characters to every player."), "randomchars", "arda_ranom", Dictionary.get("arda_setup_1d", "Assign random characters"), 8);
            this.insertOnceAction(container, "fa-users", Dictionary.get("arda_setup_1e", "Assign more random characters to every player."), "randomchars", "arda_ranom", Dictionary.get("arda_setup_1d", "Assign random characters") + " (12)", 12);

            container.appendChild(elem2);
        }
        else if (!bHideDraftCharacters && !bHideDraftMinors)
        {
            let elem = document.createElement("p");
            elem.innerText = Dictionary.get("arda_setup_2a", "Everybody may draft characters with a total of 25 GI. Yet, only 20 GI may be used.");
            container.appendChild(elem);

            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-recycle fa fa-recycle");
            _a.setAttribute("data-type", "charackters");
            _a.setAttribute("id", "arda-card-recycle-charackters");
            _a.setAttribute("title", Dictionary.get("arda_setup_2b", "Complete character draft and choose minor items."));
            _a.innerText = " " + Dictionary.get("arda_setup_2b", "Complete character draft and choose minor items.");
            _a.onclick = this.onRecycleDeck.bind(this);
            container.appendChild(_a);

            elem = document.createElement("p");
            elem.innerText = Dictionary.get("arda_setup_2c", "Recycling will automatically discard your current hand and reshuffle everything into the playdeck.");
            container.appendChild(elem);

        }
        else 
        {
            const elem = document.createElement("p");
            elem.innerText = Dictionary.get("arda_setup_3a", "Everybody may choose up to 3 minor items. Once that is done, the game can start.");
            container.appendChild(elem);

            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-recycle fa fa-recycle");
            _a.setAttribute("data-type", "minor");
            _a.setAttribute("id", "arda-card-recycle-minor");
            _a.setAttribute("title", Dictionary.get("arda_setup_3b", "Complete minor item draft and start the game."));
            _a.innerText = " " + Dictionary.get("arda_setup_3b", "Complete minor item draft and start the game.");
            _a.onclick = this.onRecycleDeck.bind(this);
            container.appendChild(_a);
        }
    }

    onCheckDraft (bIsReady:boolean, bHideDraftCharacters:boolean, bHideDraftMinors:boolean)
    {
        let elem;
        
        elem = document.getElementById("arda-card-recycle-charackters");
        if (bHideDraftCharacters)
        {
            DomUtils.remove(elem);
            Arda.#showIfExitent("arda-card-draw-charackters");

            Arda.#showIfExitent("arda_characters_hand");

            Arda.#showIfExitent("arda-view-playdeck-charackters");
            Arda.#showIfExitent("arda-view-discard-charackters");
        }

        elem = document.getElementById("arda-card-recycle-minor");
        if (bHideDraftMinors)
        {
            DomUtils.remove(elem);
            Arda.#showIfExitent("arda-card-draw-minor");
            Arda.#showIfExitent("arda_minors_hand");

            Arda.#showIfExitent("arda-view-playdeck-minor");
            Arda.#showIfExitent("arda-view-discard-minor");
        }

        this.updateArdaSetupContainer(bIsReady, bHideDraftCharacters, bHideDraftMinors);
    }

    onViewPile (e:any)
    {
        const type = e.target.getAttribute("data-type");
        const pile = e.target.getAttribute("data-view");
        
        MeccgApi.send("/game/arda/view", { type: type, pile: pile });
    }

    onRecycleDeck (e:any)
    {
        new Question().onOk(function()
        {
            const target = e.target.getAttribute("data-type");
            const next = e.target.getAttribute("data-next");

            DomUtils.remove(e.target);

            if (typeof target === "string" && target !== "")
            {
                Arda.#showIfExitent("arda-card-draw-" + target);
                Arda.#showIfExitent("arda-view-playdeck-" + target);
                Arda.#showIfExitent("arda-view-discard-" + target);
            }

            if (typeof next === "string" && next !== "")
                Arda.#showIfExitent(next);

            MeccgApi.send("/game/arda/recycle", { type: target });
        }).show(
            Dictionary.get("arda_setup_4a", "Do you want to reshuffle all cards into the playdeck?, "), 
            Dictionary.get("arda_setup_4b", "All cards will be reshuffled into the playdeck and a new hand will be drawn., "), 
            Dictionary.get("arda_setup_4c", "Reshuffle everything")
        );
    }
    
    getAllowedHandSize (elem:any)
    {
        const id = elem === null ? null : elem.getAttribute("data-container-id");
        const container = id === null || id === "" ? null : document.getElementById(id);

        let nDefault = -1;
        try
        {
            nDefault = parseInt(elem.getAttribute("data-handsize"));
                        
            const list = container === null ? null : container.getElementsByClassName("card-hands-sizer-size");
            if(list !== null && list.length === 1)
                return parseInt((list[0] as any).innerText);
        }
        catch (err)
        {
            console.error(err);
        }

        return nDefault;
    }
    
    onDrawNewCard (e:any)
    {
        const elem = e.target;

        const nLen = this.getAllowedHandSize(elem);
        const type = elem.getAttribute("data-type");
        
        const list = document.getElementById("arda_hand_container_" + type);
        if (list === null)
            return;

        const nCount = list.getElementsByClassName("card-hand").length;
        if (nCount < nLen || nLen === -1)
            MeccgApi.send("/game/arda/draw", { type : type });
        else
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": Dictionary.get("arda_handlimit", "Hand already holds enough cards.") }));
    }

    onDrawSingleCard (container:any, cardCode:string, uuid:string, type:string)
    {
        if (container === null || uuid === "")
            return;
    
        const _code = CardList().getSafeCode(cardCode);
        const _img = CardList().getImage(cardCode);

        if (container.querySelector("#arda-hand-card-" + uuid) !== null)
            return;

        container.appendChild(this.createHtmlElement(_code, _img, uuid, type));
        CardPreview.addHover("arda-hand-card-" + uuid, false, true);   
    }

    onReceiveOpeningHandGeneric (containerId:string, type:string, jData:any)
    {
        const container = document.getElementById(containerId);
        if (container === null)
            return false;

        DomUtils.removeAllChildNodes(container);

        for (let elem of jData)
            this.onDrawSingleCard(container, elem.code, elem.uuid, type);

        return jData.length > 0;
    }

    onReceiveOpeningHandCharacters (jData:any)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        if (!this._hasReceivedCharacters)
        {
            this._hasReceivedCharacters = this.onReceiveOpeningHandGeneric("arda_hand_container_charackters", "charackters", jData);
            if (this._hasReceivedCharacters)
            {
                let div = document.getElementById("arda-action-container-randomchars");
                if (div !== null)
                {
                    DomUtils.empty(div);
                    div.classList.add("hidden");
                }

                div = document.getElementById("arda_characters_hand");
                if (div !== null)
                    div.classList.remove("hidden");
            }
        }
        else
            this.onReceiveOpeningHandGeneric("arda_hand_container_charackters", "charackters", jData);
    }

    onReceiveOpeningHandStage (jData:any)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        this.onReceiveOpeningHandGeneric("arda_hand_container_stage", "stage", jData);
    }

    onReceiveOpeningHandMinor (jData:any)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        this.onReceiveOpeningHandGeneric("arda_hand_container_minor", "minor", jData);
    }

    onReceiveOpeningHandMarshalingPoints (bIsMe:boolean, jData:any)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        if (bIsMe)
            this.onReceiveOpeningHandGeneric("arda_hand_container_mps", "mps", jData);
    }

    onDrawCard (bIsMe:boolean, jData:any)
    {
        let containerId = "";
        if (jData.hand === "minor")
            containerId = "arda_hand_container_minor";
        else if (bIsMe && jData.hand === "mps")
            containerId = "arda_hand_container_mps";
        else if (jData.hand === "charackters")
            containerId = "arda_hand_container_charackters";
        else if (jData.hand === "stage")
            containerId = "arda_hand_container_stage";

        const container = containerId === "" ? null : document.getElementById(containerId);
        if (container !== null)
        {
            if (jData.clear !== undefined && jData.clear === true)
                DomUtils.removeAllChildNodes(container);

            this.onDrawSingleCard(container, jData.code, jData.uuid, jData.hand);
        }
    }

    onRemoveHandCard (uuid:string)
    {
        const elem = document.getElementById("arda-hand-card-" + uuid);
        if (elem !== null)
            DomUtils.remove(elem);
        else
            DomUtils.remove(document.getElementById("card_icon_nr_" + uuid));
    }
};

const ArdaImpl = new Arda();
    
export default ArdaImpl as Arda;

export function InitArda()
{
    if ("true" !== document.body.getAttribute("data-game-arda"))
        return;

    document.body.addEventListener("meccg-api-connected", () => ArdaImpl.init(), false);
    
    MeccgApi.addListener("/game/arda/hand/show", () => ArdaImpl.onShowHands());
    MeccgApi.addListener("/game/arda/hand/minor", (_bIsMe:boolean, jData:any) => ArdaImpl.onReceiveOpeningHandMinor(jData.list));
    MeccgApi.addListener("/game/arda/hand/stage", (_bIsMe:boolean, jData:any) => ArdaImpl.onReceiveOpeningHandStage(jData.list));
    MeccgApi.addListener("/game/arda/hand/characters", (_bIsMe:boolean, jData:any) => ArdaImpl.onReceiveOpeningHandCharacters(jData.list));
    MeccgApi.addListener("/game/arda/hand/marshallingpoints", (bIsMe:boolean, jData:any) => ArdaImpl.onReceiveOpeningHandMarshalingPoints(bIsMe, jData.list));
    MeccgApi.addListener("/game/arda/hand/card/remove", (_bIsMe:boolean, jData:any) => ArdaImpl.onRemoveHandCard(jData.uuid));  
    MeccgApi.addListener("/game/arda/draw", (bIsMe:boolean, jData:any) => ArdaImpl.onDrawCard(bIsMe, jData));
    MeccgApi.addListener("/game/arda/checkdraft", (_bIsMe:boolean, jData:any) => ArdaImpl.onCheckDraft(jData.ready, jData.characters, jData.minoritems));
    MeccgApi.addListener("/game/arda/view", (bIsMe:boolean, jData:any) => TaskBarCardsInterface.onShow(bIsMe, jData));

    ArdaImpl._exchangeBox.addRoutes();
}
