
let g_isInit = false;

const MapInstanceRenderer = {

    _isMovementSelection: true,

    sendResultMovement: function (e) {
        const sCodeStart = e.detail.start;
        const vsRegions = e.detail.regions;
        const sCodeTarget = e.detail.target;

        if (MapInstanceRenderer._isMovementSelection && (sCodeStart === "" || sCodeTarget === "" || vsRegions.length === 0)) 
        {
            const message = [];
            if (sCodeStart === "")
                message.push("start code");
            if (sCodeTarget === "")
                message.push("target code");
            if (vsRegions.length === 0)
                message.push("regions");

            console.warn("Movement selection is missing essential data: " + message.join(","));
            MapInstanceRenderer.cancel();
        }
        else if (!MapInstanceRenderer._isMovementSelection && sCodeStart === "") 
        {
            console.warn("Movement selection but start site missing!");
            MapInstanceRenderer.cancel();
        }
        else {
            parent.postMessage({
                type: "set",
                start: sCodeStart,
                regions: vsRegions,
                target: sCodeTarget,
            }, "*");
        }
    },

    cancel: function () {
        parent.postMessage("cancel", {});
    },

    getStartCode: function () {
        const query = window.location.search;
        const pos = typeof query === "undefined" ? -1 : query.indexOf("=");

        if (pos !== -1)
            return decodeURI(query.substring(pos + 1));
        else
            return "";
    },

    getIsShownOnly : function()
    {
        const query = window.location.search;
        return typeof query !== "undefined" && query.indexOf("only=true") !== -1;
    },
    getIsAppOnly : function()
    {
        const query = window.location.search;
        return typeof query !== "undefined" && query.indexOf("app=true") !== -1;
    },

    onInitEditor: function (data) {

        MapInstanceRenderer._isMovementSelection = false;

        new MapViewSiteImages(data).createInstance();

        const pMap = new MapViewPositioning(data);
        pMap.createInstance();
    },

    updateSelectOnClick : function()
    {
        const elem = document.getElementById("accept_on_selection_select");
        if (elem === null)
            return;

        elem.checked = sessionStorage.getItem("map_autoclose") === "true";
        elem.parentElement.setAttribute("title", "Accept movement automatically whenever you choose a target site");
        elem.onchange = (e) => 
        {
            if (e.target.checked === false)
            {
                if (sessionStorage.getItem("map_autoclose"))
                    sessionStorage.removeItem("map_autoclose");
            }
            else
                sessionStorage.setItem("map_autoclose", "true");
        }
    },

    autoCloseOnSelection:function()
    {
        const elem = document.getElementById("accept_on_selection_select");
        return elem !== null && elem.checked === true;
    },

    removeAutoCloseCheckbox:function()
    {
        document.body.classList.add("remove-site-autoclose");
    },

    onInitDefault: function (data, tapped, listPreferredCodes) {
        
        const isAppOnly = MapInstanceRenderer.getIsAppOnly();
        const ignoreSelection = isAppOnly || MapInstanceRenderer.getIsShownOnly();
        const sCode = ignoreSelection ? "" : MapInstanceRenderer.getStartCode();

        if (isAppOnly)
        {
            document.body.classList.add("maps-app-mode");
            const foundSites = document.getElementById("found_sites");
            if (foundSites)
                foundSites.onclick = () => document.getElementById("found_sites").classList.add("hidden")
        }

        MapInstanceRenderer._isMovementSelection = sCode !== "";

        new MapViewRegionsFilterable().createInstance(data.map);
        new MapViewSiteImages(data, tapped, listPreferredCodes).createInstance(!ignoreSelection);

        const pMap = new MapViewRegions(data);
        pMap.createInstance(sCode);
        pMap.preselectRegionSite(sCode);

        if (ignoreSelection)
        {
            this.removeAutoCloseCheckbox();
            new MapViewChooseStartingHeavenIgnoreSelection().createInstance();
        }
        else if (sCode === "")
        {
            this.removeAutoCloseCheckbox();
            new MapViewChooseStartingHeaven().createInstance();
        }
        else
        {
            this.updateSelectOnClick();
            new MapViewMovement(data).createInstance(sCode);
        }

        g_isInit = true;
    },

    isEditor: function()
    {
        return typeof MapViewPositioning !== "undefined";
    },

    onInit: function (data, tapped) {

        if (!MapInstanceRenderer.isEditor())
            MapInstanceRenderer.onInitDefault(data, tapped, fetchPreferredSitesFromLocalStorage());
        else
            MapInstanceRenderer.onInitEditor(data);
        
        g_isInit = true;
    }
};

