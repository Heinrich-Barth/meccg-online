import CardPreview from "../card-preview";
import CardList from "../utils/cardlist";
import Dictionary from "../utils/dictionary";
import { TaskBarCards } from "../game-taskbarcards";
import DomUtils, { ArrayList } from "../utils/libraries";
import MeccgApi from "../meccg-api";
import Question from "../question/question";
import { RevealPlayerDeck, RevealPlayerDeckSelf } from "../RevealCardPile";
import detectIsAgentCompany from "../utils/DetectIsAgentCompany";
import CreateHandCardsDraggableUtils from "../utils/CreateHandCardsDraggableUtils";

const ContextMenu:any = {

    updateTargetMenuPosition : function(x:number, y:number, pMenuElement:any, clickedOnGameCard:boolean)
    {
        if (clickedOnGameCard)
            y -= 100;

        if (y < 10)
            y = 10;

        if (x > window.innerWidth - 200)
            x -= 200;
        if (y > window.innerHeight - 200)
            y -= 200;

        pMenuElement.style.left = x + "px";
        pMenuElement.style.top = y + "px";
    },

    createMenuEntry : function(pParent:any, item:any, bAddDivider:boolean)
    {
        const pLink = document.createElement("a");

        if (item.icon === "")
            pLink.innerText = item.label;
        else
            pLink.innerHTML = `<i class="fa ${item.icon}"></i> ${item.label}`;

        pLink.setAttribute("href", "#");
        pLink.setAttribute("data-action", item.action);
        if (item.tipp !== undefined && item.tipp !== null && item.tipp !== "")
            pLink.setAttribute("title", "Tipp: " + item.tipp);

        pLink.onclick = ContextMenu.callbacks.generic;
        
        if (item.shortcut !== "")
        {
            const span = document.createElement("span");
            span.setAttribute("class", "menuitem-shortcut");
            span.innerText = item.shortcut;
            pLink.append(span);
        }

        const li = document.createElement("li");
        li.setAttribute("class", item.classes);
        li.appendChild(pLink);

        if (bAddDivider)
            li.classList.add("border-top");

        pParent.appendChild(li);
    },

    fillTargetMenu : function(pContextMenuElement:any, nType:number)
    {
        if (pContextMenuElement == null || typeof ContextMenu.data.types[nType] === "undefined")
            return false;

        const sClass = typeof ContextMenu.data.specialClasses[nType] === "undefined" ? "" : ContextMenu.data.specialClasses[nType];
        if (sClass !== "")
            pContextMenuElement.classList.add(sClass);

        const pContainer = document.createElement("ul");
        pContainer.setAttribute("class", "context-menu__items");

        let hasElements = false;
        let bAddDivider = false;
        const vsItems = ContextMenu.data.types[nType];
        if (ContextMenu.hasShortcuts(nType))
            pContainer.classList.add("context-menu__items-shortcuts")

        for (let key of vsItems)
        {
            if (key === "_divider")
            {
                bAddDivider = true;
            }
            else if (ContextMenu.data.items[key] !== undefined)
            {
                ContextMenu.createMenuEntry(pContainer, ContextMenu.data.items[key], bAddDivider);
                hasElements = true;
                bAddDivider = false;
            }
        }

        const pMenu = document.querySelector("nav");
        DomUtils.removeAllChildNodes(pMenu);      
        
        if (pMenu)
            pMenu.appendChild(pContainer);

        return hasElements;
    },

    hasShortcuts(nType:number)
    {
        const vsItems = ContextMenu.data.types[nType];
        if (vsItems === undefined)
            return;
        
        for (let key of vsItems)
        {
            if (key !== "_divider" && ContextMenu.data.items[key] && ContextMenu.data.items[key].shortcut !== "")
                return true;
        }

        return false;
    },

    show : function(e:any, sUuid:string, sCode:string, companyId:string, nType:string)
    {
        const pPosition = ContextMenu._getPosition(e);
        if (pPosition.x === 0 || pPosition.y === 0)
            return;

        pPosition.y += ContextMenu.getOffset(nType);

        const clickedOnGameCard = nType === "card";
        const pContextMenuElement = document.getElementById("contextmenu");
        if (pContextMenuElement === null)
            return;

        ContextMenu.updateTargetMenuPosition(pPosition.x, pPosition.y, pContextMenuElement, clickedOnGameCard);

        pContextMenuElement.setAttribute("data-card-code", sCode);
        pContextMenuElement.setAttribute("data-card-uuid", sUuid);
        pContextMenuElement.setAttribute("data-company", companyId);

        if (ContextMenu.fillTargetMenu(pContextMenuElement, nType))
            pContextMenuElement.classList.remove("hide");
    },    
    
    onMoveCompanyEvent : function(companyid:string, direction:string)
    {
        const elem = document.getElementById("company_" + companyid);
        if (elem === null)
            return;

        if (direction === "left")
            ContextMenu.callbacks.doCompanyMoveLeft(elem, false);
        else if (direction === "right")
            ContextMenu.callbacks.doCompanyMoveRight(elem, false);
        else if (direction === "end")
            ContextMenu.callbacks.doCompanyMoveRightEnd(elem, false);
    },

    /**
     * Init contextmenu element (Tap site)
     * 
     * @param {DOM Object} elem 
     * @param {String} code 
     */
    initContextMenuSite : function(e:any)
    {
        const code = e.detail.code;
        const company = document.getElementById(e.detail.id);
        if (company === null)
            return;

        const sQuery = e.detail.start ? ".site-current img.card-icon" : ".site-target img.card-icon";
        const elem:any = company.querySelector(sQuery);

        if (elem === null || code === undefined || code === "")
            return;
        
        elem.setAttribute("data-context-code", code);
        
        const companyId = e.detail.company;
        if (companyId !== undefined && companyId !== "")
            elem.setAttribute("data-contextmenu-site-arrive-company", companyId);

        elem.oncontextmenu = ContextMenu.contextActions.onContextSite;
        elem.ondblclick = ContextMenu.contextActions.onDoubleClickSite;
        elem.onclick = ContextMenu.contextActions.onDoubleClickSite;
        elem.classList.add("context-cursor");
    },

    initContextMenuSiteArrive : function(e:any)
    {
        const companyId = e.detail.company;
        const company = document.getElementById(e.detail.id);
        const pCard:any = company === null ? null : company.querySelector(".site-target img.card-icon");
        if (pCard === null || companyId === "" || companyId === undefined)
            return;

        const code = e.detail.code;
        pCard.setAttribute("data-context-code", code);
        pCard.setAttribute("data-contextmenu-site-arrive-company", companyId);
        pCard.oncontextmenu = ContextMenu.contextActions.onContextSiteArrive; 
        pCard.ondblclick = ContextMenu.contextActions.onDoubleClickSiteArrive;
        pCard.onclick = ContextMenu.contextActions.onDoubleClickSiteArrive;
        pCard.classList.add("context-cursor");
    },

    initContextMenuGeneric : function(e:any)
    {
        const isOnguard = e.detail.type === "onguard";
        const elemDiv = document.getElementById(e.detail.id);
        if (elemDiv === null)
            return;

        const elem = elemDiv.querySelector("img");
        if (elem !== null)
        {
            elem.oncontextmenu = ContextMenu.contextActions.onContextGeneric;
            if (isOnguard)
            {
                elem.ondblclick = ContextMenu.contextActions.onOnGuardDoubleClick;
                elem.onclick = ContextMenu.contextActions.onFlipClick;
            }
            else
            {
                elem.ondblclick = ContextMenu.contextActions.onDoubleClickGenericCard;
                elem.onclick = ContextMenu.contextActions.onDoubleClickGenericCard;
            }
            elem.classList.add("context-cursor");
        }
    },

    cardGetTapClass : function(elem:any, allowWound:boolean)
    {
        if (elem.parentElement === null)
            return "tap";
        else if (allowWound === undefined || !allowWound)
            return elem.parentElement.classList.contains("state_tapped") ? "ready" : "tap"

        const pParent = elem.parentElement;
        if (pParent.classList.contains("state_wounded"))
            return "ready";
        else if (pParent.classList.contains("state_tapped"))
            return "wound";
        else
            return "tap";
    },

    isSiteOfOrigin : function(img:any)
    {
        const elem = img?.parentElement?.parentElement;
        return elem?.classList?.contains("site-current");
    },
    
    contextActions : {

        onClickSiteOrigin : function(img:any, companyid:string)
        {
            ContextMenu.callbacks.doRotate("_site", ContextMenu._getCardCode(img), ContextMenu.cardGetTapClass(img, false));
        },

        onClickSiteTarget : function(img:any, companyid:string)
        {
            if (companyid === "")
            {
                ContextMenu.callbacks.doRotate("_site", ContextMenu._getCardCode(img), ContextMenu.cardGetTapClass(img, false));
                return;
            }
            else if (!img.getAttribute("src").startsWith("/data/backside"))
            {
                MeccgApi.send("/game/company/arrive", {company : companyid });
                return;
            }

            const companyContainer = companyid === "" ? null : document.getElementById("company_" + companyid);
            const isAgent = companyContainer !== null && detectIsAgentCompany(companyContainer);
            const link:any = isAgent || companyContainer === null ? null : companyContainer.querySelector(".location-reveal");
            if (link)
                link.click();
            else
                MeccgApi.send("/game/company/arrive", {company : companyid });
        },

        onDoubleClickSite : function(e:any)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;
              
            const companyid = e.target.getAttribute("data-contextmenu-site-arrive-company");
            if (ContextMenu.isSiteOfOrigin(e.target))
                ContextMenu.contextActions.onClickSiteOrigin(e.target, companyid);
            else
                ContextMenu.contextActions.onClickSiteTarget(e.target, companyid);

            return true;
        },

        onDoubleClickSiteArrive : function(e:any)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== null && e.target !== undefined)
            {
                const companyId = ContextMenu.getAttribute(e.target, "data-contextmenu-site-arrive-company");
                if (companyId !== "")
                    MeccgApi.send("/game/company/arrive", {company : companyId });
            }
        },

        onOnGuardDoubleClick : function(e:any)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;

            let uuid = ContextMenu.getAttribute(e.target, "data-uuid");
            if (uuid === "")
            {
                uuid = ContextMenu.getAttribute(e.target, "data-card-uuid");
                if (uuid === "")
                    return false;
            }

            const div = "img" === e.target.nodeName.toLowerCase() ? e.target.parentElement : e.target;
            CreateHandCardsDraggableUtils.removeDraggableDomElement(div);
            MeccgApi.send("/game/card/move", {uuid: uuid, target: "hand", source: "inplay", drawTop : true});
        },

        onFlipClick : function(e:any)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;

            let code = ContextMenu._getCardCode(e.target);
            if (code === "")
                code = ContextMenu.getAttribute(e.target, "data-card-code");

            let uuid = ContextMenu.getAttribute(e.target, "data-uuid");
            if (uuid === "")
                uuid = ContextMenu.getAttribute(e.target, "data-card-uuid");

            /** only I can flip my own cards */
            if (e.target.hasAttribute("data-is-mine") && e.target.getAttribute("data-is-mine") === "false")
            {
                console.warn("cannot flip other player's card.");
                return false;
            }

            const src = e.target.getAttribute("src");
            if (src !== null && src.indexOf("/backside") !== -1)
            {
                ContextMenu.callbacks._doFlip(uuid, code);
                ContextMenu.hightlightCard(uuid, code);
            }
        },

        onDoubleClickGenericCard : function(e:any)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;
                
            let code = ContextMenu._getCardCode(e.target);
            if (code === "")
                code = ContextMenu.getAttribute(e.target, "data-card-code");

            let uuid = ContextMenu.getAttribute(e.target, "data-uuid");
            if (uuid === "")
                uuid = ContextMenu.getAttribute(e.target, "data-card-uuid");

            if (e.ctrlKey)
                ContextMenu.hightlightCard(uuid, code);
            else
            {
                const src = ContextMenu.getAttribute(e.target, "src");
                if (src !== null && src.indexOf("/backside") !== -1)
                {
                    ContextMenu.callbacks._doFlip(uuid, code);
                    ContextMenu.hightlightCard(uuid, code);
                }
                else
                    ContextMenu.callbacks.doRotate(uuid, code, ContextMenu.cardGetTapClass(e.target, true));
            }
        },

        onDoubleClick : function(e:any)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;
                
            let code = ContextMenu._getCardCode(e.target);
            if (code === "")
                code = ContextMenu.getAttribute(e.target, "data-card-code");

            let uuid = ContextMenu.getAttribute(e.target, "data-uuid");
            if (uuid === "")
                uuid = ContextMenu.getAttribute(e.target, "data-card-uuid");

            if (e.ctrlKey)
                ContextMenu.hightlightCard(uuid, code);
            else
                ContextMenu.callbacks.doRotate(uuid, code, ContextMenu.cardGetTapClass(e.target, false));
        },
        
        onContextGeneric : function(e:any)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== null)
            {
                const sCode = ContextMenu._getCardCode(e.target);
                const sUuid = ContextMenu.getAttribute(e.target, "data-uuid");
                ContextMenu.show(e, sUuid, sCode, "", "card");
            }

            return false;
        },

        onContextSite : function(e:any)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== null)
            {
                const sCode = e.target.getAttribute("data-context-code");
                let sCompany = e.target.getAttribute("data-contextmenu-site-arrive-company");
                if (sCompany === null)
                    sCompany = "";
    
                if (typeof sCode !== "undefined" && sCode !== null && sCode !== "")
                    ContextMenu.show(e, "_site", sCode, sCompany, "location");
            }
            
            return false;
        },

        _findCompanyContainerId : function(elem:any):string
        {
            if (elem === null || elem === undefined)
                return "";

            if (!elem.classList.contains("company") && !elem.hasAttribute("data-company-id"))
                return this._findCompanyContainerId(elem.parentElement) ?? "";
            
            return elem.getAttribute("id") ?? "";
        },

        onContextCompany : function(e:any)
        {
            const id = this._findCompanyContainerId(e.target);
            if (id !== "")
                ContextMenu.show(e, "_ignore", "", id, "company_position")

            return false;
        },

        onContextVictoryActions : function(e:any)
        {
            if (e.target !== null)
                ContextMenu.show(e, "_site", "_code", "_company", "victory");
            
            if (e.preventDefault)
                e.preventDefault();

            if (e.stopPropagation)
                e.stopPropagation();

            return false;
        },

        onContextDiscardPileActions : function(e:any)
        {
            if (e.target !== null)
                ContextMenu.show(e, "_site", "_code", "_company", "discardpile_actions");
            
            if (e.preventDefault)
                e.preventDefault();

            if (e.stopPropagation)
                e.stopPropagation();

            return false;
        },

        onContextPlayDeckActions : function(e:any)
        {
            if (e.target !== null)
                ContextMenu.show(e, "_site", "_code", "_company", "playdeck_actions");
            
            if (e.preventDefault)
                e.preventDefault();

            if (e.stopPropagation)
                e.stopPropagation();

            return false;
        },

        onContextSiteArrive : function(e:any)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== null)
            {
                const sCode = e.target.getAttribute("data-context-code");
                const sCompany = e.target.getAttribute("data-contextmenu-site-arrive-company");
                if (sCompany !== null && sCompany !== "")
                    ContextMenu.show(e, "", sCode, sCompany, "arrive");
            }

            return false;
        },
    },
            
    _getPosition : function(e:any)
    {
        const result = {
            x: 0,
            y: 0
        };

        if (e === undefined)
            return result;

        if (e.pageX || e.pageY)
        {
            result.x = e.pageX;
            result.y = e.pageY;
        }
        else if (e.clientX || e.clientY)
        {
            result.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            result.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        return result;
    },
    
    
    _getCardCode : function(card:any)
    {
        let sVal = "";

        if (!card.classList.contains("card-icon"))
            sVal = card.getAttribute("data-card-code");
        else
            sVal = card.parentElement.getAttribute("data-card-code");

        return sVal === undefined || sVal === null ? "" : sVal;
    },

    data : {
        items : { },
        types :  { },
        offsets: { },
        specialClasses : { }
    },

    getAttribute : function(element:any, sKey:string)
    {
        const val = element?.getAttribute(sKey);
        return val ?? "";
    },

    hightlightCard : function(uuid:string, code:string)
    {
        MeccgApi.send("/game/card/state/glow", {uuid : uuid, code: code });  
    },

    onToken : function(bAdd:boolean)
    {
        const pMenu = document.getElementById("contextmenu");
        if (pMenu !== null)
        {
            const uuid = ContextMenu.getAttribute(pMenu, "data-card-uuid");
            const code = ContextMenu.getAttribute(pMenu, "data-card-code");
            MeccgApi.send("/game/card/token", {uuid : uuid, code: code, add: bAdd !== false });
        }
    },

    callbacks : {
        empty : function() { /** fallback */ },

        tokenRemove : function()
        {
            ContextMenu.onToken(false);
        },

        tokenAdd : function()
        {
            ContextMenu.onToken(true);
        },

        viewDeckNotes:function()
        {
            const text = sessionStorage.getItem("deck-notes");
            if (typeof text !== "string" || text === "")
            {
                document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("context_nonotes", "Deck notes are not available for your deck.") }));
                return;
            }

            const dialog = document.createElement("dialog");
            dialog.setAttribute("id", "dialog-notes");
            dialog.setAttribute("class", "dialog-notes");

            const h1 = document.createElement("h1");
            h1.classList.add("center");
            h1.setAttribute("data-translate-inner", "context_yournotes");
            h1.innerText = Dictionary.get("context_yournotes", "Your Deck Notes");

            const p = document.createElement("p");
            p.classList.add("center");
            p.setAttribute("data-translate-inner", "context_anywhere_esc");
            p.innerText = Dictionary.get("context_anywhere_esc", "Click anywhere or press ESC to close the window");

            dialog.append(h1, p);

            for (let line of text.split("\n"))
            {
                let elem = null;
                if (line.startsWith("=="))
                {
                    elem = document.createElement("h3");
                    elem.innerText = line.replace("==", "");
                }
                else if (line.startsWith("="))
                {
                    elem = document.createElement("h2");
                    elem.innerText = line.replace("=", "");
                }
                else
                {
                    elem = document.createElement("p");
                    elem.innerText = line.trim();
                    if (elem.innerText === "")
                        elem.innerText = " ";
                }

                dialog.appendChild(elem);
            }

            document.body.appendChild(dialog);
            dialog.onclose = () => document.body.removeChild(document.getElementById("dialog-notes")!);
            dialog.onclick = () => (document.getElementById("dialog-notes") as any)?.close();
            dialog.setAttribute("title", Dictionary.get("context_clicktoclose", "Click to close"));
            dialog.setAttribute("data-translate-inner", "context_clicktoclose")
            dialog.showModal();
        },

        generic : function(e:any)
        {
            e.preventDefault();
            e.stopPropagation();
            
            let pMenu = document.getElementById("contextmenu");
            if (pMenu === null)
                return;

            /* execute the callback */
            let sAction = ContextMenu.getAttribute(e.target, "data-action");
            if (sAction !== null && sAction !== "")
            {
                ContextMenu.data.items[sAction].callback(pMenu, sAction);
                ContextMenu.callbacks.hide();
            }
        },

        rotate : function(pMenu:any, sAction:string) 
        {
            const uuid = ContextMenu.getAttribute(pMenu, "data-card-uuid");
            const code = ContextMenu.getAttribute(pMenu, "data-card-code");
            ContextMenu.callbacks.doRotate(uuid, code, sAction);
        },

        showVictoryShared : function()
        {
            TaskBarCards.Show("sharedvicotory", true);
        },

        showVictoryMe : function()
        {
            TaskBarCards.Show("victory", true);
        },

        doRotate : function(uuid:string, code:string, sAction:string)
        {
            if (code === "" || uuid === "")
                return;

            let nState = -1;
            if (sAction === "ready")
                nState = 0;
            else if (sAction === "tap")
                nState = 90;
            else if (sAction === "tap_91")
                nState = 91;
            else if (sAction === "wound")
                nState = 180;
            else if (sAction === "rot270")
                nState = 270;

            if (nState !== -1)
                MeccgApi.send("/game/card/state/set", {uuid : uuid, state : nState, code: code });        
        },

        glow : function(pMenu:any)
        {
            const uuid = ContextMenu.getAttribute(pMenu, "data-card-uuid");
            const code = ContextMenu.getAttribute(pMenu, "data-card-code");
            ContextMenu.hightlightCard(uuid, code);
        },

        flip : function(pMenu:any)
        {
            const uuid = ContextMenu.getAttribute(pMenu, "data-card-uuid");
            const code = ContextMenu.getAttribute(pMenu, "data-card-code");
            ContextMenu.callbacks._doFlip(uuid, code);  
        },

        viewTappedSites : function()
        {
            fetch("/data/list/sites-tapped")
            .then((response) => 
            {
                if (response.status === 200)
                    return response.json()
                else
                    return Promise.resolve({});
            })
            .then((json) =>  { 

                const keys = Object.keys(json);
                if (keys.length === 0)
                    document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("context_notappedsites", "No tapped sites so far.") }));

                keys.sort()
                return Promise.resolve(keys)
            })
            .then((codes:string[]) => {
                if (codes.length === 0)
                    return;

                const dialog = document.createElement("div");
                dialog.setAttribute("id", "tapped-sites-list");
                dialog.setAttribute("class", "tapped-sites-list cursor-pointer");

                const h1 = document.createElement("h1");
                h1.classList.add("center");
                h1.setAttribute("data-translate-inner", "context_yourtappedsites");
                h1.innerText = Dictionary.get("context_yourtappedsites", "Your Tapped Sites");
                
                const p = document.createElement("p");
                p.classList.add("center");
                p.innerText = "Click anywhere to close the window.";

                dialog.append(h1, p);

                for (let code of codes)
                {
                    const img = document.createElement("img");
                    img.setAttribute("src", CardList().getImage(code));
                    img.setAttribute("class", "card-icon");
                    img.setAttribute("decoding", "async");

                    img.onclick = () => DomUtils.removeNode(document.getElementById("tapped-sites-list"));
                    
                    dialog.appendChild(img);
                }

                CardPreview.initGeneric(dialog);
                dialog.onclick = () => DomUtils.removeNode(document.getElementById("tapped-sites-list"));
                dialog.setAttribute("data-translate-inner", "context_anywhere");
                dialog.setAttribute("title", Dictionary.get("context_anywhere", "Click to close"));

                document.body.appendChild(dialog);
            })
            .catch((err) => 
            {
                console.error(err);
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("context_canotshowtapped", "Cannot show tapped sites.") }));
            });
        },

        _doFlip : function(uuid:string, code:string)
        {
            MeccgApi.send("/game/card/state/reveal", {uuid : uuid, code: code });
        },

        arrive : function(pMenu:any)
        {
            const companyId = ContextMenu.getAttribute(pMenu, "data-company");
            if (companyId !== "")
                MeccgApi.send("/game/company/arrive", {company : companyId });
        },

        _getCompanyElement : function(pMenu:any)
        {
            const id = ContextMenu.getAttribute(pMenu, "data-company");
            if (id === "")
                return null;
            else
                return document.getElementById(id);
        },

        companyMoveLeft: function(pMenu:any)
        {
            const div = this._getCompanyElement(pMenu);
            this.doCompanyMoveLeft(div, true);
        },

        doCompanyMoveLeft: function(div:any, notifyplayers:boolean)
        {
            const prev = div === null ? null : div.previousElementSibling;
            if (prev !== null)
            {
                div.parentElement.insertBefore(div, prev);
                if (notifyplayers)
                    MeccgApi.send("/game/company/move", { companyid : div.getAttribute("data-company-id"), direction: "left" });
            }
        },

        companyMoveRight: function(pMenu:any)
        {
            const div = this._getCompanyElement(pMenu);
            this.doCompanyMoveRight(div, true);
        },

        doCompanyMoveRight : function(div:any, notifyplayers:boolean)
        {
            const next = div === null ? null : div.nextElementSibling;
            
            if (next === null)
                return;

            const next2 = next.nextElementSibling;
            if (next2)
                div.parentElement.insertBefore(div, next2);
            else
                div.parentElement.append(div);


            if (notifyplayers)
                MeccgApi.send("/game/company/move", { companyid : div.getAttribute("data-company-id"), direction: "right" });
        },
        
        companyMoveRightEnd : function(pMenu:any)
        {
            const div = this._getCompanyElement(pMenu);
            this.doCompanyMoveRightEnd(div, true);

        },
        doCompanyMoveRightEnd : function(div:any, notifyplayers:boolean)
        {
            if (div?.nextElementSibling)
                div.parentElement.append(div);

            if (notifyplayers)
                MeccgApi.send("/game/company/move", { companyid : div.getAttribute("data-company-id"), direction: "end" });
        },
        hide : function()
        {
            const elem = document.getElementById("contextmenu");
            if (elem === null)
                return;

            elem.classList.add("hide");

            ArrayList(elem).findByClassName("context-menu").each(DomUtils.removeAllChildNodes);

            if (elem.classList.contains("context-menu-movement"))
                elem.classList.remove("context-menu-movement");
            
            if (elem.classList.contains("context-menu-site"))
                elem.classList.remove("context-menu-site");

            elem.setAttribute("data-card-code", "");
            elem.setAttribute("data-card-uuid", "");
            elem.setAttribute("data-company", "");
        },

        addRessource : function(pMenu:any)
        {
            let code = ContextMenu.getAttribute(pMenu, "data-card-code");
            if (code !== "")
                MeccgApi.send("/game/card/import", {code : code, type: "resource" });
        },

        addSiteCharacter : function()
        {
            const data = {
                company : "_temp",
                code : "",
                revealed : true,
                id : CreateHandCardsDraggableUtils.requireMessageId(),
                regionmap : true
            };
    
            document.body.dispatchEvent(new CustomEvent("meccg-map-show", { "detail":  data }));
        },

        addCharacter: function(pMenu:any)
        {
            let code = ContextMenu.getAttribute(pMenu, "data-card-code");
            if (code !== "")
                MeccgApi.send("/game/card/import", {code : code, type: "character" });
        },

        returnToSiteOfOrigin : function(pMenu:any)
        {
            const companyId = ContextMenu.getAttribute(pMenu, "data-company");
            if (companyId !== "")
                MeccgApi.send("/game/company/returntoorigin", {company : companyId });
        },

        reveal5CardsToOpponent : function()
        {
            ContextMenu.callbacks.queryCardNumer(
                Dictionary.get("context_reveal", "Reveal cards to opponent"), 
                Dictionary.get("context_reveal_text", "Please specifiy the number of cards your opponent will look at (if available in your deck)"),
                (count:number) => RevealPlayerDeck.INSTANCE?.onChoosePlayer(count));
        },

        reveal5CardsToSelf : function()
        {
            if (typeof RevealPlayerDeckSelf === "undefined")
                return;

            ContextMenu.callbacks.queryCardNumer(
                Dictionary.get("context_lookdeck", "Look at your playdeck"), 
                Dictionary.get("context_lookdeck_text", "Please specifiy the number of cards to look at. The cards will be shuffled again automatically."),
                (count:number) => RevealPlayerDeckSelf.lookAt(count)
            );
        },

        shuffleXCardsPlaydeck : function()
        {
            if (typeof RevealPlayerDeckSelf === "undefined")
                return;

            ContextMenu.callbacks.queryCardNumer(
                Dictionary.get("context_shuffle", "Shuffle Top of Playdeck"), 
                Dictionary.get("context_shuffle_text", "Please specifiy the number of cards to shuffle."),
                (count:number) => {
                    MeccgApi.send("/game/view-cards/shuffle", { target: "playdeck_top", count: count });
                    document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("context_shuffled", "Playdeck shuffled.") }));
                }
            );
        },

        shuffleDiscardpileIntoPlaydeck : function()
        {
            new Question().onOk(function()
            {
                MeccgApi.send("/game/deck/discard/playdeck", {  });
            }).show(
                Dictionary.get("context_shuffleinto", "Do you want to reshuffle pile into the playdeck?"), 
                Dictionary.get("context_shuffleinto_text", "All discarded cards will be reshuffled into the playdeck."), 
                Dictionary.get("context_shuffleinto_do", "Reshuffle")
            );
        },

        queryCardNumer : function(sTitle:string, sText:string, fnSuccessCallback:Function)
        {
            const dialog = document.createElement("dialog");
            dialog.setAttribute("class", "reveal-choose-card-count")

            const title = document.createElement("h2");
            title.innerText = sTitle;

            const p = document.createElement("p");
            p.innerText = sText;

            const input = document.createElement("input");
            input.setAttribute("type", "number");
            input.setAttribute("min", "3");
            input.setAttribute("max", "20");
            input.setAttribute("value", "5");
            input.setAttribute("id", "input_number_cards");

            const label = document.createElement("label");
            label.setAttribute("for", "input_number_cards");
            label.innerText = Dictionary.get("context_numberofcards", "Number of cards: ");

            const divButtons = document.createElement("div");
            divButtons.setAttribute("class", "question-answers");

            const buttonOk = document.createElement("button");
            buttonOk.innerText = Dictionary.get("context_continue", "Continue");
            buttonOk.onclick = () => { dialog.close(); fnSuccessCallback(input.value); };

            const buttonCancel = document.createElement("button");
            buttonCancel.setAttribute("class", "buttonCancel");
            buttonCancel.innerText = Dictionary.get("cancel", "Cancel");
            buttonCancel.onclick = () => dialog.close();

            divButtons.append(buttonOk, buttonCancel);

            dialog.onclose = () => dialog.parentElement?.removeChild(dialog);
            dialog.append(title, p, label, input, document.createElement("br"), divButtons);

            document.body.append(dialog);
            dialog.showModal();
        }
    },
    
    addItem : function(sAction:string, sLabel:string, sIcon:string, sClasses:string, callback:Function, cut = "", tipp = "")
    {
        if (typeof callback === "undefined")
            callback = ContextMenu.callbacks.empty;

        let text = Dictionary.get("context_e_" + sAction, sLabel);
        if (text === "")
            text = sLabel;
        
        this.data.items[sAction] = {
            action: sAction,
            icon : sIcon,
            label: text,
            classes: sClasses,
            tipp: typeof tipp !== "string" ? "" : tipp,
            shortcut: typeof cut === "string" ? cut : "",
            callback : callback
        }
    },
    
    createContextMenus : function()
    {
        this.addItem("ready", "Ready card", "fa-heart", "context-menu-item-rotate context-menu-item-generic context-menu-item-location", ContextMenu.callbacks.rotate);
        this.addItem("tap", "Tap card (90°)", "fa-arrow-circle-right", "context-menu-item-rotate context-menu-item-generic context-menu-item-location", ContextMenu.callbacks.rotate);
        this.addItem("tap_91", "Tap and lock tapped (90°)", "fa-lock", "context-menu-item-rotate context-menu-item-generic", ContextMenu.callbacks.rotate);
        this.addItem("wound", "Wound card (180°)", "fa-arrow-circle-down", "context-menu-item-rotate context-menu-item-generic", ContextMenu.callbacks.rotate);
        this.addItem("rot270", "Rotate 270°", "fa-arrow-circle-left", "context-menu-item-rotate context-menu-item-generic", ContextMenu.callbacks.rotate);
        this.addItem("glow_action", "Highlight card (5s)", "fa-bell-slash", "context-menu-item-glow context-menu-item-generic", ContextMenu.callbacks.glow);
        this.addItem("flipcard", "Flip Card", "fa-eye-slash", "context-menu-item-flipcard context-menu-item-generic", ContextMenu.callbacks.flip, "f");
        this.addItem("token_add", "Add token", "fa-plus", "context-menu-item-generic", ContextMenu.callbacks.tokenAdd, "+");
        this.addItem("token_remove", "Remove token", "fa-minus", "context-menu-item-generic", ContextMenu.callbacks.tokenRemove, "-");
        this.addItem("arrive", "Company arrives at destination", "fa-street-view", "context-menu-item-arrive", ContextMenu.callbacks.arrive);
        this.addItem("add_ressource", "Add this site as a ressource", "fa-clipboard", "context-menu-item-arrive", ContextMenu.callbacks.addRessource, "", "Adds this site as RESSOURCE to your hand and will be played facedown.");
        this.addItem("add_character", "Add this site as a character", "fa-user", "context-menu-item-arrive", ContextMenu.callbacks.addCharacter, "", "Adds this site as CHARACTER to your hand.");
        this.addItem("movement_return", "Return to site of origin", "fa-ban", "context-menu-item-arrive", ContextMenu.callbacks.returnToSiteOfOrigin, "", "Remove target site.");

        this.addItem("view_deck_cards", "Look at my playdeck as it is", "fa-stack-exchange", "context-menu-item-generic", () => TaskBarCards.Show("playdeck", false), "");
        this.addItem("view_deck_cards_ordered", "Look at my playdeck and group cards", "fa-eye", "context-menu-item-generic", () => TaskBarCards.Show("playdeck", true), "");
        this.addItem("view_deck_cards_reveal", "Reveal playdeck to opponent", "fa-eye", "context-menu-item-generic", () => TaskBarCards.OnRevealToOpponent("playdeck"), "");

        this.addItem("view_discardpile_cards", "Look at my discard pile as it is", "fa-stack-exchange", "context-menu-item-generic", () => TaskBarCards.Show("discard", false), "");
        this.addItem("view_discardpile_sites", "Show my tapped sites", "fa-map-signs", "context-menu-item-generic", ContextMenu.callbacks.viewTappedSites, "");
        this.addItem("view_discardpile_ordered", "Look at my discard pile and group cards", "fa-eye", "context-menu-item-generic", () => TaskBarCards.Show("discard", true), "");
        this.addItem("view_discardpile_cards_reveal", "Reveal discard pile to opponent", "fa-eye", "context-menu-item-generic", () => TaskBarCards.OnRevealToOpponent("discard"), "");

        
        this.addItem("move_company_left", "Move company one position to the left", "fa-arrow-left", "context-menu-item-generic", ContextMenu.callbacks.companyMoveLeft.bind(ContextMenu.callbacks));
        this.addItem("move_company_right", "Move company one position to the right", "fa-arrow-right", "context-menu-item-generic", ContextMenu.callbacks.companyMoveRight.bind(ContextMenu.callbacks));
        this.addItem("move_company_end", "Move company to the end", "fa-long-arrow-right", "context-menu-item-generic", ContextMenu.callbacks.companyMoveRightEnd.bind(ContextMenu.callbacks));

        if (sessionStorage.getItem("deck-notes"))
            this.addItem("view_deck_notes", "View deck notes", "fa-info-circle", "context-menu-item-generic", ContextMenu.callbacks.viewDeckNotes, "");
        
        this.addItem("reval_cards_number", "Reveal X cards to your opponent (I will not see them)", "fa-eye", "context-menu-item-generic", ContextMenu.callbacks.reveal5CardsToOpponent, "");
        this.addItem("reval_cards_number_self", "Look at your top X cards", "fa-eye", "context-menu-item-generic", ContextMenu.callbacks.reveal5CardsToSelf, "");
        this.addItem("playdeck_shuffle", "Shuffle deck", "fa-random", "context-menu-item-generic", TaskBarCards.ShufflePlaydeck, "");
        this.addItem("playdeck_shuffle_x_cards", "Shuffle top X cards of your playdeck", "fa-random", "context-menu-item-generic", ContextMenu.callbacks.shuffleXCardsPlaydeck, "");
        this.addItem("discardpile_shuffle_into_playdeck", "Shuffle discard pile into your playdeck", "fa-random", "context-menu-item-generic", ContextMenu.callbacks.shuffleDiscardpileIntoPlaydeck, "");

        this.addItem("discardpile_shuffle", "Shuffle Discard Pile", "fa-random", "context-menu-item-generic", TaskBarCards.ShuffleDiscardPile, "");

        this.addItem("playdeck_choose_site", "Add a site as a character", "fa-map-signs", "context-menu-item-generic", ContextMenu.callbacks.addSiteCharacter, "", "Adds this site as CHARACTER to your hand.");


        this.addItem("victory_me", "Show my stored cards", "fa-thumbs-up", "context-menu-item-generic", ContextMenu.callbacks.showVictoryMe.bind(ContextMenu.callbacks));
        this.addItem("victory_shared", "Show opponent's stored cards", "fa-thumbs-down", "context-menu-item-generic", ContextMenu.callbacks.showVictoryShared.bind(ContextMenu.callbacks));


        this.data.types["card"] = ["ready", "tap", "tap_91", "wound", "rot270", "_divider", "flipcard", "glow_action", "_divider","token_add", "token_remove"];
        this.data.types["location"] = ["ready", "tap", "_divider", "add_ressource", "add_character", "_divider", "arrive", "movement_return"];
        this.data.types["arrive"] = ["arrive", "movement_return"];
        this.data.types["playdeck_actions"] = ["view_deck_cards_ordered", "view_deck_cards", "view_deck_cards_reveal", "_divider", "reval_cards_number", "reval_cards_number_self", "_divider", "playdeck_choose_site", "view_deck_notes", "_divider", "playdeck_shuffle_x_cards",  "playdeck_shuffle"];
        this.data.types["discardpile_actions"] = ["view_discardpile_ordered", "view_discardpile_cards", "view_discardpile_sites", "_divider", "discardpile_shuffle", "view_discardpile_cards_reveal", "_divider", "discardpile_shuffle_into_playdeck"];
        this.data.types["company_position"] = ["move_company_left", "move_company_right", "move_company_end"];
        this.data.types["victory"] = ["victory_me", "victory_shared"];

        this.data.offsets["playdeck_actions"] = -100;
        this.data.specialClasses["location"] = "context-menu-site";
        this.data.specialClasses["arrive"] = "context-menu-movement";
    },

    getOffset : function(type:any)
    {
        const val = this.data.offsets[type];
        return typeof val === "number" ? val : 0;
    },
    
    insertContainers : function()
    {
        if (document.getElementById("contextmenu") !== null)
            return;

        /** insert container */
        const pCont = document.createElement("div");
        pCont.setAttribute("class", "contextmenu hide");
        pCont.setAttribute("id", "contextmenu");

        const div = document.createElement("div");
        div.classList.add("menu-overlay");
        div.onclick = ContextMenu.callbacks.hide;

        const nav = document.createElement("nav");
        nav.setAttribute("class", "context-menu smallCaps blue-box");

        pCont.appendChild(div);
        pCont.appendChild(nav);

        document.body.appendChild(pCont);
    },

    onReady : function()
    {
        ContextMenu.createContextMenus();
        ContextMenu.insertContainers();
    }
};

document.body.addEventListener("meccg-init-ready", ContextMenu.onReady, false);
document.body.addEventListener("meccg-context-site", ContextMenu.initContextMenuSite, false);
document.body.addEventListener("meccg-context-site-arrive", ContextMenu.initContextMenuSiteArrive, false);
document.body.addEventListener("meccg-context-generic", ContextMenu.initContextMenuGeneric, false);

export default ContextMenu