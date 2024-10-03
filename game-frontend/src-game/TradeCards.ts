import CardPreview from "./card-preview";
import CardList from "./utils/cardlist";
import Dictionary from "./utils/dictionary";
import DomUtils from "./utils/libraries";
import MeccgApi, { MeccgPlayers } from "./meccg-api";
import { PlayerSelectorAction } from "./preferences/PlayerSelectorAction";

export default class TradeCards extends PlayerSelectorAction {

    _myId = "";
    _partnerId = "";
    _tradeAccepted = 0;
    _mapOffering:any = { };
    _mapOfferred:any = { };

    getMyId()
    {
        return this._myId;
    }

    getPartnerId()
    {
        return this._partnerId;
    }

    labelErrorTooFewPlayers()
    {
        return Dictionary.get("trade_toofew", "Another player is needed to trade cards");
    }

    labelChooseTradingPartner()
    {
        return Dictionary.get("trade_choosep", "Choose player to trade with");
    }

    labelChoosePlayerToTradeWith()
    {
        return Dictionary.get("trade_chooseone", "Please choose one player to trade cards with");
    }

    resetTraders()
    {
        this._myId = "";
        this._partnerId = "";
        this._tradeAccepted = 0;
        this._mapOffering = { };
        this._mapOfferred = { };
    }

    create(_any:any)
    {
        return true;
    }

    getRouteTradeStart()
    {
        return "";
    }

    getRouteTradeCancel()
    {
        return "";
    }

    getRouteTradeRemove()
    {
        return "";
    }

    getRouteTradeOffer()
    {
        return "";
    }

    getRouteTradeAccept()
    {
        return "";
    }

    getRouteTradeSuccess()
    {
        return "";
    }

    getRouteTradePerform()
    {
        return "";
    }

    addRoutes()
    {
        MeccgApi.addListener(this.getRouteTradeStart(), this.showTradeBox.bind(this));
        MeccgApi.addListener(this.getRouteTradeCancel(), this.tradeCancelled.bind(this));
        MeccgApi.addListener(this.getRouteTradeRemove(), this.tradeRemoveOffered.bind(this));
        MeccgApi.addListener(this.getRouteTradeOffer(), this.tradeOffer.bind(this));
        MeccgApi.addListener(this.getRouteTradeAccept(), this.tradeAccepted.bind(this));
        MeccgApi.addListener(this.getRouteTradeSuccess(), this.tradeSuccess.bind(this));
        return this;
    }

    assignTraders(first:string, second:string)
    {
        this.resetTraders();

        if (MeccgPlayers.isChallenger(first))
        {
            this._myId = first;
            this._partnerId = second;
        }
        else
        {
            this._myId = second;
            this._partnerId = first;
        }
    }

    createTradingOverlay(listCards:any, first:string, second:string)
    {
        this.assignTraders(first, second);

        const div = document.createElement("div");
        div.setAttribute("id", "restore-game");
        div.setAttribute("class", "restore-game trade-panel config-panel");


        let _temp = document.createElement("div");
        _temp.setAttribute("class", "config-panel-overlay");
        _temp.setAttribute("id", "trade-panel-overlay");
        div.appendChild(_temp);

        _temp = document.createElement("div");
        _temp.setAttribute("class", "config-panel blue-box restore-panel");
        _temp.setAttribute("id", "trade-panel");
        div.appendChild(_temp);

        let _element:any = document.createElement("h2");
        _element.innerText = this.labelChooseCards();
        _temp.appendChild(_element);

        _element = document.createElement("p");
        _element.innerText = this.labelCardsBeingOffered();
        _temp.appendChild(_element);

        let ul = document.createElement("div");
        ul.setAttribute("class", "offered-list trade-card-images");
        ul.setAttribute("id", "trade-offerred");
        _temp.appendChild(ul);

        _element = document.createElement("p");
        _element.innerText = this.labelSelectCardsToTrade();
        _temp.appendChild(_element);

        ul = document.createElement("div");
        ul.setAttribute("class", "offering-list trade-card-images");
        ul.setAttribute("id", "trade-offering");
        _temp.appendChild(ul);

        for (let card of listCards)
            ul.appendChild(this.createCardContainer(card.code, card.uuid, false, true)); //, second, true));

        _element = document.createElement("button");
        _element.innerText = this.labelAcceptTrade();
        _element.onclick = this.tradeAccept.bind(this);
        _element.setAttribute("data-first", first);
        _element.setAttribute("data-second", second);
        _element.setAttribute("class", "trade-accept");
        _temp.appendChild(_element);

        _element = document.createElement("button");
        _element.innerText = "Cancel";
        _element.setAttribute("data-first", first);
        _element.setAttribute("data-second", second);
        _element.setAttribute("class", "trade-cancel");
        _element.onclick = this.tradeCancel.bind(this);
        _temp.appendChild(_element);

        document.body.appendChild(div);
        return div;
    }

