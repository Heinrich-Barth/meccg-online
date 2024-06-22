

class ChatBox {

    static getTimeString(lTime) {
        return lTime < 10 ? "0" + lTime : "" + lTime;
    }

    create() {
        const target = document.getElementById("chat_icon");
        if (document.getElementById("chatbox") !== null || target == null)
            return;

        target.onclick = this.#toggleView.bind(this);

        const form = document.createElement("div");
        form.setAttribute("class", "chatbox-form-container");
        form.append(this.#createChatform())

        const log = document.createElement("div");
        log.setAttribute("id", "chatbox__log");
        log.setAttribute("class", "chatbox-log");

        const div = document.createElement("div");
        div.setAttribute("class", "chatbox");
        div.setAttribute("id", "chatbox");
        div.append(log, form);

        document.body.appendChild(div);

        this.#toggleView();
    }

    #submitSelection(e) {
        const code = e.target?.getAttribute("data-item");
        if (code && code !== "")
            MeccgApi.send("/game/chat/predefined", code);    
    }

    #defaultValues = {
        "chat_item_prepare": "Prepration",
        "chat_item_prepare_1": "You can start the draft",
        "chat_item_prepare_2": "I will start the draft",
        "chat_item_prepare_3": "Let's roll to see who starts the draft",
        "chat_item_mh": "M/H",
        "chat_item_mh_1": "Any (more) hazards?",
        "chat_item_mh_2": "No more hazards",
        "chat_item_mh_3": "Which character(s) face attack - please mark",
        "chat_item_mh_4": "Roll body check",
        "chat_item_mh_5": "Next company",
        "chat_item_mh_6": "Your points",
        "chat_item_general": "General",
        "chat_item_general_1": "Yes",
        "chat_item_general_2": "No",
        "chat_item_general_3": "Done",
        "chat_item_general_4": "Let's go.",
        "chat_item_general_5": "You there?",
        "chat_item_general_6": "Hang on",
        "chat_item_general_7": "Wait a second",
        "chat_item_general_8": "Card effects",
        "chat_item_end": "End Game",
        "chat_item_end_1": "Let's call the council",
        "chat_item_end_2": "Let's count MPs",
        "chat_item_end_3": "Ready to end the game"
    }

    #getDefaultValue(key)
    {
        const val = this.#defaultValues[key];
        return typeof val === "string" ? val : "";
    }

    #getDictionaryEntry(key)
    {
        return Dictionary.get(key, this.#getDefaultValue(key));
    }

    #createSection(title, min, maxInc) {
        const div = document.createElement("div");

        const h3 = document.createElement("h3");
        h3.innerText = this.#getDictionaryEntry("chat_item_" + title);
        div.append(h3);


        for (let i = min; i <= maxInc; i++) {
            let text = this.#getDictionaryEntry("chat_item_" + title + "_" + i);
            if (text === "")
                text = title + "_" + i;

            const a = document.createElement("div");
            a.setAttribute("data-item", "chat_item_" + title + "_" + i);
            a.setAttribute("class", "chat_item__item");
            a.setAttribute("title", text);
            a.onclick = this.#submitSelection.bind(this);
            a.innerText = text;
            div.append(a);
        }

        return div;
    }

    #createPrefeinedList() {
        const list = document.createDocumentFragment();

        list.append(
            this.#createSection("prepare", 1, 3),
            this.#createSection("mh", 1, 6),
            this.#createSection("general", 1, 8),
            this.#createSection("end", 1, 3),
        );
        return list;
    }

    #onInputKeyUp(e) {
        e.stopPropagation();

        if (e.code.toLowerCase() === "enter" && e.target.value) {
            this.#submitMessage(e.target.value.trim());
            e.target.value = "";
        }
    }

    #submitMessage(text) {
        if (text.indexOf("<") === -1 && text.indexOf(">") === -1)
            MeccgApi.send("/game/chat/text", this.#ensureLength(text, 100));
    }

    #createChatform() {
        const container = document.createDocumentFragment();

        const div = document.createElement("div");
        div.setAttribute("class", "message-form");
        div.append(this.#createPrefeinedList());

        const h2 = document.createElement("h2");
        h2.innerText = Dictionary.get("chat_title", "Communicate");

        const input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("maxlength", "100");
        input.setAttribute("placeholder", Dictionary.get("chat_placeholder", "type message and hit enter to send"));

        if (document.body.getAttribute("data-is-watcher") === "true")
            input.disabled = true;
        else
            input.onkeyup = this.#onInputKeyUp.bind(this);

        container.append(
            h2,
            input,
            div
        );

        return container;
    }

    #ensureLength(sText, nLen) {
        if (sText.length > nLen)
            return sText.substr(0, nLen - 1) + "...";
        else
            return sText;
    }

    #predefMessage(sFrom, id) {
        const text = this.#getDictionaryEntry(id);
        if (text !== "")
            this.#textMessage(sFrom, text);

        return text;
    }

    #textMessage(sFrom, sText) {
        if (!this.#isValidInput(sText) || sText === "")
            return;

        const text = document.createElement("div");
        const val = document.createDocumentFragment();

        if (sFrom !== "(unknown)") {
            const b = document.createElement("b");
            b.innerText = sFrom;
            val.append(b, document.createTextNode(" "));
        }

        val.append(document.createTextNode(this.#ensureLength(sText, 200)));
        text.append(val);

        const objDiv = document.getElementById("chatbox__log");
        objDiv.prepend(text);

        this.#reduceMessages(objDiv);
        objDiv.scrollTop = 0;
    }

    #message(sFrom, sText, id, usertext = "", isme = false) {

        if (!this.#isValidInput(sFrom))
            return;

        if (sText !== "")
        {
            this.#textMessage(sFrom, sText);
            return;
        }

        let textmessage = "";
        if (id && id !== "") {
            const txt = this.#predefMessage(sFrom, id);

            if (!isme)
                textmessage = txt;
        }
        else if (usertext !== "")
        {
            this.#textMessage(sFrom, usertext);
            if (!isme)
                textmessage = usertext;
        }

        if (textmessage !== "")
        {
            this.#sendNotification(textmessage);
            this.#notifyPlayer();                    
        }
    }

    #sendNotification(text)
    {
        if (text !== "")
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": text }));
    }

    #notifyPlayer() {
        document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "chatmessage" }));

        if (this.#messagePanelIsVisible())
            return

        const icon = document.getElementById("chat_icon");
        if (icon !== null)
            icon.classList.add("chat_icon_newmessage");
    }

    #reduceMessages(div) {
        const maxLen = 70;
        const list = div.querySelectorAll("div");
        if (list !== null && list.length > maxLen && div.lastChild)
            div.removeChild(div.lastChild);
    }

    #isValidInput(sText) {
        return sText !== undefined && sText.indexOf("<") === -1 && sText.indexOf(">") === -1;
    }

    #messagePanelIsVisible() {
        return !document.getElementById("chatbox").classList.contains("hidden");
    }

    #toggleView() {
        const elem = document.getElementById("chatbox");
        const icon = document.getElementById("chat_icon");

        if (this.#messagePanelIsVisible()) {
            elem.classList.add("hidden");
            icon.classList.add("fa-commenting-o");
            icon.classList.remove("fa-commenting");
        }
        else {
            elem.classList.remove("hidden");
            icon.classList.add("fa-commenting");
            icon.classList.remove("fa-commenting-o");
            icon.classList.remove("chat_icon_newmessage");
        }
    }

    static OnChatMessageReceived(e) {
        new ChatBox().#message(
            e.detail.name, 
            e.detail.message, 
            e.detail.id, 
            e.detail.usertext ?? "", 
            e.detail.isMe === true, 
        );
    }
}

new ChatBox().create();
document.body.addEventListener("meccg-chat-message", ChatBox.OnChatMessageReceived, false);    