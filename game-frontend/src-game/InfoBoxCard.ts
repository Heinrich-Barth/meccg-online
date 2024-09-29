import CardList from "./utils/cardlist";
import DomUtils from "./utils/libraries";

const InfoBoxCard:any = {

    _timer : null,

    initTimer : function()
    {
        this.clearTimer();
        this._timer = setTimeout(this.getClearedBox.bind(this), 2000);
    },

    clearTimer : function()
    {
        if (this._timer !== null)
        {
            clearTimeout(this._timer);
            this._timer = null;
        }
    },

    showImage: function(code:string)
    {
        if (typeof code !== "string" || code === "")
            return;

        const image = this.getImage(code);
        const box = this.insertImage(image);
        if (box !== null)
        {
            this.showBox(box, true);
            this.initTimer();
        }

    },

    onEvent : function(e:any)
    {
        this.showImage(e.detail.code);
    },

    insertImage : function(image:string)
    {
        const box = this.getClearedBox();
        if (box === null)
            return null;
      
        const img = document.createElement("img");
        img.setAttribute("src", image);
        img.onclick = this.getClearedBox.bind(this);
        img.onmouseover = this.stopAutoHide.bind(this);
        img.onmouseout = this.getClearedBox.bind(this);
        img.title = "Click to close or move cursor away.";

        const div = document.createElement("div");
        div.setAttribute("class", "card-infobox-image card-infobox-image-animation");
        div.setAttribute("id", "card-infobox-image");
        div.appendChild(img);
        box.appendChild(div);

        return box;
    },

    showBox : function(box:any, bShow:boolean)
    {
        if (bShow && box.classList.contains("card-infobox-hidden"))
            box.classList.remove("card-infobox-hidden")
        else if (!bShow && !box.classList.contains("card-infobox-hidden"))
            box.classList.add("card-infobox-hidden")
    },

    stopAutoHide : function()
    {
        this.clearTimer();

        const div = document.getElementById("card-infobox-image");
        if (div !== null)
            div.classList.remove("card-infobox-image-animation");
    },

    getClearedBox : function()
    {
        this.clearTimer();

        const box = document.getElementById("card-infobox");
        if (box !== null)
        {
            this.showBox(box, false);
            DomUtils.removeAllChildNodes(box);
        }

        return box;
    },

    getImage : function(code:string)
    {
        return CardList().getImage(code);
    },

    init : function()
    {
        if (document.getElementById("card-infobox") !== null)
            return;

        const elem = document.createElement("div");
        elem.setAttribute("class", "card-infobox card-infobox-hidden");
        elem.setAttribute("id", "card-infobox");
        document.body.appendChild(elem);
    }
}

export function InitInfoBoxCard()
{
    InfoBoxCard.init();
    document.body.addEventListener("meccg-card-dropped", InfoBoxCard.onEvent.bind(InfoBoxCard), false);
}

export default InfoBoxCard;