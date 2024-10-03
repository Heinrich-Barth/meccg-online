import CardPreview from "../card-preview";
import CardList from "../utils/cardlist";

class DiscardPileAtTable 
{
    id = "discardpiles_opponent";
    imgPrefix = "discardimage_";

    insertContainer()
    {
        const list = document.getElementsByClassName("staging-area-opponent");
        if (list.length === 0)
            return;

        const elem = document.createElement("div");
        elem.classList.add("discardpiles");
        if (!DiscardPileAtTable.isWatching())
            elem.classList.add("hide");

        elem.setAttribute("id", this.id);
        list[0].appendChild(elem);
    }

    static isWatching()
    {
        return document.body.getAttribute("data-is-watcher") === "true";
    }
    
    updateDiscardContainers(e:any)
    {
        const playerId = e.detail.challengerId;
        const map = e.detail.map;
        const playerIds = Object.keys(map);
        for (let _player of playerIds)
        {
            if (playerId !== _player)
                this.addPlayer(_player, map[_player]);
        }
    }

    addPlayer(playerId:string, name:string)
    {
        if (playerId === undefined || name === undefined)
            return;

        const contId = "discard_" + playerId;
        if (document.getElementById(contId) !== null)
            return;

        let cont = document.createElement("div");
        cont.setAttribute("class", "challenger-discardpile pos-rel");
        cont.setAttribute("id", contId);
        cont.setAttribute("title", name + "'s discard pile");
        cont.setAttribute("data-player", playerId);

        let img = document.createElement("img");
        img.setAttribute("id", this.imgPrefix + playerId);
        img.setAttribute("src", "/data/backside");
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("class","card-icon discardpile-card-icon");
        img.setAttribute("data-image-backside", "/data/backside");

        cont.appendChild(img);
        document.getElementById(this.id)?.appendChild(cont);

        CardPreview.init(document.getElementById(contId), false, true);
    }

    hideDiscardPiles()
    {
        const list:any = document.getElementsByClassName("discardpile-card-icon");
        const len = list.length;
        for (let i = 0; i < len; i++)
        {
            list[i].src = list[i].getAttribute("data-image-backside") ?? "";

        }
    }

    addCardToContainers(e:any)
    {
        const user = e.detail.owner;
        const img = CardList().getImage(e.detail.code);
        const elem:any = document.getElementById(this.imgPrefix + user);
        if (elem)
            elem.src = img;

        document.getElementById(this.id)?.classList.remove("hide");
    }
}

const pInstance = new DiscardPileAtTable();
pInstance.insertContainer();

export default function InitDiscardPileAtTable()
{
    document.body.addEventListener("meccg-players-updated", pInstance.updateDiscardContainers.bind(pInstance), false);
    document.body.addEventListener("meccg-discardpile-add", pInstance.addCardToContainers.bind(pInstance), false);

    /** allow spectators to always see discard piles */
    if (!DiscardPileAtTable.isWatching())
        document.body.addEventListener("meccg-discardpile-hide", pInstance.hideDiscardPiles.bind(pInstance), false);
}