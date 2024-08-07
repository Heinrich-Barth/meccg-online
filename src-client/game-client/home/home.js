
const emptyNode = function(parent)
{
    if (parent !== null)
    {
        while (parent.firstChild) 
            parent.removeChild(parent.firstChild);
    }
};

const isInvalid = function(name)
{
    return name === "" || name.indexOf("<") !== -1 || name.indexOf(">") !== -1;
};

const randomNumber = function(max)
{
    return max <= 1 ? 0 : Math.floor(Math.random() * max);
};


const g_jsonRoomImages = { };

const loadSampleRooms = function()
{
    if (document.getElementById("enter_room").value !== "" || SampleRoomApp.isEmpty())
        return;

    const filtered = SampleRoomApp.getAvailable();
    if (filtered.length === 0)
        return;

    let name = "";
    let image = "";

    const _index = randomNumber(filtered.length);
    const randomRoom = filtered[_index];
    if (typeof randomRoom === "string") /** cache might be a problem, so allow backward compatibility */
    {
        name = randomRoom;
    }
    else
    {
        name = randomRoom.name;
        image = randomRoom.image;
    }

    document.getElementById("enter_room").value = name;
    SampleRoomApp.setImage(image);
}

const toNumberString = function(nValue)
{
    return (nValue < 10 ? "0" : "") + nValue;
};

const getGameTypeDuration = function(lTime)
{
    lTime = lTime / 1000;
    
    const lMins = Math.round(lTime / 60);
    if (lMins > 0)
        return lMins + "min";
    else
        return "now";
}

const createAvatarList = function(list)
{
    if (!Array.isArray(list) || list.length === 0)
        return document.createDocumentFragment();

    const res = document.createElement("ul");
    res.setAttribute("class", "avatar-list");

    for (let src of list)
    {
        if (src === "")
            continue;

        const img = document.createElement("img");
        img.setAttribute("src", src);
        
        const cont = document.createElement("li");
        cont.append(img);

        res.append(cont);
    }

    return res;
}

const addGameType = function(value, isArda, context, labelGameType)
{
    const _room = value.room;
    const _players = value.players;
    const _context = context;

    const since = value.duration ? getGameTypeDuration(value.duration) : getGameTypeDuration(Date.now() - value.time);
    
    const _tr = document.createElement("div");
    _tr.setAttribute("class", "room-image-wrapper blue-box");

    {   
        const tdImage = document.createElement("div");
        _tr.appendChild(tdImage);
        tdImage.setAttribute("class", "room-image");
    
        const _img = document.createElement("img");
        _img.setAttribute("src", SampleRoomApp.getRoomImage(_room));
        tdImage.appendChild(_img);
    }
    
    const tdRoom = document.createElement("div");
    tdRoom.setAttribute("class", "room-text");
    _tr.appendChild(tdRoom);

    const h3 = document.createElement("h3");
    const span = document.createElement("span");
    span.innerText = labelGameType;
    span.setAttribute("class", isArda ? "deck-label-green" : "deck-label-blue")
   
    const label = document.createElement("div");
    label.setAttribute("class", "deck-label");
    label.appendChild(span);
    h3.append(document.createTextNode(_room.toUpperCase()), label);

    const tempList = [];
    for (let _player of _players)
    {
        if (typeof _player === "string")
            tempList.push(_player);
        else if (_player.score < 0)
            tempList.push(_player.name);
        else
            tempList.push(_player.name + " (" + _player.score + ")");
    }
    const spanTime = document.createElement("span");
    spanTime.setAttribute("class", "game-duration fa fa-clock-o");
    spanTime.innerText = " " + since;

    const playerP = document.createElement("p");
    playerP.append(spanTime, document.createTextNode(", "), document.createTextNode(tempList.sort().join(", ")));

    tdRoom.append(h3, playerP);

    tdRoom.append(createAvatarList(value.avatars));

    tdRoom.append(document.createElement("br"));

    if (value.accessible || value.visitors)
    {
        tdRoom.classList.add("space-right");

        const actions = document.createElement("div");
        _tr.append(actions);
        actions.setAttribute("class", "actions");
        
        const _r = [];
        if (value.accessible)
            _r.push(`<a href="/${_context}/${_room}" title="${Dictionary.get("home.clicktojoin", "Click to join")}" class="fa fa-plus-square"> ${Dictionary.get("home.clicktojoin.play", "play")}</a>`);
        
        if (value.visitors)
            _r.push(`<a href="/${_context}/${_room}/watch" title="${Dictionary.get("home.clicktowatch", "Click to watch")}" class="fa fa-eye"> ${Dictionary.get("home.clicktowatch.watch", "watch")}</a>`);

        actions.innerHTML= _r.join("");
    }

    return _tr;
}

