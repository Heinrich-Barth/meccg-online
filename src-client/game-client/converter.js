

const removeQuotes = function(sCode) 
{
    if (sCode.indexOf('"') === -1)
        return sCode;
    else
        return sCode.replace(/"/g, '');
};
 
const getCardCodeList = function()
{
    function toJson(sId, vsCards)
    {
        let _code;
        for (_code of document.getElementById(sId).value.split('\n'))
        {
            const candidate = createValidCodeEntry(_code);
            if (candidate.count > 0 && candidate.code !== "")
                vsCards.push(candidate.code);
        }

        return vsCards;
    }

    let _res = [];

    toJson("pool", _res);
    toJson("sideboard", _res);
    toJson("characters", _res);
    toJson("resources", _res);
    toJson("hazards", _res);

    return _res;
};

const createValidCodeEntry = function(line)
{
    const result = {
        count: 0,
        code: ""
    };

    line = line.trim();
    if (line.length < 3 || line.indexOf("#") === 0)
        return result;

    let cand = line.substring(0, 2).trim();
    const count = parseInt(cand);
    if (isNaN(count))
    {
        result.count = 1;
        result.code = line.trim();
    }
    else
    {
        result.count = count;
        result.code = line.substring(2).trim();
    }

    return result;
}
 
const getCount = function(line)
{
    let nPos = line.indexOf(" ");
    if (nPos === -1)
        return "";
    else 
        return line.toString().substring(0, nPos);
};

const getCode = function(line)
{
    let nPos = line.indexOf(" ");
    return nPos === -1 ? "" : removeQuotes(line.toString().substring(nPos+1).trim());
};


const createDeck = function()
{
    let count = 0;

    function toJson(sId)
    {
        let asLines = document.getElementById(sId).value.split('\n');
        let deck = {};

        for (let _entry of asLines)
        {
            const candidate = createValidCodeEntry(_entry);
            if (candidate.count < 1 && candidate.code !== "")
                continue;

            count += candidate.count;
            
            if (deck[candidate.code])
                deck[candidate.code] += candidate.count;
            else 
                deck[candidate.code] = candidate.count;
        }

        return deck;
    }

    let jDeck = {
        pool: {
            characters: {},
            resources: toJson("pool"),
            hazards: {}
        },
        sideboard: {
            resources: toJson("sideboard"),
            characters: {},
            hazards: {}
        },
        deck: {
            characters : toJson("characters"),
            resources : toJson("resources"),
            hazards : toJson("hazards")
        },
        sites : toJson("sites")
    };

    if (count === 0)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { 
            "detail": Dictionary.get("converter.suitable", "This deck is not suitable for play. Verify that you have cards for pool, chars, and hazards/resources") 
        }));
        return null;
    }
    else
        return jDeck;
}

const isEmpty = function(jDeck)
{
    return jDeck == undefined || Object.keys(jDeck).length === 0;
};
 
 
const onPerformLogin = function()
{
    const data = createDeck();
    if (data === null) 
        return false;

    let sName = document.getElementById("deckname").value;
    if (sName === null || sName === undefined || sName === "")
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("converter.deckname", "Provide a deck name first") }));
        document.getElementById("deckname").focus();
    }
    else
    {
        sName = sName.trim();
        const det = {
            data: ReadDeck.toString(data, sName, document.getElementById("notes").value.trim()),
            name : sName
        };

        document.body.dispatchEvent(new CustomEvent("meccg-saveas-deck", { "detail": det}));
    }
};


const onProcessDeckCheckResult = function(codes)
{
    if (codes === undefined || codes.length === 0)
        return;

    const ul = document.createElement("ul");
    ul.setAttribute("class", "cookie_notice");

    const sRes = document.getElementById("resources").value;
    const sHaz = document.getElementById("hazards").value;
    const sSide = document.getElementById("sideboard").value;
    const sChars = document.getElementById("characters").value;
    const sPool = document.getElementById("pool").value;

    let divider = "";
    for (let code of codes)
    {
        let li = document.createElement("li");
        li.innerText = code + " (";
        divider = "";
        if (sRes.indexOf(code) !== -1)
        {
            li.innerText += divider + "Resources";
            divider = ", ";
        }
        if (sHaz.indexOf(code) !== -1)
        {
            li.innerText += divider + "Hazards";
            divider = ", ";
        }
        if (sSide.indexOf(code) !== -1)
        {
            li.innerText += divider + "Sideboard";
            divider = ", ";
        }
        if (sChars.indexOf(code) !== -1)
        {
            li.innerText += divider + "Characters";
            divider = ", ";
        }
        if (sPool.indexOf(code) !== -1)
        {
            li.innerText += divider + "Pool";
        }

        li.innerText += ")";
        ul.appendChild(li);
    }

    document.getElementById("invalid-cards-info-result").appendChild(ul);
    document.getElementById("invalid-cards-info").classList.remove("hidden");
};

const onCheckCardCodes = function()
{
    if (g_pDeckTextFields.onCheckNameCodeSuggestions())
        return;
 
    const vsCards = getCardCodeList();
    if (vsCards.length === 0)
        return;

    const options = {
        method: 'POST',
        body: JSON.stringify(vsCards),
        headers: {
            'Content-Type': 'application/json'
        }
    }
 
    fetch("/data/decks/check", options).then((response) =>
    {
        if (response.status === 200)
        {
            response.json().then((data) => 
            {
                if (data.valid === true)
                    onPerformLogin();
                else 
                    onProcessDeckCheckResult(data.codes);
            });
        }
    }).catch(() => 
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("converter.nostatus", "Could not check deck status.") }));
    });   
};

const g_pDeckTextFields = new DeckTextFields();
(function()
{
    g_pDeckTextFields.insert("deck-text-fields", "");
    document.getElementById("host").onclick = onCheckCardCodes;
})();