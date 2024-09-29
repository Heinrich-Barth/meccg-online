import { CheckForCardsPlayed } from "./utils/added-cards-monitor";
import CardPreview from "./card-preview";
import CardList from "./utils/cardlist";
import Dictionary from "./utils/dictionary";
import initSingleCardEvent from "./draggableevents/InitSingleCardEvent";
import { HandCardsDraggable } from "./handcards-draggable";
import DomUtils, { ArrayList } from "./utils/libraries";
import MeccgApi from "./meccg-api";
import CreateHandCardsDraggableUtils from "./utils/CreateHandCardsDraggableUtils";
import detectIsAgentCompany from "./utils/DetectIsAgentCompany";
import HighlightElementById from "./highlight/highlight";
import CreateNewCard from "./utils/CreateNewCard";

export default class GameCompanyLocation 
{
    #CARDID_PREFIX:string;

    constructor(CARDID_PREFIX:string)
    {
        this.#CARDID_PREFIX = CARDID_PREFIX;
    }

    static TITLE_SITE_DEST() { return Dictionary.get("loc_site_dest", "Click to let player arrive or drop hazards to play onguard.") }
    static TITLE_SITE_DEST_PLAYER() { return Dictionary.get("loc_site_player", "Click to reveal or tap if already revealed.") }
    static TITLE_SITE_ORIGIN() { return Dictionary.get("loc_site_org", "Site of origin/current site") }


    createLocationCard(code:string, img:string, bIsPlayer:boolean, sTitle:string)
    {
        let sOwner = bIsPlayer ? "" : "other";
        const div = document.createElement("div");
        div.setAttribute("class", "card");
        div.setAttribute("draggable", "false");
        div.setAttribute("data-card-code", code);
        
        if (sTitle !== undefined && sTitle !== "")
            div.setAttribute("title", sTitle);

        const pImage = document.createElement("img");
        pImage.setAttribute("src", "/data/backside-region");
        pImage.setAttribute("data-owner", sOwner);
        pImage.setAttribute("class", "card-icon");
        pImage.setAttribute("data-img-image", img);
        pImage.setAttribute("data-image-backside", "/data/backside");
        pImage.setAttribute("crossorigin", "anonymous");
        div.appendChild(pImage);
        return div;
    }

    clearSiteContainer(companyElem:any)
    {
        ArrayList(companyElem.querySelectorAll(".site-container")).each(DomUtils.removeAllChildNodes);
    }

    getCompanyContainer(company:string)
    {
        return document.getElementById("company_" + company);
    }

    drawStartSite(company:string, companyElem:any, start:string, bIsPlayer:boolean, revealStartSite:boolean, current_tapped:boolean)
    {
        const code = CardList().getSafeCode(start);
        const img = CardList().getImageSite(start);

        const pCard = this.createLocationCard(code, img, bIsPlayer, GameCompanyLocation.TITLE_SITE_ORIGIN());
        companyElem.querySelector(".site-current").appendChild(pCard);

        if (revealStartSite)
            ArrayList(companyElem).find(".site-current img.card-icon").each((_img:any) => _img.setAttribute("src", _img.getAttribute("data-img-image")));
        
        if (current_tapped)
            ArrayList(companyElem).find(".site-current .card").each((elem:any) => elem.classList.add("state_tapped"));
        
        if (bIsPlayer)
        {
            this.initSiteCardDraggable(pCard);
            document.body.dispatchEvent(new CustomEvent('meccg-context-site', { detail: { id: "company_" + company, company: company, start: true, code: code }} ));
        }
    }

    initSiteCardDraggable(pCardDiv:any)
    {
        if (!pCardDiv.classList.contains("ui-draggable"))
        {
            pCardDiv.setAttribute("draggable", "true");
            pCardDiv.setAttribute("data-location", "sites");
            pCardDiv.setAttribute("data-card-type", "site");
            HandCardsDraggable.initDraggableCard(pCardDiv);
        }
    }

    #isPlayersCompany(pCompany:any)
    {
        const parent = DomUtils.findParentByClass(pCompany, "companies");
        return parent !== null && parent.getAttribute("id") === "player_companies";
    }