    labelChooseCards()
    {
        return Dictionary.get("trade_choosecards", "Choose cards to trade");
    }

    labelCardsBeingOffered()
    {
        return Dictionary.get("trade_beingoffered", "Cards being offered to you will appear automatically.");
    }

    labelSelectCardsToTrade()
    {
        return Dictionary.get("trade_selectcards", "Select your cards to trade.");
    }

    labelAcceptTrade()
    {
        return Dictionary.get("trade_accept", "Accept trade")
    }

    createCardContainer(code:string, uuid:string, addId:boolean, reveal:boolean) 
    {
        let _img = reveal ? CardList().getImage(code) : "/data/backside";
        let sCode = CardList().getSafeCode(code);

        const img = document.createElement("img");
        img.setAttribute("src", _img);
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("data-uuid", uuid);
        img.setAttribute("data-code", sCode);
        img.setAttribute("class", "card-icon");
        img.setAttribute("data-image-backside", "/data/backside");

        if (!addId)
        {
            img.onclick = this.toggleImageOffering.bind(this);
            img.oncontextmenu = this.toggleImageOfferingContextMenu.bind(this);
        }

        const elem = document.createElement("div");
        elem.setAttribute("class", "card-hand");
        if (addId)
            elem.setAttribute("id", "trade_" + uuid);
        
        elem.appendChild(img);


        CardPreview.init(elem, true, true);
        return elem;
    }

    onToggleImageOffering(elem:any)
    {
        if (elem.classList.contains("fa"))
        {
            elem.classList.remove("fa");
            elem.classList.remove("fa-exchange");
            return false;
        }
        else 
        {
            elem.classList.add("fa");
            elem.classList.add("fa-exchange");
            return true;
        }
    }

    toggleImageOfferingContextMenu(e:any)
    {
        return false;
    }

    toggleImageOffering(e:any)
    {
        const elem = e.target.parentElement;
        const code = e.target.getAttribute("data-code");
        const uuid = e.target.getAttribute("data-uuid");

        if (this.onToggleImageOffering(elem))
        {
            MeccgApi.send(this.getRouteTradeOffer(), { 
                first: this._myId,
                second:  this._partnerId,
                code: code,
                uuid: uuid
            });
        }
        else 
        {
            MeccgApi.send(this.getRouteTradeRemove(), { 
                first: this._myId,
                second:  this._partnerId,
                code: code,
                uuid: uuid
            });
        }
    }

    tradeCancel(e:any)
    {
        MeccgApi.send(this.getRouteTradeCancel(), { 
            first: this._myId,
            second:  this._partnerId,
        });
    }

    tradeAccept(e:any)
    {
        const elem = document.getElementById("trade-panel");
        if (elem !== null)
            elem.classList.add("trade-await-reply");

        MeccgApi.send(this.getRouteTradeAccept(), { 
            first: this._myId,
            second:  this._partnerId,
        });
    }

    tradeAccepted(isMe:boolean, jData:any)
    {
        if (this.tradePartyNumber(jData) === 0)
            return;

        this._tradeAccepted++;
        if (!isMe || this._tradeAccepted !== 2)
            return;

        this.triggerTrade();
    }

