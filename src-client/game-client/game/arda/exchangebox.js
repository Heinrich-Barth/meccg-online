class ArdaExchangeBox extends TradeCards {

    labelErrorTooFewPlayers()
    {
        return Dictionary.get("arda_trade_toofew", "Another player is needed to trade cards");
    }

    labelChooseTradingPartner()
    {
        return Dictionary.get("arda_trade_choose", "Choose player to trade with");
    }

    labelChoosePlayerToTradeWith()
    {
        return Dictionary.get("arda_trade_choose_trading", "Please choose one player to trade cards with");
    }

    getRouteTradeStart()
    {
        return "/game/arda/trade/start";
    }

    getRouteTradeCancel()
    {
        return "/game/arda/trade/cancel";
    }

    getRouteTradeRemove()
    {
        return "/game/arda/trade/remove";
    }

    getRouteTradeOffer()
    {
        return "/game/arda/trade/offer";
    }

    getRouteTradeAccept()
    {
        return "/game/arda/trade/accept";
    }

    getRouteTradeSuccess()
    {
        return "/game/arda/trade/success";
    }

    getRouteTradePerform()
    {
        return "/game/arda/trade/perform";
    }

    tradeSuccess(isMe, jData)
    {
        if (super.tradeSuccess(isMe, jData))
        {
            Arda.getOpeningHands();
            Arda.getRegularHand();
        }
    }

    create(leftIconDivId)
    {
        const container = document.getElementById(leftIconDivId);
        if (container === null)
            return false;

        const div = document.createElement("div");
        const a = document.createElement("i");

        a.setAttribute("title", Dictionary.get("arda_trade_link", "Click to exchange cards with another player"));
        a.setAttribute("data-translate-title", "arda_trade_link");
        a.setAttribute("class", "blue-box fa fa-exchange");
        a.setAttribute("aria-hidden", "true");
        a.onclick = this.onChoosePlayer.bind(this);
        
        div.setAttribute("class", "arda-hand-container arda-hand-container-trade");
        div.appendChild(a);
        container.prepend(div);
        return true;
    }

}