    insertTargetReturnAction(company:string, companyElem:any)
    {
        const bIsPlayer = this.#isPlayersCompany(companyElem);
        if (!bIsPlayer)
            return;

        const pContainerTarget = companyElem.querySelector(".site-target");
        if (pContainerTarget.querySelector(".site-action-return") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("class", "site-action-return fa fa-ban");
        div.setAttribute("title", Dictionary.get("loc_cancel", "Cancel movement and\nreturn to site of origin"));
        div.setAttribute("data-company-uid", company);

        div.innerText = " Cancel";
        div.onclick = this.abortMovement.bind(this);
        pContainerTarget.appendChild(div);
    }

    abortMovement(e:any)
    {
        const elem = e.target;
        const companyid =  elem && elem.hasAttribute("data-company-uid") ? elem.getAttribute("data-company-uid") : "";
        if (typeof companyid === "string" && companyid !== "")
            MeccgApi.send("/game/company/returntoorigin", {company : companyid });
    }

    drawTargetSite(company:string, companyElem:any, target:string, bIsPlayer:boolean, target_tapped:boolean)
    {
        const code = CardList().getSafeCode(target);
        const img = CardList().getImageSite(target);

        const pContainerTarget = companyElem.querySelector(".site-target");

        DomUtils.removeAllChildNodes(pContainerTarget);
        const pCardDiv = this.createLocationCard(code, img, bIsPlayer, bIsPlayer ? GameCompanyLocation.TITLE_SITE_DEST_PLAYER() : GameCompanyLocation.TITLE_SITE_DEST());
        pContainerTarget.appendChild(pCardDiv);
        
        if (!bIsPlayer)
            document.body.dispatchEvent(new CustomEvent('meccg-context-site-arrive', { detail: { id: "company_" + company, company: company, code: code }} ));
        else
        {
            this.initSiteCardDraggable(pCardDiv);
            document.body.dispatchEvent(new CustomEvent('meccg-context-site', { detail: { id: "company_" + company, company: company, start: false, code: code }} ));
        }
        
        if (target_tapped)
            ArrayList(pContainerTarget).find(".card").each((e:any) => e.classList.add("state_tapped"));

        this.revealLocations(companyElem);
    }

    showMapInteraction(sCompanyId:string)
    {
        this.removeMapInteraction(sCompanyId);

        const container = this.requireMapInteractionLocationContainer(sCompanyId);
        if (container === null)
            return;

        const div = document.createElement("div");
        div.setAttribute("class", "lds-ellipsis");
        div.innerHTML = "<div></div><div></div><div></div><div></div>";
        container.appendChild(div);
    }

    requireMapInteractionLocationContainer(sCompanyId:string)
    {
        const pCompany= document.getElementById("company_" + sCompanyId);
        return pCompany === null ? null : pCompany.querySelector(".company-site-list");
    }

    removeMapInteraction(sCompanyId:string)
    {
        const container = this.requireMapInteractionLocationContainer(sCompanyId);
        if (container === null)
            return;

        const elem = container.querySelector(".lds-ellipsis");
        if (elem?.parentElement)
            elem.parentElement.removeChild(elem);
    }

    revealLocations(companyElem:any)
    {
        ArrayList(companyElem).find(".location-reveal").each((e:any) => e.classList.remove("hide"));
    }

    revealMovement(company:string)
    {
        const companyElem = this.getCompanyContainer(company);
        if (companyElem === null)
            return;

        const jSiteContaienr = companyElem.querySelector(".sites");
        this.removeDuplicateRegions(jSiteContaienr);

        ArrayList(jSiteContaienr).find(".site-current .card-icon").each(this.revealCard);
        ArrayList(jSiteContaienr).find(".site-regions .card-icon").each(this.revealCard);
        ArrayList(jSiteContaienr).find(".site-target .card-icon").each(this.revealCard);
        ArrayList(companyElem).find(".location-reveal").each((e:any) => e.classList.add("hide"));

        this.insertTargetReturnAction(company, companyElem);
    }

    removeDuplicateRegions(jSiteContaienr:any)
    {
        const list = jSiteContaienr.querySelectorAll(".site-regions .card");
        if (list === null || list.length < 2)
            return;

        const codes:string[] = [];
        for (let elem of list)
        {
            const _code = elem.hasAttribute("data-card-code") ? elem.getAttribute("data-card-code") : "";
            if (_code === "")
                continue;

            if (!codes.includes(_code))
                codes.push(_code);
            else
                elem.classList.add("hidden");
        }
    }

    /**
     * Attach a hazard to companies site
     */
    onAttachCardToCompanySites(companyId:string, cardList:any[], bAllowContextMenu:boolean)
    {
        if (cardList.length === 0)
            return;

        const companyElement = this.getCompanyContainer(companyId);
        if (companyElement === null)
        {
            console.warn("Cannot find company " + companyId);
            return;
        }

        const jOnGuardContainer = companyElement.querySelector(".site-onguard");
        if (jOnGuardContainer === null)
        {
            console.warn("Cannot find on-guard site of company " + companyId);
            return;
        }

        const isPlayersCompany = this.#isPlayersCompany(companyElement);
        const pCheckForCardsPlayed = new CheckForCardsPlayed("ingamecard_");
        pCheckForCardsPlayed.loadBefore(jOnGuardContainer);

        const len = cardList.length;
        for (let i = 0; i < len; i++)
            this.onAttachCardToCompanySitesElement(jOnGuardContainer, cardList[i], bAllowContextMenu, isPlayersCompany);

        pCheckForCardsPlayed.loadAfter(jOnGuardContainer);
        pCheckForCardsPlayed.mark();
    }

    onAttachCardToCompanySitesElement(pOnGuardContainer:any, card:any, bAllowContextMenu:boolean, isPlayersCompany:boolean)
    {
        pOnGuardContainer.appendChild(CreateNewCard(card, this.#CARDID_PREFIX));
        
        const pCard = document.getElementById(this.#CARDID_PREFIX + card.uuid);
        if (pCard === null)
        {
            console.warn("Cannot find card #" + this.#CARDID_PREFIX + card.uuid);
            return;
        }

        if (isPlayersCompany)
            CardPreview.init(pCard);
        else
            CardPreview.initOnGuard(pCard);

        initSingleCardEvent(pCard);
        
        if (bAllowContextMenu)
            document.body.dispatchEvent(new CustomEvent('meccg-context-generic', { detail: { id: this.#CARDID_PREFIX + card.uuid, type: "onguard" }} ));
        
        if (card.revealed || typeof card.revealed === "undefined")
            this.revealCard(pCard.querySelector("img"));
    }

    revealCard(pImage:any)
    {
        pImage.setAttribute("src", pImage.getAttribute("data-img-image"));
    }

    drawRegions(companyElem:any, regions:string[], bIsPlayer:boolean, bHasTargetSite:boolean)
    {
        const pContainerReg = companyElem.querySelector(".site-regions");
        DomUtils.removeAllChildNodes(pContainerReg);

        if (regions.length === 0)
            return;

        /*  target site can be in the same region but this gives away certain information about the movement. 
            So always show at least 2 regions */
        if (bHasTargetSite && regions.length === 1)
            regions.push("" + regions[0]);

        for (let _reg of regions)
        {
            const code = CardList().getSafeCode(_reg);
            const img = CardList().getImageRegion(_reg);
            pContainerReg.appendChild(this.createLocationCard(code, img, bIsPlayer, Dictionary.get("loc_region", "Region moved through. Drop hazard creates here")));
        }
    }

    onArriveAtTarget(pSites:any)
    {
        const pTarget = pSites.querySelector(".site-target div");
        if (pTarget === null)
            return;

        const pCurrent = pSites.querySelector(".site-current");
        DomUtils.removeAllChildNodes(pCurrent);

        pTarget.setAttribute("title", GameCompanyLocation.TITLE_SITE_ORIGIN());

        pCurrent.appendChild(pTarget);
        DomUtils.removeAllChildNodes(pSites.querySelector(".site-regions"));
        DomUtils.removeAllChildNodes(pSites.querySelector(".site-target"));
    }

    drawLocations(company:string, start:string, regions:string[], target:string, isRevealed:boolean, attached:any[], current_tapped:boolean, target_tapped:boolean, revealStartSite:boolean = true)
    {
        const companyElem = this.getCompanyContainer(company);
        if (companyElem === null)
            return;

        this.clearSiteContainer(companyElem);

        const bIsPlayer = this.#isPlayersCompany(companyElem);
        const isAgent = detectIsAgentCompany(companyElem);

        if (target === undefined)
            target = "";

        if (regions === undefined)
            regions = [];

        if (isRevealed === undefined)
            isRevealed = false;

        if (!isRevealed && isAgent)
            revealStartSite = false;
        else if (revealStartSite === undefined)
            revealStartSite = true;

        this.removeMapInteraction(company);

        if (start !== undefined && start !== "")
            this.drawStartSite(company, companyElem, start, bIsPlayer, revealStartSite, current_tapped);

        if (target !== "")
            this.drawTargetSite(company, companyElem, target, bIsPlayer, target_tapped);
        else
            this.revealLocations(companyElem);

        if (attached.length > 0)
            this.onAttachCardToCompanySites(company, attached, true);

        this.drawRegions(companyElem, regions, bIsPlayer, target !== "");

        if (target !== "" && isRevealed)
        {
            this.revealMovement(company);
            this.insertTargetReturnAction(company, companyElem)
        }        

        this.initOnGuards(companyElem, bIsPlayer);
    }

    initOnGuards(companyElem:any, bIsPlayer:boolean)
    {
        ArrayList(companyElem).find(".site-container").each((elem:any) =>
        {
            const _isOnGuard = elem.classList.contains("site-onguard");

            const list = elem.querySelectorAll("div");
            const len = list === null ? 0 : list.length;

            for (let i = 0; i < len; i++)
            {
                if ((bIsPlayer && !_isOnGuard) || (!bIsPlayer && _isOnGuard))
                    CardPreview.initOnGuard(list[i]);
                else
                    CardPreview.init(list[i]);
            }

            if (elem.classList.contains("site-regions"))
            {
                if (!elem.classList.contains("cursor-pointer"))
                    elem.classList.add("cursor-pointer")

                elem.onclick = GameCompanyLocation.OnRegionClick;
            }
        });
    }

    static OnRegionClick(e:any)
    {
        const data = {
            showOnly : true,
            id : CreateHandCardsDraggableUtils.requireMessageId(),
            regionmap : true
        };

        document.body.dispatchEvent(new CustomEvent("meccg-map-show", { "detail":  data }));
    }

    /**
     * @deprecated
     */
    allowOnGuardRegion()
    {
        // deprecated
    }

    static onDropOnGuard(companyUuid:string, pCard:any, bRevealOnDrop:boolean)
    {
        if (pCard.getAttribute("data-location") === "hand")
        {
            const uuid = pCard.getAttribute("data-uuid");
            DomUtils.removeNode(pCard);
            MeccgApi.send("/game/company/location/attach", {uuid: uuid, companyUuid: companyUuid, reveal: bRevealOnDrop});
        }

        return false;
    }

    /**
     * @deprecated
     */
    allowOnGuard()
    {
        // deprecated
    }

    onCompanyReturnsToOrigin(sCompanyId:string, bReduceSites:boolean)
    {
        if (typeof bReduceSites === "undefined" || bReduceSites)
        {
            const pCompany= this.getCompanyContainer(sCompanyId);
            if (pCompany !== null)
                this.onArriveAtOrigin(pCompany.querySelector(".sites"));
        }
        
        HighlightElementById(sCompanyId);
    }

    onCompanyArrivesAtDestination(sCompanyId:string, bReduceSites:boolean)
    {
        if (typeof bReduceSites === "undefined" || bReduceSites)
        {
            const pCompany= document.getElementById("company_" + sCompanyId);
            if (pCompany !== null)
                this.onArriveAtTarget(pCompany.querySelector(".sites"));
        }
        
        HighlightElementById(sCompanyId);
    }

    /**
     * Remove target and region site cards
     * @param {DOMElement} pSites 
     */
    onArriveAtOrigin(pSites:any)
    {
        if (pSites)
        {
            DomUtils.removeAllChildNodes(pSites.querySelector(".site-target"));
            DomUtils.removeAllChildNodes(pSites.querySelector(".site-regions"));
        }
    }

}
