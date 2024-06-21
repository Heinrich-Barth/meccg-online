
const AddCardsInGame = {

    _added : false,

    removeQuotes : function(sCode) 
    {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, '');
    },

    getCount : function(line)
    {
        let nPos = line.indexOf(" ");
        if (nPos === -1)
            return "";
        else 
            return line.toString().substring(0, nPos);
    },

    getCode : function(line)
    {
        let nPos = line.indexOf(" ");
        if (nPos === -1)
            return "";
        else 
            return this.removeQuotes(line.toString().substring(nPos+1).trim());
    },

    toDeck : function(sText)
    {
        try
        {
            const asLines = sText.trim().split('\n');
            let jDeck = [];

            for (let _entry of asLines)
            {
                const sCount = AddCardsInGame.getCount(_entry);
                const sCode = AddCardsInGame.getCode(_entry);
                const nCount = sCount !== "" ? parseInt(sCount) : 0;
              
                if (sCode !== "" && nCount > 0)
                {
                    jDeck.push({
                        code : sCode,
                        count : nCount
                    });
                }
            }

            if (jDeck.length > 0)
                return jDeck;
        }
        catch (err)
        {
            MeccgUtils.logError(err);
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not convert your list to a deck." }));
        }

        return null;
    },

    onEvent : function()
    {
        this.createHtml();

        const elem = document.getElementById("add-cards-wrapper");
        elem.classList.remove("hide");
        elem.querySelector("textarea").focus();
    },

    onAdd : function()
    {
        let sText = document.getElementById("add-cards-wrapper").querySelector("textarea").value.toLowerCase();
        if (sText === undefined || sText.trim() === "")
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": Dictionary.get("importtosb_message_add_list", "Please add cards to the list.") }));
        }
        else
        {
            const jDeck = AddCardsInGame.toDeck(sText);
            if (jDeck !== null)
            {
                AddCardsInGame.onClose();
                document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("importtosb_message_add_list_ok", "Cards were added to your sideboard.") }));
                MeccgApi.send("/game/card/add", { cards: jDeck });        
            }
        }

        return false;
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
                <p data-translate-inner="importtosb_p">${Dictionary.get("importtosb_p", "Please open the deckbuilder and copy the cards to add here.")}</p>
                <textarea name="cards_to_add" data-translate-placeholder="importtosb_tip" placeholder="${Dictionary.get("importtosb_tip", "copy card codes here, e.g. 1 Gandalf [H] (TW)")}"></textarea>
                <p>&nbsp;</p>
            </div>`;

        const jTarget = div.querySelector(".add-cards-box");

        let button = document.createElement("input");
        button.setAttribute("type", "button");
        button.setAttribute("class", "button buttonCancel");
        button.setAttribute("value", Dictionary.get("cancel", "Cancel"));
        button.onclick = this.onClose;
        jTarget.appendChild(button);

        button = document.createElement("input");
        button.setAttribute("type", "button");
        button.setAttribute("class", "button buttonUpdate");
        button.setAttribute("value", Dictionary.get("importtosb_button_add", "Add to sideboard"));
        button.onclick = this.onAdd.bind(this);
        jTarget.appendChild(button);

        jTarget.querySelector("textarea").onkeyup = this.onOnChange;
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
    }
};

document.body.addEventListener("meccg-cards-add-ingame", AddCardsInGame.onEvent.bind(AddCardsInGame), false);
