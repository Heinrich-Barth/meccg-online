

class DiceContainer {
    
    static _jPlayerMap = {};
    static _count = 1;
    static _timeout = 5500;
    static _folder = "black";
    static _fallback = "/media/personalisation/dice/default"

    getPlayerName(id)
    {
        let sName = DiceContainer._jPlayerMap[id];
        if (typeof sName === "undefined" || sName === "")
            return Dictionary.get("dice_opponent", "Opponent");
        else
            return sName;
    }
    
    create()
    {
        const type = document.body.getAttribute("data-dice");
        if (type !== null && type !== "" && type.indexOf(".") === -1)
            this._folder = type;

        const tempContainer = document.getElementById("dice_roll");
        if (tempContainer !== null)
            return tempContainer;

        const jCont = document.createElement("div");
        jCont.setAttribute("id", "dice_roll");
        jCont.innerHTML = '<div class="dice-result-list"></div>';
        document.body.prepend(jCont);
        return jCont;
    }

    static getImage(asset, nVal)
    {
        let folder = asset;
        if (folder === "" || folder === undefined || folder.indexOf("..") !== -1)
            return DiceContainer._fallback + "/dice-" + nVal + ".png";
        else
            return "/media/personalisation/dice/" + folder + "/dice-" + nVal + ".png";
    }

    static createResultElement(id, sName, first, second, total, asset)
    {
        const nFirst = parseInt(first);
        const nSecond = parseInt(second);

        const htmlP = document.createElement("p");
        const imgDice = document.createElement("img");
        imgDice.setAttribute("class", "dice-icon");
        imgDice.setAttribute("src", "/media/assets/images/icons/icon-dices.png");
        htmlP.appendChild(imgDice);

        const spanWho = document.createElement("span");
        spanWho.setAttribute("class", "who");
        spanWho.innerText = sName;
        htmlP.appendChild(spanWho);
        
        htmlP.appendChild(document.createTextNode(" " + Dictionary.get("dice_who_rolled", "rolled a") + " "));
        
        const spanTotal = document.createElement("span");
        spanTotal.setAttribute("class", "total big");
        spanTotal.innerText = nFirst + nSecond
        htmlP.appendChild(spanTotal);
        
        htmlP.appendChild(document.createElement("br"));

        const htmlImage1 = document.createElement("img");
        htmlImage1.setAttribute("class", "dice-image");
        htmlImage1.setAttribute("src", DiceContainer.getImage(asset, nFirst));
        htmlP.appendChild(htmlImage1);

        const htmlImage2 = document.createElement("img");
        htmlImage2.setAttribute("class", "dice-image");
        htmlImage2.setAttribute("src", DiceContainer.getImage(asset, nSecond));
        htmlP.appendChild(htmlImage2);

        const divLine = document.createElement("div");
        divLine.setAttribute("class", "dice-line-countdown");

        const div = document.createElement("div");
        div.setAttribute("class","dice-content blue-box pos-rel");
        div.setAttribute("id", id);
        div.appendChild(htmlP);
        div.appendChild(divLine);

        return div;
    }

    getDiceAsset(dice)
    {
        if (dice === undefined || dice === "")
            return "";
        else
            return dice;
    }

    appendResult(id, name, first, second, total, dice)
    {
        const asset = this.getDiceAsset(dice);
        return DiceContainer.createResultElement(id, name, first, second, total, asset);
    }

    static removeResult(id)
    {
        const elem = document.getElementById(id);
        if (elem !== null)
            elem.parentNode.removeChild(elem);
    }
    
    requirePlayerName(bIsPlayer, userId, code)
    {
        if (code !== "")
            return code;
        else
            return bIsPlayer ? Dictionary.get("dice_you", "You") : this.getPlayerName(userId);
    }

    requireContainer()
    {
        const elem = document.getElementById("dice_roll");
        return elem === null ? this.create() : elem;
    }

