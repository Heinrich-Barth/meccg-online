import CardList from "./utils/cardlist";
import Dictionary from "./utils/dictionary";
import MeccgApi from "./meccg-api";
import TradeCards from "./TradeCards";
import CardPreview from "./card-preview";

export class RevealCardPile extends TradeCards
{
    #numCards = 5;
    deck:any;

    constructor(deck:any)
    {
        super()

        this.deck = deck;
    }

    static isArda()
    {
        return "true" === document.body.getAttribute("data-game-arda");
    }


    onChoosePlayer(numCards:number)
    {
        this.setNumCards(numCards);
        super.onChoosePlayer(null);
    }

    setNumCards(numCards:number)
    {
        if (typeof numCards !== "number")
            this.#numCards = 5;
        else 
            this.#numCards = numCards;
    }

    revealOfferedCards()
    {
        return false;
    }

    getPayloadTriggerTrading(challengerId:string, partnerId:string)
    {
        const data:any = super.getPayloadTriggerTrading(challengerId, partnerId);
        data.count = this.#numCards;
        data.deck = this.deck;
        return data;
    }

    labelChooseCards()
    {
        return Dictionary.get("rvpil_choose", "Reordering of cards in") + " " + this.deck.toUpperCase();
    }

    labelCardsBeingOffered()
    {
        return Dictionary.get("rvpils_text", "Card reordering will appear automatically. The left is considered the TOP of the card stack.");
    }

    labelSelectCardsToTrade()
    {
        return Dictionary.get("rvpils_text_click", "Click on a card to send it to the bottom of this list. Right click on any card send it to the bottom of the deck.");
    }

    labelAcceptTrade()
    {
        return Dictionary.get("rvpils_accept", "Accept ordering");
    }

    getRouteTradeStart()
    {
        return "/game/deck/reveal/start";
    }

    getRouteTradeCancel()
    {
        return "/game/deck/reveal/cancel";
    }

    getRouteTradeRemove()
    {
        return "/game/deck/reveal/remove";
    }

    getRouteTradeOffer()
    {
        return "/game/deck/reveal/offer";
    }

    getRouteTradeAccept()
    {
        return "/game/deck/reveal/accept";
    }

    getRouteTradeSuccess()
    {
        return "/game/deck/reveal/success";
    }

    getRouteTradePerform()
    {
        return "/game/deck/reveal/perform";
    }

    getListOffering()
    {
        return [];
    }