const showErrorLoading = function (err) {
    let error = "Could not load map. Sorry.";
    if (err !== undefined)
        console.error(err);

    if (err.message !== undefined)
        error = err.message;

    DomUtils.empty(document.getElementById("map_view_layer_loading")); 

    const p = document.createElement("p");

    const i1 = document.createElement("i");
    i1.setAttribute("class", "fa fa-exclamation-circle");
    p.appendChild(i1);

    p.appendChild(document.createTextNode(error));

    const i2 = document.createElement("i");
    i2.setAttribute("class", "fa fa-exclamation-circle");
    p.appendChild(i2);

    document.getElementById("map_view_layer_loading").appendChild(p);
};

const getCurrentDate = function()
{
    const sVal = new Date().toISOString();
    const nPos = sVal.indexOf("T");
    if (nPos === -1)
        return "" + Date.now();
    else
        return sVal.substring(0, nPos);
}

const updateLoadingInfo = function(sValue)
{
    const elem = document.getElementById("map_view_layer_loading_desc");
    if (elem !== null && sValue)
        elem.innerText = sValue;
}

const fetchFromLocalStorage = function()
{
    updateLoadingInfo("map from local storage");

    if (localStorage.getItem("game_data"))
    {
        try
        {
            return JSON.parse(localStorage.getItem("game_data")).map;
        }
        catch(err)
        {
            console.error(err);
        }
    }

    return null;
}

const fetchPreferredSitesFromLocalStorage = function()
{
    if (localStorage.getItem("sitelist"))
    {
        try
        {
            const res = JSON.parse(localStorage.getItem("sitelist"));
            if (Array.isArray(res) && res.length > 0)
                return res;
        }
        catch(err)
        {
            console.error(err);
        }
    }

    return [];
}

const fetchMap = async function (tappedSites) {

    const localData = fetchFromLocalStorage();
    if (localData !== null)
    {
        MapInstanceRenderer.onInit(localData, tappedSites);
        return;
    }

    updateLoadingInfo("map data (this may take a while)");
    setTimeout(() => 
    {
        fetch("/data/list/map?t=" + getCurrentDate())
        .then((response) => 
        {
            if (response.status === 200)
                return response.json()
            else
                return Promise.resolve({});
        })
        .then((map) => MapInstanceRenderer.onInit(map, tappedSites))
        .catch(showErrorLoading);
    }, 10);

};

const fetchTappedSites = function () {
    if (g_isInit)
        return;

    updateLoadingInfo("already tapped sites");

    fetch("/data/list/sites-tapped")
    .then((response) => 
    {
        if (response.status === 200)
            return response.json()
        else
            return Promise.resolve({});
    })
    .then(fetchMap)
    .catch(showErrorLoading);
};

function onKeyUp(ev) {
    let code = "";
    if (ev.key !== undefined)
        code = ev.key;
    else if (ev.keyIdentifier !== undefined)
        code = e.keyIdentifier;

    switch (code) {
        /* ESC */
        case "Escape":
            parent.postMessage({ type: "cancel" }, "*")
            break;

        /* ENTER */
        case "Enter":
            document.getElementById("movement_accept").dispatchEvent(new Event('click'));
            break;

        default:
            break;
    }

}

document.body.addEventListener("keyup", onKeyUp, false);
document.body.addEventListener("meccg-map-selected-movement", MapInstanceRenderer.sendResultMovement, false);
document.body.addEventListener("meccg-map-cancel", MapInstanceRenderer.cancel, false);

(function () {
    fetchTappedSites();
})();