class MeccgTournament {

    #names = { };
    #points = { }
    #rounds = [];

    static init(json)
    {
        if (typeof json === "undefined" || !Array.isArray(json.names) || json.names.length === 0)
            return;
    
        const div = document.getElementById("game-list-tournament");
        if (div === null)
            return;
    
        json.names.sort((a, b) => a.title.localeCompare(b.title));
    
        for (let entry of json.names)
        {
            const id = entry.id;
            const det = new MeccgTournament().#createTournamentDetails(json.entries[id]);
            if (det !== null)
                div.appendChild(det);
        }
    
        div.classList.remove("hidden");
    }

    #createTournamentDetails(entry)
    {
        if (typeof entry === "undefined")
            return null;

        this.#addPariticipants(entry.participants);
        this.#calculateScores(entry.rounds);
        this.#tournamentRoundsCreate(entry.rounds);

        const details = document.createElement("details");
        details.append(
            this.#createTournamentDetailsSummary(entry.title),
            this.#createTournamentDetailsDescription(entry)
        )
    
        return details;
    }

    #calculateScores(list)
    {
        if (typeof list === "undefined" || !Array.isArray(list))
            return;

        for (let round of list)
        {
            for (let entry of round.list)
            {
                const parts = this.#tournamentRountsEntryParts(entry);
                if (parts !== null && parts.length === 2)
                {
                    this.#points[parts[0].name] = {
                        alias: this.#getAlias(parts[0].name),
                        points: 0
                    }
                    this.#points[parts[1].name] = {
                        alias: this.#getAlias(parts[1].name),
                        points: 0
                    }
                }      
            }
        }
    }

    #addPariticipants(list)
    {
        let index1, index2;
        for (let line of list)
        {
            index1 = -1;
            index2 = -1;

            const pair = line.trim().split("=");
            if (pair.length === 1)
            {
                if (pair[0] !== "")
                {
                    index1 = 0;
                    index2 = 0;
                }
            }
            else if (pair.length === 2)
            {
                index1 = 0;
                index2 = 1;
            }

            if (index1 === -1 || index2 === -1)
                continue;

            const name = pair[index1];
            const alias = pair[index2]
            if (name && alias && name !== "" && alias !== "")
            {
                this.#names[name] = alias;
                this.#points[name] = {
                    alias: alias,
                    points: 0
                }
            }
        }
    }

    #createTournamentDetailsSummary(title)
    {
        const summary = document.createElement("summary");
        summary.innerText = title;
        return summary;
    }
    #createTournamentDetailsDescription(json)
    {
        const div = document.createDocumentFragment();
        
        for (let elem of json.description)
            div.append(this.#createTournamentNode("p", elem.texts.join(" ")));

        const divP = document.createElement("div");
        divP.classList.add("game-list-tournament-participants");
        divP.append(
            this.#createTournamentNode("h3","Participants"),
            this.#getParticipantRanked(),
            this.#tournamentRounds()
        );

        div.appendChild(divP);
        return div;
    }

    #getParticipantRanked()
    {
        const list = [];

        for (let key of Object.keys(this.#points))
        {
            const entry = this.#points[key];
            if (entry)
                list.push(entry);
        }

        if (list.length > 1)
            list.sort((a,b) => b.points - a.points);

        const ul = document.createElement("ul");
        for (let entry of list)
        {
            const li = document.createElement("li");
            ul.append(li);
            li.append(
                document.createTextNode(entry.alias),
                document.createTextNode(": "),
                document.createTextNode("" + entry.points)
            );
        }
        return ul;
    }

    #getAlias(alias)
    {
        if (typeof alias === "string" && alias !== "" && this.#names[alias])
            return this.#names[alias];
        else 
            return alias;
    }

    #createTournamentNode(tag, text)
    {
        const div = document.createElement(tag);
        div.innerText = text;
        return div;
    }

    #tournamentRounds()
    {
        if (this.#rounds.length === 0)
            return document.createDocumentFragment();

        const table = document.createElement("ul");
        table.classList.add("tournament-round");

        for (let round of this.#rounds)
        {
            const li = document.createElement("li");
            li.classList.add("tournament-round-round");

            const h3 = document.createElement("h3");
            h3.innerText = round.headline.join(" ").trim();
            li.append(h3);

            const text = round.texts.join(" ").trim();
            if (text !== "")
            {
                const p = document.createElement("p");
                p.innerText = text;
                li.append(p);
            }

            li.append(this.#tournamentRountsRoundList(round.data));
            table.append(li);
        }

        return table;
    }


    #tournamentRoundsCreate(rounds)
    {
        function getDataObject()
        {
            const current = {
                headline: [],
                texts: [],
                data: [],
                isEmpty: function()
                {
                    return this.headline.length + this.texts.length + this.data.length === 0
                }
            }

            return current;
        }

        let current = getDataObject();

        for (let entry of rounds)
        {
            if (entry.headline === true)
            {
                if (!current.isEmpty())
                    this.#rounds.push(current);

                current = getDataObject();
                current.headline.push(...entry.texts)
            }
            else 
            {
                if (entry.texts.length > 0)
                    current.texts.push(...entry.texts);

                if (entry.list.length > 0)
                    this.#evalMatches(entry.list, current.data);
            }
        }

        if (!current.isEmpty())
            this.#rounds.push(current);
    }

    #evalMatches(list, target)
    {
        for (let entry of list)
        {
            const parts = this.#tournamentRountsEntryParts(entry);
            if (parts === null || parts.length !== 2)
                continue;

            this.#addPoints(parts[0]);
            this.#addPoints(parts[1]);

            target.push({
                first: parts[0],
                second: parts[1],
            })
        }
    }

    #addPoints(data)
    {
        if (data.points > 0 && this.#points[data.name])
            this.#points[data.name].points += data.points;
    }

    #tournamentRountsRoundList(list)
    {
        const res = document.createDocumentFragment();

        for (let entry of list)
            res.append(this.#tournamentRountsRoundListEntry(entry.first, entry.second));

        return res;
    }

    #tournamentRountsEntryParts(line)
    {
        const pos = line.lastIndexOf(" ");
        if (pos === -1)
            return null;

        if (line.indexOf(":") === -1 && line.indexOf("vs") === -1)
            return null;

        const left = line.substring(0, pos).replace(":", "").trim();
        const names = this.#entryGetNames(left);
        if (names.length !== 2)
            return null;

        const points = line.substring(pos).trim().split(":");
        if (points.length !== 2)
            return null;

        names[0].points = parseInt(points[0]);
        names[1].points = parseInt(points[1]);
        
        if (names[0].points > names[1].points)
            names[0].winner = true;
        else if (names[0].points < names[1].points)
            names[1].winner = true;
        
        return names;
    }
    #entryGetNames(line)
    {
        const list = [];
        for (let token of line.trim().split(" "))
        {
            if (token !== " " && token !== "vs")
                list.push({
                    name: token,
                    winner: false,
                    points: 0});
        }
        return list;
    }

    #tournamentRountsRoundListEntry(first, seond)
    {
        const tr = document.createDocumentFragment();
        const hasRes = first.points !== 0 || seond.points !== 0;
        
        const pFirst = this.#createRoundEntry(first, hasRes);
        const pSecond = this.#createRoundEntry(seond, hasRes);

        tr.append(
            pFirst,
            document.createTextNode(" vs "),
            pSecond,
            document.createElement("br")
        );

        return tr;
    }


    #createRoundEntry(first, showpt)
    {
        const _name = this.#getAlias(first.name);
        const _pt = showpt ? " (" + first.points + ")" : "";
        const text = _name + _pt;

        if (!first.winner)
            return document.createTextNode(text);

        const span = document.createElement("span")
        span.setAttribute("class", "game-list-tournament-winner");
        span.innerText = text;

        return span;
    }
}       

setTimeout(() => {

    fetch("/data/tournaments")
    .then(res => res.json())
    .then(MeccgTournament.init)
    .catch(console.error);

}, 60);