    getListOffered()
    {
        const list = [];

        for (let img of this.#getCardImageList())
        {
            const uuid = !this.#sendToBottom(img) ? this.#getUuid(img) : "";
            if (uuid !== "")
                list.push(uuid);
        }

        return list;
    }

    #getUuid(img:any)
    {
        return img.hasAttribute("data-uuid") ? img.getAttribute("data-uuid") : "";
    }

    #sendToBottom(img:any)
    {
        return img?.parentElement?.classList.contains("rot180") === true;
    }

    #getCardImageList():any[]
    {
        const list:any = [];

        const elem = document.getElementById("trade-offering")
        const imgs:any = elem === null ? null : elem.querySelectorAll("img");
        if (imgs !== null)
            return imgs;
        else
            return list;
    }

    #getListOfferedBottom()
    {
        const list = [];

        for (let img of this.#getCardImageList())
        {
            const uuid = this.#sendToBottom(img) ? this.#getUuid(img) : "";
            if (uuid !== "")
                list.push(uuid);
        }

        return list.reverse();
    }

    showTradeBox(isMe:boolean, jData:any)
    {
        const elem = super.showTradeBox(isMe, jData);
        if (isMe && elem !== null)
            elem.classList.add("trade-hide-buttons");

        return null;
    }

    toggleImageOfferingContextMenu(e:any)
    {
        const elem = e.target.parentElement;
        if (elem.classList.contains("rot180"))
            elem.classList.remove("rot180")
        else
            elem.classList.add("rot180")

        return false;
    }

    toggleImageOffering(e:any)
    {
        const elem = e.target.parentElement;
        elem.parentElement.append(elem);
    }

    tradeAccept()
    {
        const data:any = {}
        data[this.getMyId()] = this.getListOffering();
        data[this.getPartnerId()] = this.getListOffered();

        const dataBottom:any = {}
        dataBottom[this.getMyId()] = this.getListOffering();
        dataBottom[this.getPartnerId()] = this.#getListOfferedBottom();

        MeccgApi.send(this.getRouteTradePerform(), { 
            first: this.getMyId(),
            second:  this.getPartnerId(),
            deck: this.deck,
            cards : data,
            cardsBottom: dataBottom,
        });
    }
};

export class RevealPlayerDeck extends RevealCardPile
{

    constructor()
    {
        super("playdeck");
    }

    static INSTANCE:RevealPlayerDeck|null = null;

    onShowCardsToPlayer(_bIsMe:boolean, data:any)
    {
        const myId = this.getMyId();
        const cards = data.cards;
        if (data.first !== myId && data.second !== myId || !Array.isArray(cards) || cards.length === 0)
            return;
    }
}


export class RevealPlayerDeckSelf 
{
    static #instance = new RevealPlayerDeckSelf();

    #deck = "playdeck";
    #currentShown = 0;

    static lookAt(num:number)
    {
        if (num < 1)
            return;

        MeccgApi.send("/game/deck/reveal/self", {
            type: "show",
            deck: "playdeck",
            count: num
        });
    }

    static get()
    {
        return RevealPlayerDeckSelf.#instance;
    }

    onRevalToSelf(isMe:boolean, jData:any)
    {
        if (isMe !== true || jData === undefined)
            return;

        this.#removeDialog();
        const type = jData.deck;
        const list = jData.cards;

        this.#currentShown = list.length;
        if (this.#currentShown === 0)
            return;

        const dialog = this.#createDialog(list);
        document.body.append(dialog);
    }

    #createDialog(codes:string[])
    {
        const dialog = document.createElement("div");
        dialog.setAttribute("id", "dialog_reveal_self");
        dialog.setAttribute("class", "reveal-to-self");
        dialog.setAttribute("title", Dictionary.get("rvpils_anywhere", "Click anywhere to close"));
        dialog.onclick = () => this.#closeDialog();


        const h2 = document.createElement("h2");
        h2.innerText = Dictionary.get("rvpils_look_title", "Look at your playdeck");

        const p = document.createElement("p");
        p.innerText = Dictionary.get("rvpils_look_text", "Click anywhere here to close this dialog.");

        const div = document.createElement("div");
        div.setAttribute("class", "reveal-to-self-content");

        div.append(h2, p, this.#createCards(codes));
        dialog.append(div);
        return dialog;
    }

    #createCardImage(card:any)
    {
        const img = document.createElement("img");
        img.setAttribute("src", CardList().getImage(card.code));
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("class", "card-icon");
        img.setAttribute("data-image-backside", "/data/backside");

        const elem = document.createElement("div");
        elem.setAttribute("class", "card-hand");
        elem.appendChild(img);

        CardPreview.init(elem, true, true);
        return elem;
    }

    #createCards(codes:any[])
    {
        const div = document.createElement("div");

        for (let code of codes)
            div.append(this.#createCardImage(code));

        return div;
    }

    #closeDialog()
    {
        this.#removeDialog();

        if (this.#currentShown < 2)
            return;

        MeccgApi.send("/game/deck/reveal/self", {
            type: "shuffle",
            deck: this.#deck,
            count: this.#currentShown
        });   
    }

    #removeDialog()
    {
        const elem = document.getElementById("dialog_reveal_self");
        if (elem?.parentElement)
            elem.parentElement.removeChild(elem);
    }

    init()
    {
        MeccgApi.addListener("/game/deck/reveal/self", this.onRevalToSelf.bind(this));
    }
}

if (!RevealCardPile.isArda())
    RevealPlayerDeck.INSTANCE = new RevealPlayerDeck().addRoutes();

RevealPlayerDeckSelf.get().init();