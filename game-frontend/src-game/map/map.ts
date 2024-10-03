import Dictionary from "../utils/dictionary";
import DomUtils from "../utils/libraries";
import MeccgApi from "../meccg-api";

const MapWindow = {

    _lastMapRequestId : -1,

    assertValidMessage : function(id:number)
    {
        if (typeof id !== "undefined" && MapWindow._lastMapRequestId < id)
        {
            MapWindow._lastMapRequestId = id;
            return true;
        }
        else
            return false;
    },

    /**
     * Get IFrame message
     * @param {json} e Data from iframe
     */
    onMessage : function(e:any)
    {
        const pMeta = MapWindow.close();
        if (pMeta === null)
            return;

        const sCompany = pMeta.company;
        const isRevealed = pMeta.revealStart;

        let jData = e.data;

        if (jData.type === "set" && typeof sCompany !== "undefined" && sCompany !== "")
        {
            if (sCompany !== "_temp")
            {
                MeccgApi.send("/game/company/location/set-location", {
                    companyUuid: sCompany,
                    start: jData.start, 
                    regions: jData.regions, 
                    destination: jData.target,
                    revealStart : isRevealed
                });
            }
            else
            {
                const code = jData.start;
                if (typeof code === "string" && code !== "")
                     MeccgApi.send("/game/card/import", {code : code, type: "character" });
            }
        }
    },

    /**
     * Clear the map window container, hide it and get the affected company id
     * 
     * @returns companyId
     */
    close : function()
    {
        document.body.classList.remove("on-show-map-window");

        const pMap = document.getElementById("map-window");
        if (pMap && !pMap.classList.contains("hide"))
            pMap.classList.add("hide");

        const pFrame = document.getElementById("map-iframe");
        if (pFrame === null)
        {
            console.warn("iframe map has already been destroyed");
            return null;
        }
        
        const sCompany = pFrame.getAttribute("data-company") || "";
        const isRevealed = "true" === pFrame.getAttribute("data-revealved")
        DomUtils.removeAllChildNodes(pMap);

        if (sCompany !== "")
        {
            MeccgApi.send("/game/company/location/choose", {
                company: sCompany,
                homesite: false,
                hide: true
            });
        }

        return {
            company: sCompany,
            revealStart : isRevealed
        };
    },

    /**
     * Event function to close the map iframe by clearing the container
     *  
     * @param {Evelt} e 
     * @returns false
     */
    onClose : function(e:any)
    {
        this.close();

        e.preventDefault();
        return false;
    },

    /**
     * Create the map container and assign the custom event listener, but only if necessary
     * (avoids duplicate creation and assignment)
     */
    init : function()
    {
        let elem = document.getElementById("map-window");
        if (elem === null)
        {
            const div = document.createElement("div");
            div.setAttribute("id", "map-window");
            div.setAttribute("class", "map-window hide");
            document.body.appendChild(div);

            /* Getting the message from the iframe */
            window.onmessage = this.onMessage.bind(this);
            document.body.addEventListener("meccg-map-show", this.onShowMapMessageEvent.bind(this), false);
        }
    },

    /**
     * Show the iframe and load the given url. This will create the iframe element and adding it to the cleared
     * map window container.
     * 
     * @param {String} sUrl 
     * @param {String} company 
     * @returns 
     */
    showIframe : function(sUrl:string, company:string = "", isRevealed:boolean = true)
    {
        if (document.body.classList.contains("on-show-map-window") || document.getElementById("map-iframe") !== null)
            return;

        const jWrapper = document.getElementById("map-window");
        if (jWrapper === null)
            return;
            
        document.body.classList.add("on-show-map-window");

        const jOverlay = document.createElement("div");
        jOverlay.setAttribute("class", "map-overlay");
        jOverlay.setAttribute("id", "map-window-overlay");

        DomUtils.removeAllChildNodes(jWrapper); /** just make sure it is empty */

        /** add the overlay to allow closing it again */
        jWrapper.appendChild(jOverlay);

        /** show the overlay */
        jWrapper.classList.remove("hide");

        const titleDiv = document.createElement("div");
        titleDiv.setAttribute("class", "map-view-title");
        titleDiv.setAttribute("id", "map-iframe-title");
        titleDiv.onclick = MapWindow.onClose.bind(MapWindow);
        
        const divTitle = document.createElement("div");
        divTitle.setAttribute("class", "map-iframe-title-title");
        divTitle.setAttribute("id", "map-iframe-title-title");
        divTitle.innerText = "";

        const divClose = document.createElement("div");
        divClose.setAttribute("class", "map-iframe-title-close");
        divClose.innerText = "X " + Dictionary.get("context_anywhere", "Click to close");
        titleDiv.append(divTitle, divClose);

        jWrapper.append(titleDiv);

        /** create iframe and add it to the container. */
        let jFrame = document.createElement("iframe");
        jFrame.setAttribute("src", sUrl);
        jFrame.setAttribute("class", "map-view");
        jFrame.setAttribute("id", "map-iframe");
        jFrame.setAttribute("data-company", company);
        if (isRevealed === undefined || isRevealed)
            jFrame.setAttribute("data-revealved", "true");
        else
            jFrame.setAttribute("data-revealved", "false");

        jWrapper.appendChild(jFrame);

        /** 
         * this is weired Chrome behaviour. It seems the click event of the overlay is
         * being triggered immediately after the iframe is supposed to be shown.
         * This is only an issue in Chrome.
         * 
         * The solution is not very elegant, but should do the trick:
         * We simply add the click event to the map-overlay a bit later. This should give the window enough time
         * to load.
         */
         setTimeout(MapWindow.addWindowOverlayClickEvent, 3000);
    },

    /**
     * Add the overlay click event once, but only if the element exists.
     */
    addWindowOverlayClickEvent : function()
    {
        const elem = document.getElementById("map-window-overlay");
        if (elem !== null)
            elem.onclick = MapWindow.onClose.bind(MapWindow);
    },

    /**
     * @deprecated
     */
    showRules : function()
    {
        
    },

    updateMapTitle : function(code:string)
    {
        const elem = document.getElementById("map-iframe-title-title");
        if (elem === null)
            return;

        const title = code === "" ? Dictionary.get("frontend.map.homesite", "Choose a home site") : Dictionary.get("frontend.map.targetsite", "Select target site");
        elem.innerText = title;
    },

    showMap : function(company:string, code:string, messageId:number, regionMap:any, revealed:boolean)
    {
        if (!this.assertValidMessage(messageId) || company === undefined || company === "" || typeof messageId === "undefined")
            return;

        if (code === undefined)
            code = "";

        if (document.getElementById("map-window")?.classList.contains("hide"))
        {
            this.notifyUsers(code === "", company);

            const url = regionMap ? "/map/regions" : "/map/underdeeps";
            this.showIframe(url + "?code=" + code, company, revealed);
            this.updateMapTitle(code);
        }
    },

    showMapOnly : function(messageId:number)
    {
        if (!this.assertValidMessage(messageId))
            return;

        if (document.getElementById("map-window")?.classList.contains("hide"))
            this.showIframe("/map/regions?only=true");
    },    

    notifyUsers : function(isStartingSite:boolean, company:string)
    {
        if (company === "_temp")
            return;

        MeccgApi.send("/game/company/location/choose", {
            company: company,
            homesite: isStartingSite,
            hide: false
        });
    },

    /** Custom event to show the map iframe.  */
    onShowMapMessageEvent : function(e:any)
    {
        if (e.detail.showOnly)
            this.showMapOnly(e.detail.id);
        else
           this.showMap(e.detail.company, e.detail.code, e.detail.id, e.detail.regionmap, e.detail.revealed);
    },
};

export function InitMapwindow()
{
    MapWindow.init();
}

export default MapWindow;