    triggerTrade()
    {
        const data:any = {}
        data[this._myId] = this.getListOffering();
        data[this._partnerId] = this.getListOffered();

        MeccgApi.send(this.getRouteTradePerform(), { 
            first: this._myId,
            second:  this._partnerId,
            cards : data
        });
    }

    getListOffering()
    {
        return this.toList(this._mapOffering)
    }

    getListOffered()
    {
        return this.toList(this._mapOfferred)
    }

    toList(map:any)
    {
        const list:string[] = [];
        for (let key of Object.keys(map))
            list.push(key);
        return list;
    }

    tradeCancelled(_isMe:boolean, jData:any)
    {
        this.removeOverlay();
        if (!_isMe && this.tradePartyNumber(jData) !== 0)
            this.showWarning(Dictionary.get("trade_wascanceled", "Trade was cancelled"));
    }

    tradeSuccess(_isMe:boolean, jData:any)
    {
        this.removeOverlay();

        if (this.tradePartyNumber(jData) !== 0)
        {
            this.showSuccess(Dictionary.get("trade_success", "Trade completed"));
            return true;
        }
        else
            return false;
    }

    removeOverlay()
    {
        DomUtils.removeNode(document.getElementById("restore-game"));
    }

    onTriggerTrading(e:any, other:string)
    {
        const otherPlayer = e !== null ? e.target.getAttribute("data-player") : other;
        this.removeOverlay();

        if (otherPlayer === null || otherPlayer === undefined || otherPlayer === "")
        {
            this.showError(Dictionary.get("trade_noother", "Could not get other player to trade with."));
        }
        else
        {
            MeccgApi.send(this.getRouteTradeStart(), this.getPayloadTriggerTrading( 
                MeccgPlayers.getChallengerId(),
                otherPlayer
            ));
        }
    }

    getPayloadTriggerTrading(challengerId:string, partnerId:string)
    {
        return {
            first: challengerId,
            second:  partnerId
        }
    }


    tradeRemoveOffered(_isMe:boolean, jData:any)
    {
        if (this.tradePartyNumber(jData) === 0)
            return;

        DomUtils.remove(document.getElementById("trade_" + jData.uuid));
        if (this._mapOffering[jData.uuid] !== undefined)
            delete this._mapOffering[jData.uuid];
        else if (this._mapOfferred[jData.uuid] !== undefined)
            delete this._mapOfferred[jData.uuid];
    }

    tradeOffer(isMe:boolean, jData:any)
    {
        if (this.tradePartyNumber(jData) === 0)
            return;

        if (isMe)
        {
            this._mapOffering[jData.uuid] = Date.now();
            return;
        }
        
        this._mapOfferred[jData.uuid] = Date.now();

        const container = document.getElementById("trade-offerred");
        if (container !== null)
            container.appendChild(this.createCardContainer(jData.code, jData.uuid, true, this.revealOfferedCards()));
    }

    revealOfferedCards()
    {
        return true;
    }

    showTradeBox(_isMe:boolean, jData:any)
    {
        let listCards = null;
        const num = this.tradePartyNumber(jData);
        if (num === 1)
            listCards = this.getCardList(jData.cards.first);
        else if (num === 2)
            listCards = this.getCardList(jData.cards.second);
        
        if (listCards === null)
            return null;
        else
            return this.createTradingOverlay(listCards, jData.first, jData.second);
    }

    getCardList(listCards:any)
    {
        if (listCards === null)
            return null;

        if (Array.isArray(listCards))
            return listCards;
        else if (!Array.isArray(listCards.mp) || !Array.isArray(listCards.hand))
            return [];
        
        const list = [];

        for (let e of listCards.hand)
            list.push(e);
        for (let e of listCards.mp)
            list.push(e);

        return list;
    }

    tradePartyNumber(jData:any)
    {
        if (jData === undefined || jData.first === undefined || jData.second === undefined)
            return 0;
        else if (MeccgPlayers.isChallenger(jData.first))
            return 1;
        else if (MeccgPlayers.isChallenger(jData.second))
            return 2;
        else
            return 0;
    }
}