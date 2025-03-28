
class Question {

    #callbackCancel = null;
    #addCancel;
    #css = "";

    constructor(icon = "fa-question-circle", showCancel = true)
    {
        this.callbackOk = null;
        this.icon = icon === undefined || icon === "" ? "fa-question-circle" : icon;
        this.#addCancel = showCancel;
    }

    static removeNode(node)
    {
        if (node !== null)
        {
            while (node.firstChild) 
                node.removeChild(node.firstChild);

            node.parentNode.removeChild(node)
        }
    }
    
    addClass(sClass)
    {
        if (sClass !== "")
        {
            if (this.#css === "")
                this.#css = sClass;
            else
                this.#css += " " + sClass;
        }

        return this;
    }

    #createTitle(title)
    {
        const h3 = document.createElement("h3");
        h3.innerText = title;
        return h3;
    }

    #createContent(title, message)
    {
        const res = document.createElement("div");
        res.setAttribute("class", "question-question");
        res.append(this.#createTitle(title));

        if (typeof message === "string")
        {
            const p = document.createElement("p");
            p.setAttribute("class", "bold");
            p.innerText = message;
            res.append(p);
        }
        else if (message)
            res.append(message);

        return res;
    }

    #createButtons(labelOk, sLabelCancel)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "question-answers");

        const buttonOk = document.createElement("input");
        buttonOk.setAttribute("name", "deck");
        buttonOk.setAttribute("class", "w100");
        buttonOk.setAttribute("type", "button");
        buttonOk.setAttribute("id", "q_ok");
        buttonOk.setAttribute("value", labelOk);

        const cancelCss = this.#addCancel ? "" : "question-hide-cancel";
        const buttonCancel = document.createElement("input");
        buttonCancel.setAttribute("name", "deck");
        buttonCancel.setAttribute("class", "w100 cancel " + cancelCss);
        buttonCancel.setAttribute("type", "button");
        buttonCancel.setAttribute("id", "q_cancel");
        buttonCancel.setAttribute("value", sLabelCancel);

        div.append(buttonOk, buttonCancel);
        return div;
    }

    #createQuestionIcon()
    {
        const divQ = document.createElement("div");
        divQ.setAttribute("class", `fa ${this.icon} question-icon`);
        return divQ;
    }

    #insertTemplate(title, message, labelOk, sLabelCancel = "Cancel")
    {
        const div = document.createElement("div");
        div.setAttribute("class", "hidden");
        div.setAttribute("id", "question_box");
        div.setAttribute("data-game", "");

        const tplContent = document.createDocumentFragment();

        tplContent.append(
            this.#createQuestionIcon(),
            this.#createContent(title, message),
            this.#createButtons(labelOk, sLabelCancel)
        );
        
        const innerDiv = document.createElement("div");
        innerDiv.setAttribute("class", "blue-box question-game ");
        innerDiv.append(tplContent);
        innerDiv.onclick = (e) => { if (e.stopPropagation) e.stopPropagation(); }

        if (this.#css !== "")
        {
            const divCss = document.createElement("div");
            divCss.setAttribute("class", this.#css);
            innerDiv.appendChild(divCss);
        }

        div.appendChild(innerDiv);
        
        document.body.appendChild(div);
    }

    close()
    {
        const jBox = document.getElementById("question_box");
        if (jBox !== null)
            jBox.classList.add("hidden");
        
        Question.removeNode(document.getElementById("q_ok"));
        Question.removeNode(document.getElementById("q_cancel")); 
        Question.removeNode(document.getElementById("question_box")); 
    }

    isVisible()
    {
        return document.getElementById("question_box") !== null;
    }

    hideCancel()
    {
        this.#addCancel = false;
    }

    show(sTitle, sInfo, sLabelOk = "Ok", sLabelCancel = "Cancel")
    {
        if (this.isVisible())
            this.close();

        this.#insertTemplate(sTitle, sInfo, sLabelOk, sLabelCancel);
    
        document.getElementById("question_box").onclick = this.close.bind(this);
        document.getElementById("q_cancel").onclick = this.onClickCancel.bind(this);
        document.getElementById("q_ok").onclick = this.onClickOk.bind(this);
        
        const jBox = document.getElementById("question_box");
        jBox.setAttribute("data-game", "");
        jBox.classList.remove("hidden");
    }

    onClickOk()
    {
        this.close();

        if (this.callbackOk !== null)
            this.callbackOk();
    }

    onClickCancel()
    {
        this.close();

        if (this.#callbackCancel != null)
            this.#callbackCancel();
    }

    onCancel(callback)
    {
        this.#callbackCancel = callback;
        return this;
    }

    onOk(callback)
    {
        this.callbackOk = callback;
        return this;
    }
}

(function(){
    const styleSheet = document.createElement("link")
    styleSheet.setAttribute("rel", "stylesheet");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("href", "/dist-client/css/question.css");
    document.head.appendChild(styleSheet)
})();