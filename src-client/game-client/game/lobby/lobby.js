

class SpectatorContainer {

    static #instance = new SpectatorContainer();

    static get() 
    {
        return SpectatorContainer.#instance;
    }

    #requireContainer()
    {
        const div = this.#getContainer();
        if (div)
            return div;

        const elem = document.createElement("ul");
        elem.setAttribute("id", "spectator-contianer");
        elem.setAttribute("class", "spectator-contianer");
        elem.setAttribute("title", "Spectators");
        document.body.append(elem);
        return elem;
    }

    #getContainer()
    {
        return document.getElementById("spectator-contianer");
    }

    #removeSpectatorContainer()
    {
        const div = this.#getContainer();
        if (div)
            div.parentElement.removeChild(div)
    }

    update(list)
    {
        if (!Array.isArray(list) || list.length === 0)
        {
            this.#removeSpectatorContainer();
            return;
        }

        const ul = this.#requireContainer();
        this.#removeObsolete(list, this.#getContainerMap(ul));
        this.#addSpectators(list, ul, this.#getContainerElementIds(ul));
    }

    #addSpectators(spectators, ul, elems)
    {
        spectators
            .filter(e => !elems.includes(e.id))
            .forEach(spectator => this.#insertSpectator(ul, spectator.id, spectator.avatar));
    }

    #insertSpectator(ul, id, avatar)
    {
        const img = document.createElement("img");
        img.setAttribute("src", g_Game.CardList.getImage(avatar));

        const li = document.createElement("li");
        li.setAttribute("data-id", id)
        li.append(img);

        ul.append(li);
    }

    #removeObsolete(spectators, lis)
    {
        const ids = spectators.map(e => e.id);
        for (const id in lis)
        {
            const elem = lis[id];
            if (!ids.includes(id))
                elem.parentElement.removeChild(elem);
        };
    }

    #getContainerMap(ul)
    {
        const map = { }

        const lis = ul.querySelectorAll("li");
        if (lis === null || lis.length === 0)
            return map;

        for (const e of lis)
        {
            const id = e.getAttribute("data-id");
            if (id)
                map[id] = e;
        }

        return map;
    }

    #getContainerElementIds(ul)
    {
        const ids = []

        const lis = ul.querySelectorAll("li");
        if (lis === null || lis.length === 0)
            return ids;

        for (const e of lis)
        {
            const id = e.getAttribute("data-id");
            if (id)
                ids.push(id);
        }

        return ids;
    }
}

const Lobby = {

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

    onClickToggleElem : function(elem, type, key)
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

    onClickToggleSetValue(elem, allow, title)
    {
        if (elem !== null)
        {
            elem.setAttribute("data-allow", allow);
            elem.setAttribute("title", title);
        }
    },

    init : function(sRoom, sLobbyToken)
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

        playerselector.parentElement.insertBefore(div, playerselector);

        div = document.createElement("div");
        div.setAttribute("id", "visitor-wrapper");
        div.setAttribute("class", "wrapper-topleft visitor-wrapper cursor-pointer");
        div.setAttribute("data-allow", "true");
        div.setAttribute("title", "Visitors can join this game");
        div.innerHTML =`<div class="icons"><i class="fa fa-eye" aria-hidden="true"></i></div>`;
        div.onclick = Lobby.onClickToggleVisitors;
        playerselector.parentElement.insertBefore(div, playerselector);

        document.getElementById("interface").classList.add("is-admin");
        
        fetch("/play/" + Lobby._room + "/accessibility").then(response => response.json().then((Lobby.onUpdateAccessibility)));
    },

    onUpdateAccessibility : function(data)
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

    triggerLockRoom: function()
    {
        const elem = document.getElementById("lobby-wrapper");
        if (elem !== null && elem.hasAttribute("data-allow") && elem.getAttribute("data-allow") === "true")
            Lobby.onClickToggleUsers();
    },

};


setTimeout(() => Lobby.init(g_sRoom, g_sLobbyToken), 200);
