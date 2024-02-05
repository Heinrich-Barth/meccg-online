class PlayerSelectorAction {

    #includeAllOption = false;

    showError(message)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": message }));
    }
    showWarning(message)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": message }));
    }
    showSuccess(message)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": message }));
    }

    labelErrorTooFewPlayers()
    {
        return "Another player is needed to show cards to";
    }

    labelChooseTradingPartner()
    {
        return "Choose player to show cards";
    }

    labelChoosePlayerToTradeWith()
    {
        return "Please choose one player to show cards";
    }

    includeAllOption(b)
    {
        this.#includeAllOption = b === true;
        return this;
    }

    
    onChoosePlayer()
    {
        const pPlayersCurrent = MeccgPlayers.getPlayers();
        const sizeCurrent = Object.keys(pPlayersCurrent).length;
        if (sizeCurrent < 2)
        {
            this.showError(this.labelErrorTooFewPlayers());
            return;
        }

        const div = document.createElement("div");
        div.setAttribute("id", "restore-game");
        div.setAttribute("class", "restore-game trade-panel config-panel");

        let _temp = document.createElement("div");
        _temp.setAttribute("class", "config-panel-overlay");
        _temp.setAttribute("title", "click here to cancel");
        _temp.setAttribute("id", "trade-panel-overlay");
        _temp.onclick = this.removeOverlay.bind(this);
        div.appendChild(_temp);

        _temp = document.createElement("div");
        _temp.setAttribute("class", "config-panel blue-box restore-panel");
        _temp.setAttribute("id", "trade-panel");
        div.appendChild(_temp);

        let _element = document.createElement("h2");
        _element.innerText = this.labelChooseTradingPartner();
        _temp.appendChild(_element);

        _element = document.createElement("p");
        _element.innerText = this.labelChoosePlayerToTradeWith();
        _temp.appendChild(_element);

        const playerList = this.#createPlayerList(pPlayersCurrent);
        const _otherPlayerId = playerList.otherPlayerId;

        _temp.appendChild(playerList.html);

        _element = document.createElement("button");
        _element.innerText = "Cancal";
        _element.onclick = this.removeOverlay.bind(this);
        _temp.appendChild(_element);

        if (sizeCurrent === 2 && _otherPlayerId !== "")        
            this.onTriggerTrading(null, _otherPlayerId);
        else
            document.body.appendChild(div);
    }

    #createPlayerLink(id, label)
    {
        const _li = document.createElement("li");
        const _a = document.createElement("a");
        _a.setAttribute("src", "#");
        _a.setAttribute("data-player", id);
        _a.innerText = label;
        _a.onclick = this.onTriggerTrading.bind(this);
        _li.appendChild(_a);
        return _li;
    }

    #createPlayerList(pPlayersCurrent)
    {
        const ul = document.createElement("ul");
        let _otherPlayerId = "";
        for (let key of Object.keys(pPlayersCurrent))
        {
            if (MeccgPlayers.isChallenger(key))
                continue;

            _otherPlayerId = key;
            ul.appendChild(this.#createPlayerLink(key,pPlayersCurrent[key]));
        }

        if (this.#includeAllOption)
            ul.appendChild(this.#createPlayerLink("", "All opponents"));

        return {
            html: ul,
            otherPlayerId: _otherPlayerId
        };
    }

    removeOverlay()
    {
        DomUtils.removeNode(document.getElementById("restore-game"));
    }

    onTriggerTrading(e, other)
    {
        console.error("please implemenet");
    }

    getMyId()
    {
        return MeccgPlayers.getChallengerId();
    }

}

class PlayerSelectorActionCallback extends PlayerSelectorAction
{
    #title = "Choose player";
    #text = "Please choose one player to show cards";

    #callback = () => false;

    setCallback(fn)
    {
        if (fn)
            this.#callback = fn;
        
        return this;
    }

    choosePlayer(title = "", text = "")
    {
        if (title !== "")
            this.#title = title;
        if (text !== "")
            this.#text = text;

        super.onChoosePlayer();
    }

    labelErrorTooFewPlayers()
    {
        return "Another player is needed.";
    }

    labelChooseTradingPartner()
    {
        return this.#title;
    }

    labelChoosePlayerToTradeWith()
    {
        return this.#text;
    }

    onTriggerTrading(e, otherPlayerId)
    {
        this.removeOverlay();
        
        if (typeof this.#callback !== "function")
            return false;

        if (typeof otherPlayerId === "string")
        {
            this.#callback(this.getMyId(), otherPlayerId);
        }
        else
        {
            const id = e.target.getAttribute("data-player");
            this.#callback(this.getMyId(), id);
        }

        return false;
    }

}