    show(name, first, second, total, dice, uuid)
    {
        const pos = this.#getPosition(uuid);
        const nId = ++DiceContainer._count;

        const elem = this.appendResult(nId, name, first, second, total, dice);
        if (pos === null)
        {
            elem.onclick = () => DiceContainer.removeResult(nId);
            this.requireContainer().querySelector(".dice-result-list").prepend(elem);
        }
        else
        {
            elem.removeAttribute("id");
            const div = document.createElement("div");
            div.setAttribute("class", "character-dice-body");
            div.setAttribute("id", nId);
            div.setAttribute("title", Dictionary.get("dice_clickclose", "Click to close dice result"));
            div.style.left = pos.x + "px";
            div.style.top = pos.y + "px";
            div.appendChild(elem);
            div.onclick = () => DiceContainer.removeResult(nId);
            document.body.appendChild(div);
        }
        
        setTimeout(() => DiceContainer.removeResult(nId), DiceContainer._timeout); 
    }

    #updateDiceUserSelfContainer(id, asset, first, second)
    {
        const div = document.getElementById(id);
        if (div === null)
        {
            console.warn("Cannot find dice container #" + id);
            return;
        }

        const list = div.getElementsByTagName("img")
        if (list === null || list.length !== 2)
        {
            console.warn("no images found in dice container #" + id);
            return;
        }
        
        list[0].setAttribute("src", DiceContainer.getImage(asset, first))
        list[1].setAttribute("src", DiceContainer.getImage(asset, second))
    }

    #updateDiceUserSelf(first, second, dice)
    {
        const asset = this.getDiceAsset(dice);
        this.#updateDiceUserSelfContainer("roll_dice_icons", asset, first, second);
        this.#updateDiceUserSelfContainer("roll_dice_icon_hand", asset, first, second);
    }

    updateDiceUser(isMe, first, second, dice)
    {
        if (isMe)
        {
            this.#updateDiceUserSelf(first, second, dice);
            return;
        }

        const container = this.#requireOpponentDices();
        if (container === null)
            return;

        const asset = this.getDiceAsset(dice);
        DomUtils.removeAllChildNodes(container);

        const imgDice1 = document.createElement("img");
        imgDice1.setAttribute("src", DiceContainer.getImage(asset, first))

        const imgDice2 = document.createElement("img");
        imgDice2.setAttribute("src", DiceContainer.getImage(asset, second))

        container.append(imgDice1, imgDice2);
    }

    #requireOpponentDices()
    {
        const cont = document.getElementById("staging-opponent-dice");
        if (cont !== null)
            return cont;

        const area = document.getElementById("opponent_table");
        const stage = area.querySelector(".staging-area-opponent")
        if (stage === null)
            return document.createElement("div");

        const elem = document.createElement("div");
        elem.setAttribute("id", "staging-opponent-dice");
        elem.setAttribute("class", "staging-opponent-dice");
        stage.prepend(elem);
        return elem;
    }

    #companyIsHidden(elem)
    {
        if (elem === null)
            return true;

        if (elem.classList.contains("companies"))
            return elem.classList.contains("hidden");
        
        return this.#companyIsHidden(elem.parentNode);
    }

    #isOutsideOfViewport(elem)
    {
        if (elem === null)
            return true;

        const bounding = elem.getBoundingClientRect();
        if (bounding.top < 0 || bounding.left < 0) {
            console.log("outside top or left");
            return true;
        }
        
        if (bounding.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
            console.log("outside bottom");
            return true;
        }
        
        if (bounding.right > (window.innerWidth || document.documentElement.clientWidth)) {
            console.log("outside right");
            return true;
        }

        return false;
    }

    #getPosition(uuid)
    {
        const elem = document.getElementById("ingamecard_" + uuid);
        if (elem === null || this.#companyIsHidden(elem) || this.#isOutsideOfViewport(elem))
            return null;
        
        const pos = elem.getBoundingClientRect();
        return {
            x: pos.left,
            y: pos.top
        };
    }

    static OnShow(e)
    {
        const detail = e.detail;
        const instance = new DiceContainer();

        const name = instance.requirePlayerName(detail.isme, detail.user, detail.code);
        instance.show(name, detail.first, detail.second, detail.total, detail.dice, detail.uuid);
        instance.updateDiceUser(detail.isme, detail.first, detail.second, detail.dice);
    }

    static OnPlayers(e)
    {
        DiceContainer._jPlayerMap = e.detail.map;
    }
}

document.body.addEventListener("meccg-dice-rolled", DiceContainer.OnShow, false);
document.body.addEventListener("meccg-players-updated", DiceContainer.OnPlayers, false);