const addGameTypes = function(container, data)
{
    for (let game of data)
    {
        if (!game.single && game.arda)
        {
            container.appendChild(addGameType(game, true, "arda", "Arda"));
            SampleRoomApp.addRoomTaken(game.room);
        }
    }
    for (let game of data)
    {
        if (!game.single && !game.arda)
        {
            container.appendChild(addGameType(game, false, "play", "Standard or DC"));
            SampleRoomApp.addRoomTaken(game.room);
        }
    }
    for (let game of data)
    {
        if (game.single && game.arda)
        {
            container.appendChild(addGameType(game, true, "singleplayer", "Solitary"));
            SampleRoomApp.addRoomTaken(game.room);
        }
    }
};

const hideContainer = function(id)
{
    const elem = document.getElementById(id);
    if (elem !== null && !elem.classList.contains("hidden"))
        elem.classList.add("hidden");
};

const showContainer = function(id)
{
    const elem = document.getElementById(id);
    if (elem?.classList?.contains("hidden"))
        elem.classList.remove("hidden");
};

const requireFooter = function()
{
    let footer = document.querySelector("footer");
    if (footer === null)
    {
        footer = document.createElement("footer");
        document.body.appendChild(footer);
    } 

    return footer;
}

const onAddFooterTime = function(data)
{
    const footer = requireFooter();
    footer.innerText = "";

    const text = document.createDocumentFragment();
    text.appendChild(document.createTextNode(data.startup));
    footer.appendChild(text);
    return data;
}

const onAddUptimeNotification = function(data)
{
    const hrs = typeof data.uptime !== "number" ? 0 : (data.uptime /  1000 / 60 / 60).toFixed(2);
    if (hrs < 22 || data.autoRestart !== true)
        return;

    const elem = document.getElementById("login");
    if (elem === null)
        return;

    let p = document.getElementById("time-restart-information");
    if (p === null)
    {
        p = document.createElement("p");
        p.setAttribute("class", "center time-restart-information");
        p.setAttribute("id", "time-restart-information");
        elem.appendChild(p);
    }

    while (p.firstChild)
        p.removeChild(p.firstChild);

    const texts = document.createDocumentFragment();
    if (hrs >= 22 && hrs < 23)
    {
        p.classList.add("time-restart-information-yellow");
        texts.append(document.createTextNode("Server restarts approx. every 24hrs and has been up for " +  hrs + "h already. "));
        texts.append(document.createTextNode("You may start a game at any time, but be aware that a restart will end your game."));
    }
    else if (hrs >= 23 && hrs < 23.5)
    {
        texts.append(document.createTextNode("Server restarts approx. every 24hrs and has been up for " +  hrs + "h already. "));
        texts.append(document.createTextNode("Unless you want to play a short game, you may want to wait some time."));
    }
    else
    {
        texts.append(document.createTextNode("Server restarts approx. every 24hrs and a reboot is imminent."));
        texts.append(document.createTextNode("Please wait a few moments."));
    }
    
    const i = document.createElement("i");
    i.setAttribute("class", "fa fa-clock-o");
    p.append(i, texts);
}

const onResult = function(data)
{
    const pContainer = document.getElementById("game_list");
    if (pContainer === null)
        return;

    if (!pContainer.classList.contains("game_list-grid"))
        pContainer.classList.add("game_list-grid");

    emptyNode(pContainer);

    if (data === undefined || data.length === 0)
    {
        hideContainer("active_games");
        loadSampleRooms();
        return;
    }

    data.sort(function(a, b) { return a.room.toLowerCase().localeCompare(b.room.toLowerCase()); });

    SampleRoomApp.clearTaken();

    const table = document.createDocumentFragment();

    addGameTypes(table, data);

    pContainer.appendChild(table);

    showContainer("active_games");
    loadSampleRooms();
};

const isAlphaNumeric = function(sInput)
{
    return sInput !== undefined && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
};

const showFetchError = function(err)
{
    console.error(err);
    document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch game list." }));
};

let g_nCountFechGames = 0;

const fetchAndUpdateGames = function()
{
    g_nCountFechGames++;
    fetch("/data/games").then((response) => response.json()).then(onResult).catch(showFetchError);
    fetch("/data/health").then(response => response.json()).then(onAddFooterTime).then(onAddUptimeNotification).catch(showFetchError);
    if (g_nCountFechGames === 60)
    {
        clearInterval(g_fetchGamesInterval);
        g_fetchGamesInterval = setInterval(fetchAndUpdateGames, 60 * 1000);
        g_nCountFechGames = 0;

        const elem = document.getElementById("game-list-counter");
        if (elem !== null)
        {
            elem.classList.remove("line-countdown-10s");
            elem.classList.add("line-countdown-60s");
        }
    }
};

