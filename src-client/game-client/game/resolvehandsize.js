
class ResolveHandSizeFirst 
{
    #idContainer;
    #sHandName;
    #phases;
    #idSize;

    constructor(idContainer, idSize, sHandName, aPhases)
    {
        this.#idContainer = idContainer;
        this.#idSize = idSize;
        this.#sHandName = sHandName === undefined || sHandName === "" ? "cards" : sHandName;
        this.#phases = aPhases === undefined || aPhases.length === 0 ? null : aPhases;
        
    }

    static isVisitor()
    {
        return document.body.getAttribute("data-is-watcher") === "true";
    }

    static create(idContainer, idSize, sHandName, aPhases)
    {
        if (idSize === "" || idContainer === "" || ResolveHandSizeFirst.isVisitor())
            return;

        const pThis = new ResolveHandSizeFirst(idContainer, idSize, sHandName, aPhases);
        if (pThis.#isAvailable())
            document.body.addEventListener("meccg-check-handsize", pThis.onResolveHandSizeFirst.bind(pThis), false);
    }

    #isApplicable(sPhase)
    {
        return this.#phases === null || this.#phases.includes(sPhase);
    }

    #isAvailable()
    {
        return document.getElementById(this.#idContainer) !== null && document.getElementById(this.#idSize) !== null;
    }

    #getAllowed()
    {
        try
        {
            const elem = document.getElementById(this.#idSize);
            if (elem !== null)
                return parseInt(elem.innerText)
        }
        catch (err)
        {
        }

        return -1;
    }

    #createMessage(nAllowed, nSize)
    {
        const nDiff = nAllowed - nSize;
        if (nDiff > 0)
            return Dictionary.get("resolve_draw", "Please draw") + " " + nDiff + " " + this.#sHandName;
        else
            return Dictionary.get("resolve_discard", "Please discard") + " " + (nDiff*-1) + " " + this.#sHandName;
    }

    #countHandCards()
    {
        return ArrayList(document.getElementById(this.#idContainer)).findByClassName("card-hand").size();
    }

    #isHidden()
    {
        const elem = document.getElementById(this.#idContainer);
        return elem?.parentElement.classList.contains("hidden") === true;
    }

    onResolveHandSizeFirst(e)
    {
        try
        {
            if (!this.#isApplicable(e.detail) || this.#isHidden())
                return;

            const nAllowed = this.#getAllowed();
            if (nAllowed > -1)
            {
                const nSize = this.#countHandCards();
                if (nSize !== nAllowed) 
                    document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": this.#createMessage(nAllowed, nSize) }));    
            }
        }
        catch (err)
        {
            MeccgUtils.logError(err);
        }
    }
}

class ResolveHandSizeContainer
{
    static #idCount = 0;
    
    static updateSize(id, nAdd)
    {
        try
        {
            let pElem = document.getElementById(id);
            const nAllowed = parseInt(pElem.innerHTML.trim()) + nAdd;
            pElem.innerHTML = nAllowed;
        }
        catch (err)
        {

        }
    }

    static increase(e)
    {
        ResolveHandSizeContainer.updateSize(e.target.getAttribute("data-for"), 1);
    }

    static decrease(e)
    {
        ResolveHandSizeContainer.updateSize(e.target.getAttribute("data-for"), -1);
    }

    static create(elemContainer, sTextPrefix, nCount, sTextSuffix)
    {
        if (elemContainer === null)
            return "";

        let _i;
        const idSizerValue = "card-hand-size-limit-" + (++ResolveHandSizeContainer.#idCount);
        
        const div = document.createElement("div");
        div.setAttribute("class", "card-hands-sizer");
        
        if (sTextPrefix !== "")
            div.appendChild(document.createTextNode(sTextPrefix));

        _i = document.createElement("i");
        _i.setAttribute("class", "fa fa-plus-square card-hands-sizer-plus");
        _i.setAttribute("title", Dictionary.get("resolve_inc", "Increase hand size"));
        _i.setAttribute("data-for", idSizerValue);
        _i.setAttribute("aria-hidden", "true");
        _i.onclick = ResolveHandSizeContainer.increase;
        div.appendChild(_i);

        _i = document.createElement("span");
        _i.setAttribute("id", idSizerValue);
        _i.setAttribute("class", "card-hands-sizer-size");
        _i.innerHTML = nCount;
        div.appendChild(_i);

        _i = document.createElement("i");
        _i.setAttribute("class", "fa fa-minus-square card-hands-sizer-minus");
        _i.setAttribute("title", Dictionary.get("resolve_dec", "Decrease hand size"));
        _i.setAttribute("data-for", idSizerValue);
        _i.setAttribute("aria-hidden", "true");
        _i.onclick = ResolveHandSizeContainer.decrease;
        div.appendChild(_i);

        if (sTextSuffix !== "")
            div.appendChild(document.createTextNode(sTextSuffix));

        elemContainer.prepend(div);
        return idSizerValue;
    }

    static #getCount()
    {
        return document.body.getAttribute("data-is-singleplayer") === "true" ? 5 : 8;
    }

    static createHandContainer()
    {
        const handContent = document.getElementById("playercard-hand-content");
        if (handContent === null)
            return;

        const _handSizer = handContent.querySelector(".hand-card-sizer");
        const _sizerId = ResolveHandSizeContainer.create(_handSizer, Dictionary.get("resolve_handsizeis", "Hand size:") + " ", ResolveHandSizeContainer.#getCount(), "");
        if (_sizerId !== "")
            ResolveHandSizeFirst.create("playercard_hand_container", _sizerId, "cards");
    }
}

