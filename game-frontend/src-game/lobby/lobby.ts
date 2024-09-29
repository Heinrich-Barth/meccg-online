
declare const g_sRoom:string;
declare const g_sLobbyToken:string

const Lobby:any = {

    _room : "",
    _token : "",

    onClickToggleUsers : function()
    {
        const elem = document.getElementById("lobby-wrapper");
        Lobby.onClickToggleElem(elem, "Players", "player");
    },

    onClickToggleVisitors : function()
    {
        const elem = document.getElementById("visitor-wrapper");
        Lobby.onClickToggleElem(elem, "Visitors", "visitor");
    },

    onClickToggleElem : function(elem:any, type:string, key:string)
    {
        const allow = elem !== null && elem.getAttribute("data-allow") !== "true";
        const sTitle = allow ? type + " may join this game" : type + " cannot join this game";

        Lobby.onClickToggleSetValue(elem, allow, sTitle);

        const options = {
            method: 'POST',
            body: ""
        }
        fetch("/play/" + Lobby._room + "/invite/" + Lobby._token + "/" + key + "/" + allow, options).then(() => document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": sTitle })));
    },

    onClickToggleSetValue(elem:any, allow:string, title:string)
    {
        if (elem !== null)
        {
            elem.setAttribute("data-allow", allow);
            elem.setAttribute("title", title);
        }
    },

    init : function(sRoom:string, sLobbyToken:string)
    {
        if (sRoom === "" || sRoom === undefined || sLobbyToken === "" || sLobbyToken === undefined || document.getElementById("lobby-wrapper") !== null)
            return;

        Lobby._room = sRoom;
        Lobby._token = sLobbyToken;
        const playerselector = document.getElementById("chat_icon");
        if (playerselector === null)
            return;

        let div = document.createElement("div");
        div.setAttribute("id", "lobby-wrapper");
        div.setAttribute("class", "wrapper-topleft lobby-wrapper cursor-pointer");
        div.setAttribute("data-allow", "true");
        div.setAttribute("title", "Players can join this game");
        div.innerHTML =`<div class="icons"><i class="fa fa-user-circle" aria-hidden="true"></i></div>`;
        div.onclick = Lobby.onClickToggleUsers;

        playerselector.parentElement!.insertBefore(div, playerselector);

        div = document.createElement("div");
        div.setAttribute("id", "visitor-wrapper");
        div.setAttribute("class", "wrapper-topleft visitor-wrapper cursor-pointer");
        div.setAttribute("data-allow", "true");
        div.setAttribute("title", "Visitors can join this game");
        div.innerHTML =`<div class="icons"><i class="fa fa-eye" aria-hidden="true"></i></div>`;
        div.onclick = Lobby.onClickToggleVisitors;
        playerselector.parentElement!.insertBefore(div, playerselector);

        document.getElementById("interface")?.classList.add("is-admin");
        
        fetch("/play/" + Lobby._room + "/accessibility").then(response => response.json().then((Lobby.onUpdateAccessibility)));
    },

    onUpdateAccessibility : function(data:any)
    {
        if (data.player !== true)
        {
            const elem = document.getElementById("lobby-wrapper");
            Lobby.onClickToggleSetValue(elem, false, "Players cannot join this game");
        }

        if (data.visitor !== true)
        {
            const elem = document.getElementById("visitor-wrapper");
            Lobby.onClickToggleSetValue(elem, false, "Visitors cannot join this game");
        }
    },

    triggerLockRoom()
    {
        const elem = document.getElementById("lobby-wrapper");
        if (elem !== null && elem.hasAttribute("data-allow") && elem.getAttribute("data-allow") === "true")
            Lobby.onClickToggleUsers();
    }
};

setTimeout(() => Lobby.init(g_sRoom, g_sLobbyToken), 200);

export default Lobby;