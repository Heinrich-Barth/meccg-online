import Logger from "../Logger";
import DeckArda from "./DeckArda";
import GameStandard from "./GameStandard";
import HandManagerArda from "./HandManagerArda";
import { TDeckCard } from "./DeckCommons";
import Player from "./Player";

export default class GameArda extends GameStandard {
    #reycled = {
        minors: false,
        characters: false,
        ready: false,
    };

    isArda() {
        return true;
    }

    publishChat(userid: string, message: string) {
        super.publishChat(userid, message, false);
    }

    #assignOpeningChars7() {
        const players = this.getDeckManager().getPlayers();
        if (players.length === 0)
            return;

        for (let userid of players) {
            const deck = this.getDeckManager().getPlayerDeck(userid) as DeckArda;
            if (deck === null)
                continue;

            const uuid1 = deck.drawOpeningCharacterMind7();
            const uuid2 = deck.drawOpeningCharacterMind7();

            if (uuid1 !== "")
                this.drawSingleCard(userid);

            if (uuid2 !== "")
                this.drawSingleCard(userid);
        }
    }

    #assignOpeningChars(nCount: number) {
        const players = this.getDeckManager().getPlayers();
        for (let userid of players) {
            const deck = this.getDeckManager().getPlayerDeck(userid) as DeckArda;
            if (deck === null)
                continue;

            let nDraw = 0;
            for (let i = 0; i < nCount; i++) {
                const uuid = deck.drawOpeningCharacterToHand()
                if (uuid !== "")
                    nDraw++;
            }

            for (let i = 0; i < nDraw; i++)
                this.drawSingleCard(userid);
        }

        const pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck !== null) {
            pAdminDeck.mergeCharacterListsOnce();
            pAdminDeck.addSpecialCharacers();
            pAdminDeck.shuffleCharacterDeck();
        }
    }

    onShuffle(userid: string, _socket: any, obj: any) {
        const deck = this.getDeckManager().getAdminDeck();
        if (deck === null)
            return;

        if (obj.target === "minor") {
            deck.shuffleMinorItems();
            this.publishChat(userid, "shuffled minor items deck");
        }
        else if (obj.target === "mps") {
            deck.shuffleMPs();
            this.publishChat(userid, "shuffled marshalling points deck");
        }
        else if (obj.target === "stage") {
            deck.shuffleStageCards();
            this.publishChat(userid, "shuffled stage deck");
        }
    }

    #getRessourceOnly(list: TDeckCard[]): TDeckCard[] {
        let result = [];
        for (let card of list) {
            if (card.type !== "hazard")
                result.push(card);
        }

        return result;
    }

    onTradeStart(userid: string, _socket: any, obj: any) {
        const data = {
            first: obj.first,
            second: obj.second,
            cards: {
                first: {
                    mp: this.getCardList(this.getDeckManager().getCards().handMarshallingPoints(obj.first)),
                    hand: this.#getRessourceOnly(this.getCardList(this.getDeckManager().getCards().hand(obj.first)))
                },
                second: {
                    mp: this.getCardList(this.getDeckManager().getCards().handMarshallingPoints(obj.second)),
                    hand: this.#getRessourceOnly(this.getCardList(this.getDeckManager().getCards().hand(obj.second)))
                }
            }
        }

        this.publishToPlayers("/game/arda/trade/start", userid, data);
    }

    onTradeCancel(userid: string, _socket: any, obj: any) {
        const data = {
            first: obj.first,
            second: obj.second
        }

        this.publishToPlayers("/game/arda/trade/cancel", userid, data);
        this.publishChat(userid, "cancelled a trade.");
    }

    onTradeRemove(userid: string, _socket: any, obj: any) {
        const data = {
            first: obj.first,
            second: obj.second,
            code: obj.code,
            uuid: obj.uuid
        }

        this.publishToPlayers("/game/arda/trade/remove", userid, data);
    }

    onTradeOffer(userid: string, _socket: any, obj: any) {
        const data = {
            first: obj.first,
            second: obj.second,
            code: obj.code,
            uuid: obj.uuid
        }

        this.publishToPlayers("/game/arda/trade/offer", userid, data);
    }

    onTradeAccept(userid: string, _socket: any, obj: any) {
        const data = {
            first: obj.first,
            second: obj.second
        }

        this.publishToPlayers("/game/arda/trade/accept", userid, data);
        this.publishChat(userid, "accepted a card trade.");
    }

    onTradeSuccess(userid: string, obj: any) {
        const data = {
            first: obj.first,
            second: obj.second
        }
        this.publishToPlayers("/game/arda/trade/success", userid, data);
        this.publishChat(userid, "completed a card trade.");
    }

    #onSendArdaSites(_userid: string, socket: any, obj: any) {
        const pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck === null)
            return;

        const list = pAdminDeck.GetDeckSiteCodes();
        if (list.length === 0)
            return;

        const res = [];
        for (let _uuid of list) {
            const _card = this.getDeckManager().getFullPlayerCard(_uuid);
            if (_card !== null && _card.code !== "")
                res.push(_card.code);
        }

        if (list.length > 0)
            this.replyToPlayer("/game/card/sites", socket, { cards: res });
    }

    onTradePerformMoveToDeck(traderIds: string[], obj: any) {
        const pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck === null || traderIds.length !== 2)
            return [];

        /** move all trading cards to playdeck to simply draw again */
        const result = [];
        for (let _id of traderIds) {
            const deck = this.getDeckManager().getPlayerDeck(_id);
            if (deck === null) {
                Logger.warn("Could not obtain trading deck #" + _id);
                continue;
            }

            /** the opposite trader draws equal to the number of cards this current player removes from his hand */
            const _oppositeTraderId = traderIds[0] === _id ? traderIds[1] : traderIds[0];
            const _tadeData = {
                id: _oppositeTraderId,
                mp: 0,
                hand: 0
            };

            for (let _cardUuid of obj.cards[_id]) {
                if (deck.pop().fromHandMps(_cardUuid)) {
                    pAdminDeck.push().toPlaydeck(_cardUuid);
                    _tadeData.mp++;
                }
                else if (deck.pop().fromHand(_cardUuid)) {
                    pAdminDeck.push().toPlaydeck(_cardUuid);
                    _tadeData.hand++;
                }
            }

            if (_tadeData.mp > 0 || _tadeData.hand > 0)
                result.push(_tadeData);
        }

        if (result.length > 1)
            result.reverse();

        return result;
    }

    onTradePerform(userid: string, _socket: any, obj: any) {
        /** trading did not work */
        const moved = this.onTradePerformMoveToDeck(Object.keys(obj.cards), obj);
        if (moved.length === 0) {
            this.onTradeCancel(userid, null, obj);
            return;
        }

        /** now each player draws cards again based on the number of discarded cards of the other player */
        for (let trader of moved) {
            /** only draw, the update will be sent later from each player on success signal */
            const deck = this.getDeckManager().getPlayerDeck(trader.id) as DeckArda;
            if (deck === null) {
                Logger.warn("Could not obtain trader deck #" + trader.id);
                continue;
            }

            for (let i = 0; i < trader.mp; i++)
            {
                const uuid = deck.drawCardMarshallingPoints();
                if (uuid)
                {
                    const card = this.getDeckManager().getFullPlayerCard(uuid);
                    if (card !== null)
                        this.updateCardOwnership(deck.getPlayerId(), card);
                }
            }

            for (let i = 0; i < trader.hand; i++)
                deck.draw();
        }

        this.onTradeSuccess(userid, obj);
    }

    onRecycle(userid: string, socket: any, obj: any) {
        const deck = this.getDeckManager().getAdminDeck();
        if (deck === null)
            return;

        let isMinor = false;
        if (obj.type === "minor") {
            deck.recycleMinorItems();
            deck.recycleStageCards();

            this.publishChat(userid, "recycled all minor items and stage cards");

            this.#reycled.minors = true;
            isMinor = true;
        }
        else if (obj.type === "charackters") {
            this.#clearPlayerHand();

            deck.recycleCharacter();
            deck.shuffle();
            this.publishChat(userid, "recycled all characters");
            this.#reycled.characters = true;
        }
        else
            return;

        for (let i = 0; i < 4; i++) {
            const uuid = isMinor ? deck.drawCardMinorItems() : deck.drawCardCharacter();
            if (uuid === "")
                continue;

            const card = this.getDeckManager().getFullPlayerCard(uuid);
            if (card !== null) {
                const data = { uuid: uuid, code: card.code, hand: obj.type, clear: i == 0 };
                this.publishToPlayers("/game/arda/draw", userid, data);
                this.publishChat(userid, "drew common card " + card.code);
            }
        }

        if (isMinor)
            this.#drawOpeningStageCards(5);

        this.#drawOpeningHand(8);

        this.publishToPlayers("/game/arda/hand/show", userid, {});
        this.publishToPlayers("/game/start", userid, {});
        this.onCheckDraft(userid, socket);
    }

    #drawOpeningStageCards(count: number) {
        const userid = this.getDeckManager().getFirstPlayerId();
        const deck = this.getDeckManager().getAdminDeck();
        if (deck === null || deck.getHandStage().length > 0)
            return;

        for (let i = 0; i < count; i++) {
            const uuid = deck.drawCardStage();
            if (uuid === "")
                continue;

            const card = this.getDeckManager().getFullPlayerCard(uuid);
            if (card !== null) {
                const data = { uuid: uuid, code: card.code, hand: "stage", clear: i == 0 };
                this.publishToPlayers("/game/arda/draw", userid, data);
            }
        }
    }

    #drawOpeningHand(count: number) {
        if (!this.#reycled.characters || !this.#reycled.minors)
            return false;

        const players = this.getDeckManager().getPlayers();
        for (let userid of players)
            this.drawCardsFromPlaydeck(userid, count);

        return true;
    }

    #clearPlayerHand() {
        let count = 0;
        const pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck === null)
            return;

        const players = this.getDeckManager().getPlayers();
        for (let userid of players) {
            const deck = this.getDeckManager().getPlayerDeck(userid);
            if (deck === null)
                continue;

            let move = [];
            for (let uuid of deck.getCardsInHand())
                move.push(uuid);

            count += move.length;
            for (let uuid of move) {
                if (deck.pop().fromAnywhere(uuid))
                    pAdminDeck.push().toPlaydeck(uuid);
            }
        }

        this.publishChat(this.getHost(), count + " card(s) moved from hand into playdeck.");
        this.publishToPlayers("/game/hand/clear", this.getHost(), {});
    }

    #getGenericCharacterCount(data: any): number {
        if (typeof data !== "number" || data < 8)
            return 8
        else
            return data;
    }

    onAssignCharacters(userid: string, socket: any, data: any) {

        this.#assignOpeningChars7();
        this.#assignOpeningChars(this.#getGenericCharacterCount(data?.count));

        this.#reycled.ready = true;
        this.onCheckDraft(userid, socket);
    }

    #getViewDeck(userid: string, pile: string, type: string): string[] {
        const cards = this.getDeckManager().getCards() as HandManagerArda;
        if (type === "minor") {
            if (pile === "playdeck")
                return cards.playdeckMinor(userid);
            else if (pile === "discard")
                return cards.discardPileMinor(userid);
        }
        else if (type === "mps") {
            if (pile === "playdeck")
                return cards.playdeckMPs(userid);
            else if (pile === "discard")
                return cards.discardPileMPs(userid);
        }
        else if (type === "charackters") {
            if (pile === "playdeck")
                return cards.playdeckCharacters(userid);
            else if (pile === "discard")
                return cards.discardPileCharacters(userid);
        }
        else if (type === "stage") {
            if (pile === "playdeck")
                return cards.playdeckStage(userid);
            else if (pile === "discard")
                return cards.discardPileStage(userid);
        }

        return [];
    }

    onViewCards(userid: string, socket: any, obj: any) {
        const type = obj.type;
        const pile = obj.pile;

        const _list = this.#getViewDeck(userid, pile, type);
        if (_list !== null && _list.length > 0) {
            this.publishChat(userid, " views " + type + " cards in " + pile);
            this.replyToPlayer("/game/arda/view", socket, { type: type, pile: pile, sorted: true, list: this.getCardList(_list) });
        }
    }

    onDrawCard(userid: string, _socket: any, obj: any) {
        const deck = this.getDeckManager().getPlayerDeck(userid) as DeckArda;
        if (deck === null)
            return;

        let uuid = "";
        const type = obj.type;
        if (type === "minor")
            uuid = deck.drawCardMinorItems();
        else if (type === "mps")
            uuid = deck.drawCardMarshallingPoints();
        else if (type === "charackters")
            uuid = deck.drawCardCharacter();
        else if (type === "stage")
            uuid = deck.drawCardStage();
        else
            return;

        if (uuid === "") {
            let sDeck = "There are no cards left in the ";
            if (type === "mps")
                sDeck += "marshalling points deck";
            else if (type === "minor")
                sDeck += "minor items offering deck";
            else if (type === "stage")
                sDeck += "stage resource deck";
            else
                sDeck += "roving characters deck";

            this.publishToPlayers("/game/notification", userid, { type: "warning", message: sDeck });
            return;
        }

        const card = this.getDeckManager().getFullPlayerCard(uuid);
        if (card === null)
            return;

        this.updateCardOwnership(userid, card);

        const data = { uuid: uuid, code: card.code, hand: obj.type, clear: false };
        this.publishToPlayers("/game/arda/draw", userid, data);
        this.publishChat(userid, "drew 1 " + obj.type + " item card");

        if (type === "mps")
            this.publishToPlayers("/game/watch/draw", userid, { uuid: uuid, code: card.code, type: card.type, playerid: userid });
    }

    onCheckDraft(_userid: string, socket: any) {
        const data = {
            characters: this.#reycled.characters,
            minoritems: this.#reycled.minors,
            ready: this.#reycled.ready
        };

        this.replyToPlayer("/game/arda/checkdraft", socket, data);
    }

    refreshAllHandsOfAllPlayers(userid: string, socket: any) {
        super.refreshAllHandsOfAllPlayers(userid, socket);

        for (let id of this.getPlayerIds()) {
            const listMP = this.getCardList(this.getDeckManager().getCards().handMarshallingPoints(id));
            this.publishToPlayers("/game/arda/hand/marshallingpoints", id, { list: listMP });
        }

        const pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck !== null) {
            let list = this.getCardList(pAdminDeck.getHandCharacters());
            this.publishToPlayers("/game/arda/hand/characters", userid, { list: list });

            list = this.getCardList(pAdminDeck.getHandMinorItems());
            this.publishToPlayers("/game/arda/hand/minor", userid, { list: list });

            const listStage = this.getCardList(pAdminDeck.getHandStage());
            this.publishToPlayers("/game/arda/hand/stage", userid, { list: listStage });
        }
    }

    onGetHandMinorItems(userid: string) {
        const pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck === null)
            return;

        const listMP = this.getCardList(this.getDeckManager().getCards().handMarshallingPoints(userid));
        this.publishToPlayers("/game/arda/hand/marshallingpoints", userid, { list: listMP });

        const listMinor = this.getCardList(pAdminDeck.getHandMinorItems());
        this.publishToPlayers("/game/arda/hand/minor", userid, { list: listMinor });

        const listChars = this.getCardList(pAdminDeck.getHandCharacters());
        this.publishToPlayers("/game/arda/hand/characters", userid, { list: listChars });

        const listStage = this.getCardList(pAdminDeck.getHandStage());
        this.publishToPlayers("/game/arda/hand/stage", userid, { list: listStage });
    }

    joinGame(pPlayer: Player, playerId: string) {
        if (!super.joinGame(pPlayer, playerId))
            return false;

        this.#updateMPOwnershipOnInit(playerId);
        return true;
    }

    #updateMPOwnershipOnInit(userid: string) {
        const deck = this.getDeckManager().getPlayerDeck(userid) as DeckArda;
        if (deck === null)
            return;

        const uuids = deck.GetDeckListPile("handCardsMP");
        if (uuids === null || uuids.length === 0)
            return;

        for (let uuid of uuids) {
            const card = this.getDeckManager().getFullPlayerCard(uuid);
            if (card !== null)
                this.updateCardOwnership(userid, card);
        }
    }

    onMoveArdaHandCard(userid: string, socket: any, obj: any) {
        if (obj.to !== "hand" && obj.to !== "discardpile")
            return;

        const uuid = obj.uuid;
        const deck = this.getDeckManager().getPlayerDeck(userid);
        if (deck === null) {
            Logger.warn("Cannot find arda deck of player " + userid);
            return;
        }

        let bOk = false;

        if (obj.type === "minor")
            bOk = deck.pop().fromHandMinor(uuid)
        else if (obj.type === "mps")
            bOk = deck.pop().fromHandMps(uuid)
        else if (obj.type === "charackters")
            bOk = deck.pop().fromHandCharacters(uuid)
        else if (obj.type === "stage")
            bOk = deck.pop().fromHandStage(uuid)

        if (!bOk)
            return;

        const card = this.getDeckManager().getFullPlayerCard(uuid);
        if (card === null)
            return;

        /** this is essential, otherwise a card will not be removed from the respective hand */
        this.updateCardOwnership(userid, card);

        this.publishToPlayers("/game/arda/hand/card/remove", userid, { uuid: obj.uuid });
        if (obj.to === "hand") {
            deck.push().toPlaydeckSpecific(uuid);
            this.drawSingleCard(userid);
            this.publishChat(userid, "moved 1 arda " + obj.type + " item card to their hand");
        }
        else if (obj.to === "discardpile") {
            deck.push().toDiscardpile(uuid);
            this.publishChat(userid, "discarded 1 card from arda hand " + obj.type);
        }
    }

    init() {
        super.init();

        this.getMeccgApi().addListener("/game/arda/hands", this.onGetHandMinorItems.bind(this));
        this.getMeccgApi().addListener("/game/arda/checkdraft", this.onCheckDraft.bind(this));
        this.getMeccgApi().addListener("/game/arda/from-hand", this.onMoveArdaHandCard.bind(this));
        this.getMeccgApi().addListener("/game/arda/draw", this.onDrawCard.bind(this));
        this.getMeccgApi().addListener("/game/arda/recycle", this.onRecycle.bind(this));
        this.getMeccgApi().addListener("/game/arda/assign-characters", this.onAssignCharacters.bind(this));
        this.getMeccgApi().addListener("/game/arda/view", this.onViewCards.bind(this));
        this.getMeccgApi().addListener("/game/arda/shuffle", this.onShuffle.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/start", this.onTradeStart.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/cancel", this.onTradeCancel.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/remove", this.onTradeRemove.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/offer", this.onTradeOffer.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/accept", this.onTradeAccept.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/perform", this.onTradePerform.bind(this));
        this.getMeccgApi().addListener("/game/arda/sites", this.#onSendArdaSites.bind(this));
    }
}