const SampleRoomApp = 
{
    g_jsonRoomNames: [],
    g_jsonRoomImages: {},
    g_listRoomsTaken : [],

    getRoomImage : function(room)
    {
        const val = this.g_jsonRoomImages[room.toLowerCase()];
        return typeof val !== "string" ? "/data/backside" : val;
    },

    isEmpty : function()
    {
        return this.g_jsonRoomNames.length === 0;
    },

    setImage : function(image)
    {
        if (image !== "")
            document.getElementById("enter_room_image")?.setAttribute("src", image);
    },

    clearTaken : function()
    {
        if (SampleRoomApp.g_listRoomsTaken.length > 0)
            SampleRoomApp.g_listRoomsTaken.splice(0, SampleRoomApp.g_listRoomsTaken.length);
    },

    getAvailable: function()
    {
        return this.g_jsonRoomNames.filter((candidate) => !SampleRoomApp.isTaken(candidate.name));
    },

    isTaken : function(room)
    {
        return this.g_listRoomsTaken.includes(room.toLowerCase());
    },

    addRoomTaken : function(room)
    {
        if (room !== "")
            this.g_listRoomsTaken.push(room);
    },

    load : function(rooms)
    {
        rooms.forEach(_e => {
            SampleRoomApp.g_jsonRoomNames.push(_e);
            SampleRoomApp.g_jsonRoomImages[_e.name.toLowerCase()] = _e.image;
        });

        const _img = document.getElementById("enter_room_image");
        if (_img === null)
            return;

        const div = _img.parentElement;
        div.setAttribute("title", "Click to change room name");
        div.onclick = this.onChangeRoom.bind(this);
    },

    requireDialog : function()
    {
        const elem = document.getElementById("choose-room-dialog");
        if (elem !== null)
            return this.clearContainer(elem);

        const dialog = document.createElement("dialog");
        dialog.setAttribute("id", "choose-room-dialog");
        dialog.setAttribute("class", "choose-room-dialog");
        dialog.onclose = this.closeDialog.bind(this);
        document.body.append(dialog);
        return dialog;
    },

    clearContainer : function(parent)
    {
        while (parent.firstChild)
            parent.removeChild(parent.firstChild);

        return parent;
    },

    onChangeRoom : function()
    {
        const listAvail = this.getAvailable();
        if (listAvail.length === 0)
            return;

        const docList = document.createDocumentFragment();
        docList.append(
            this.createElement("h2", "Choose your game room"),
            this.createElement("p", "Click on a room or pres ESC to close"),
        )
        for (let obj of listAvail)
        {
            const img = document.createElement("img");
            img.setAttribute("data-room", obj.name.toLowerCase());
            img.setAttribute("src", obj.image);
            img.setAttribute("title", "Click to change room to " + obj.name);
            img.setAttribute("loading", "lazy");
            img.onclick = this.onChooseRoom.bind(this);

            const elem = document.createElement("div");
            elem.appendChild(img);
            docList.append(elem);
        }
        
        const dialog = this.requireDialog();
        dialog.onclick = this.closeDialog.bind(this);
        dialog.append(docList);
        dialog.showModal();
    },

    createElement : function(type, text)
    {
        const h2 = document.createElement(type);
        h2.innerText = text;
        return h2;
    },

    closeDialog : function()
    {
        const elem = document.getElementById("choose-room-dialog");
        if (elem !== null)
        {
            this.clearContainer(elem);
            elem.close();
            elem.parentElement.removeChild(elem);
        }
    },

    onChooseRoom : function(e)
    {
        const room = e.target?.getAttribute("data-room");
        const src = e.target?.getAttribute("src");
        if (typeof room !== "string" || typeof src !== "string")
        {
            this.closeDialog();
            return;
        }

        document.getElementById("enter_room").value = room;
        this.setImage(e.target?.getAttribute("src"));
        this.closeDialog();
    }
};

(function()
{
    document.getElementById("login").classList.remove("hidden");

    document.getElementById("start_game").onclick = function()
    {
        try
        {
            const sVal = document.getElementById("enter_room").value;
            if (sVal === "")
                throw new Error("Please provide a game name.");
            else if (!isAlphaNumeric(sVal))
                throw new Error("The room name has to be alphanumeric.");
            else if (sVal.indexOf(" ") !== -1 || sVal.indexOf("/") !== -1)
                throw new Error("Invalid name.");
            else
                window.location.href = "/play/" + sVal;
        }
        catch(err)
        {
            console.error(err);
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": err }));
        }
    }


    document.getElementById("enter_room").onkeyup = function (e) 
    {
        let code = "";
        if (e.key !== undefined)
            code = e.key;
        else if (e.keyIdentifier !== undefined)
            code = e.keyIdentifier;

        if (code === "Enter")
        {
            document.getElementById("start_game").dispatchEvent(new Event('click'));
            e.preventDefault();
            return false;
        }
    }

    document.getElementById("enter_room").focus();

    fetch("/data/samplerooms")
    .then(response => response.json())
    .then(SampleRoomApp.load.bind(SampleRoomApp))
    .catch(console.error)
    .finally(fetchAndUpdateGames);

    {
        const help = document.getElementById("room-text-container-help");
        if (help !== null)
        {
            help.onclick = () => {
                document.body.classList.add("show-home-hide-by-default");
                help.parentElement.removeChild(help);
            }
        }
    }
})();

let g_fetchGamesInterval = setInterval(fetchAndUpdateGames, 10 * 1000);


