
const AddCardsInGame = {

    toDeck : function(code)
    {
        if (typeof code !== "string" || code === "")
            return [];

        try
        {
            return [{
                    code : code,
                    count : 1
                }];
        }
        catch (err)
        {
            MeccgUtils.logError(err);
        }

        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not convert your list to a deck." }));
        return [];
    },

    onEvent : function()
    {
        this.createHtml();

        const elem = document.getElementById("add-cards-wrapper");
        elem.classList.remove("hide");
        elem.querySelector("input").focus();
    },

    onClose : function()
    {
        DomUtils.removeNode(document.getElementById("add-cards-wrapper"));
    },

    createHtml : function()
    {
        if (document.getElementById("add-cards-wrapper") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("id", "add-cards-wrapper");
        div.setAttribute("class", "hide");
        div.innerHTML = `<div id="add-cards-overlay" class="config-panel-overlay"></div>
            <div class="add-cards-box blue-box">
                <h2 data-translate-inner="importtosb_title">${Dictionary.get("importtosb_title", "Add cards to your Sideboard")}</h2>
                <p>Search for cards and click them to add a copy to your sideboard.</p>
                <input type="text" class="config-panel-text" name="cards_to_add" data-translate-placeholder="importtosb_tip" placeholder="Search for card name here">
                <div class="result" id="add-card-result"></div>
            </div>`;

        const jTarget = div.querySelector(".add-cards-box");

        let button = document.createElement("input");
        button.setAttribute("type", "button");
        button.setAttribute("class", "button buttonCancel");
        button.setAttribute("value", Dictionary.get("cancel", "Cancel"));
        button.onclick = this.onClose;
        jTarget.appendChild(button);

        jTarget.querySelector("input").onkeyup = this.onOnChange;
        const _div = div.querySelector(".config-panel-overlay");
        _div.onclick = this.onClose;
        
        document.body.appendChild(div);
    },

    onOnChange : function(e)
    {
        if (typeof e.stopPropagation !== "undefined")
            e.stopPropagation();

        if (typeof e.cancelBubble !== "undefined")
            e.cancelBubble = true;

        if (e.target.value.length < 3)
            return;

        const container = document.getElementById("add-card-result");
        if (container === null)
            return;

        const res = g_Game.CardList.searchByName(e.target.value.toLowerCase());        
        DomUtils.removeAllChildNodes(container);

        for (let card of res)
        {
            const img = document.createElement("img");
            img.setAttribute("class", "card-icon");
            img.setAttribute("src", card.image);
            img.setAttribute("title", "Click to add " + card.code);
            img.setAttribute("data-code", card.code);
            img.onmouseover = CardPreview._doHoverOnGuard;        
            img.onmouseout = CardPreview.hideAll;
            img.onclick = AddCardsInGame.onImageClick;
            container.appendChild(img);
        }
    },

    onImageClick(e)
    {
        const img = e.target;
        const code = img ? img.getAttribute("data-code") : "";
        const jDeck = AddCardsInGame.toDeck(code);
        if (jDeck.length !== 0)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("importtosb_message_add_list_ok", code + " added to your sideboard.") }));
            MeccgApi.send("/game/card/add", { cards: jDeck });
            e.target.classList.add("added");    
        }
    }
};

document.body.addEventListener("meccg-cards-add-ingame", AddCardsInGame.onEvent.bind(AddCardsInGame), false);
