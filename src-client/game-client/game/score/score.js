
class ScoringContainers {

    constructor(props, points_min, points_max)
    {
        this._props = props;
        this._points_min = points_min;
        this._points_max = points_max;
    }

    create()
    {
        this.createScoreCard();
        this.createScoreSheet();
    }

    createScoreCardTypes()
    {
        const div = document.createElement("div");
        div.setAttribute("id", "score-type-choose");
        div.setAttribute("class", "score-type");
        
        this._props.forEach(function(entry)
        {
            let _ch = entry.default ? 'checked="checked"' : "";
            if (entry.default)
                div.setAttribute("default-id", entry.id);

            let elem = document.createElement("div");
            elem.setAttribute("class", "score_label");
            elem.innerHTML = `<input type="radio" name="score_type" id="${entry.id}" value="${entry.value}" ${_ch}> <label id="${entry.id}_label" for="${entry.id}">${entry.label}</label>`;
    
            if (entry.ignorecount !== true)
                div.appendChild(elem);
        });

        return div;
    }

    createScoreCardPoints()
    {
        const jChoose_score_type = document.createElement("div");
        jChoose_score_type.setAttribute("id", "score-points-choose");
        jChoose_score_type.setAttribute("class", "score-type");
        jChoose_score_type.setAttribute("default-id", "score_0");

        for (let i = this._points_min; i <= this._points_max; i++)
        {
            const _id = i < 0 ? ("score_m" + (i * -1)) : "score_" + i;
            const _label  = i + " " + (i === 1 || i === -1 ? Dictionary.get("score_point", "Point") : Dictionary.get("score_points", "Points"));

            const div = document.createElement("div");
            div.setAttribute("class", "score_label");
            div.innerHTML = `<input type="radio" name="score_points" id="${_id}" value="${i}"> <label for="${_id}" id="${_id}_points">${_label}</label>`;
            jChoose_score_type.appendChild(div);
        }

        
        return jChoose_score_type;
    }
    
    createScoreCard()
    {
        if (document.getElementById("scoring-card") !== null)
            return;

        const jContainer = document.createElement("div");
        jContainer.setAttribute("id", "scoring-card");
        jContainer.setAttribute("class", "hidden scoring-card");
        jContainer.innerHTML = '<div class="menu-overlay"></div>';

        let div = document.createElement("div");
        div.setAttribute("class", "view-score-card fl");
        div.innerHTML = `<img src="/data/backside" data-image-backside="/data/backside">`;

        let view_score_container = document.createElement("div");
        view_score_container.setAttribute("class", "view-score-container blue-box");
        view_score_container.appendChild(div);
        
        let jContainerData = document.createElement("div");
        jContainerData.setAttribute("class", "container-data fl");

        {
            const _temp = document.createElement("h2");
            _temp.innerText = Dictionary.get("score_card", "Score Card")
            jContainerData.appendChild(_temp);
        }
        
        jContainerData.appendChild(this.createScoreCardTypes());
        jContainerData.appendChild(this.createScoreCardPoints());
       
        {
            const _temp = document.createElement("input");
            _temp.setAttribute("type", "button");
            _temp.setAttribute("class", "button");
            _temp.setAttribute("value", Dictionary.get("score_card", "Score Card"));
            jContainerData.appendChild(_temp);
        }      
        
        view_score_container.appendChild(jContainerData);

        {
            const _temp = document.createElement("div");
            _temp.setAttribute("class", "clear");
            view_score_container.appendChild(_temp);
        }
        
        jContainer.appendChild(view_score_container);

        document.body.appendChild(jContainer);

    }

    createScoreSheetEntries()
    {
        let jBody = document.createElement("tbody");
        this._props.forEach(function(entry)
        {
            const tr = document.createElement("tr");
            tr.setAttribute("data-score-type", entry.value);
            tr.innerHTML = `
                <th>${entry.label}</th>
                <td data-player="self">
                    <a href="#" data-score-action="increase" title="+1 ${Dictionary.get("score_point", "Point")}"><i class="fa fa-plus-square" title="increase" aria-hidden="true"></i></a>
                    <span>0</span>
                    <a href="#" data-score-action="decrease" title="-1 ${Dictionary.get("score_point", "Point")}"><i class="fa fa-minus-square" title="decrease" aria-hidden="true"></i></a>
                </td>`;

            jBody.appendChild(tr);
        });
        return jBody;
    }

    createScoreSheetTable()
    {
        let jTable = document.createElement("table");

        {
            let thead = document.createElement("thead");
            thead.innerHTML = "<tr><th></th><th>You</th></tr>";
            jTable.appendChild(thead)
        }
        
        jTable.appendChild(this.createScoreSheetEntries());

        {
            let tfoot = document.createElement("tfoot");
            tfoot.innerHTML = `<tr data-score-type="total" class="score-total">
                                    <th>Total</th>
                                    <th class="score-total" data-player="self">0</th>
                                </tr>
                                <tr>
                                    <th colspan="2" class="text-right">
                                        <input type="button" class="button buttonCancel" value="${Dictionary.get("cancel", "Cancel")}">
                                        <input type="button" class="button buttonUpdate" value="${Dictionary.get("score_update", "Update score")}">
                                    </th>
                                </tr>`;
            jTable.appendChild(tfoot);
        }
        
        return jTable;
    }

    createVictoryContainer()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "view-score-victory-container")
        div.setAttribute("id", "view-score-sheet-card-list");
        div.innerHTML = `<div class="view-card-list-container blue-box">
                            <div class="container-title-bar">
                                <div class="container-title-bar-title text-center smallCaps">${Dictionary.get("score_yours", "Your Victory Pile")}</div>
                                <div class="clear"></div>
                            </div>
                            <div class="container-data"></div>
                            <div class="clear"></div>
                        </div>`;
        return div;
    }

    createScoreSheetContainer()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "view-score-container blue-box")
        div.appendChild(this.createScoreSheetTable());
        return div;
    }

    createScoreSheet()
    {
        if (document.getElementById("scoring-sheet") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("id", "scoring-sheet");
        div.setAttribute("class", "hidden scoring-sheet");

        const _temp = document.createElement("div");
        _temp.setAttribute("class", "menu-overlay hidden");
        div.appendChild(_temp);
        div.appendChild(this.createScoreSheetContainer());       
        div.appendChild(this.createVictoryContainer());

        div.addEventListener("meccg-scoretable-close", SCORING.hideScoringSheet, false);

        document.body.appendChild(div);
    }
}

const SCORING_INGAME = 
{
    _props : null,
    _avatars: {},
    _scores: { },
    _hexIdMap : {},
    _names : {},
    _doubleMisc : true,
    oneRingUserid: "",

    removeInGame : function(sHexId)
    {
        const elem = document.getElementById("scoring-ingame-" + sHexId);
        if (elem === null)
            return;

        const id = elem.hasAttribute("data-player-id") ? elem.getAttribute("data-player-id") : "";
        DomUtils.remove(elem);
        if (id !== "" && SCORING_INGAME._scores[id] !== undefined)
            delete SCORING_INGAME._scores[id];

        if (id !== "" && SCORING_INGAME._hexIdMap[id] !== undefined)
            delete SCORING_INGAME._hexIdMap[id];
    },

    updateAvatars: function(avatars)
    {
        for (let id in avatars)
            this._avatars[id] = avatars[id];

        this.updateAvatarImages();
    },

    updateAvatarImages:function()
    {
        const table = document.getElementById("scoring-sheet-ingame");
        if (table === null)
            return;

        const list = table.getElementsByClassName("scoring-ingame-avatar");
        if (list === null || list.length === 0)
            return;

        for (let img of list)
        {
            const id = img.getAttribute("data-player-id");
            img.setAttribute("id", "score-avatar-image-" + id);
            img.setAttribute("src", SCORING_INGAME.getAvatar(id));
        }
    },

    getFirstCharacter : function(text)
    {
        if (typeof text === "string" && text.length > 0)
            return text.substring(0, 1).toUpperCase();
        else
            return "-";
    },

    buildScoreCellMap : function(tr)
    {
        const list = tr.getElementsByTagName("td");
        if (list === null || list.length === 0)
            return {};

        const map = {};
        for (let td of list)
        {
            const type = td.hasAttribute("data-score-type") ? td.getAttribute("data-score-type") : "";
            const span = type === "" ? null : td.querySelector("span");
            const strong = type === "" ? null : td.querySelector("strong");
            if (span !== null && strong !== null)
            {
                map[type] = {
                    td: td,
                    value: span,
                    usable: strong
                };
            }
        }

        return map;
    },

    updateCount : function(elem, value)
    {
        if (value < 0 || elem === null)
            return;
        
        if (elem.innerText + "" !== "" + value)
            elem.innerText = "" + value;
    },

    buildFinalScores_tableHead : function()
    {
        const images = document.createElement("tr");
        const names = document.createElement("tr");
        
        images.append(document.createElement("td"));

        const tdPoints = document.createElement("th");
        tdPoints.innerText = Dictionary.get("score.category", "Category");
        names.append(tdPoints);
        
        for (let id in SCORING_INGAME._scores)
        {
            const img = document.createElement("img");
            img.setAttribute("src", SCORING_INGAME.getAvatar(id));
            img.setAttribute("class", "scoring-ingame-avatar");
            const td1 = document.createElement("td");
            td1.setAttribute("class", "image");
            td1.append(img);
            images.append(td1);

            if (id === this.oneRingUserid)
                td1.classList.add("one-ring-victory");

            const td2 = document.createElement("th");
            td2.innerText = SCORING_INGAME._names[id] ? SCORING_INGAME._names[id] : "";
            names.append(td2);
        }

        const res = document.createDocumentFragment();
        res.append(images, names);
        return res;
    },

    buildFinalScores_tableRows_map : function()
    {
        const ptsByCategory = {};

        for (let id in SCORING_INGAME._scores)
        {
            for (let category in SCORING_INGAME._scores[id])
            {
                if ("malus" !== category && SCORING.ignoreCategory(category))
                    continue;
                
                const tr = document.createElement("tr");
                const th = document.createElement("th");
                tr.appendChild(th);
                th.innerText = category;
                ptsByCategory[category] = tr;
            }

            break;
        }

        return ptsByCategory;
    },

    buildFinalScores_tableRows_cell : function(value, usable, isCut, hideZero)
    {
        const td = document.createElement("td");
        if (isCut)
            td.setAttribute("class", "score-is-cut");

        const span = document.createElement("span");
        span.innerText = value == 0 && hideZero ? "-" : value;

        const strong = document.createElement("strong");
        strong.innerText = usable == 0 && hideZero ? "-" : usable;

        td.append(span, strong);
        return td;
    },

    buildFinalScores_tableRows : function()
    {
        const map = this.buildFinalScores_tableRows_map();
        const totalsRow = document.createDocumentFragment();

        let listPoints = [];

        for (let id in SCORING_INGAME._scores)
        {
            const score = SCORING_INGAME._scores[id];

            let total = 0;
            let totalUsed = 0;
            let totalMalus = 0;

            for (let category in score)
            {
                let thisMalus = 0;

                const _score = score[category];
                if (category === "malus" && _score.value)
                {
                    thisMalus = parseInt(_score.value);
                    totalMalus = thisMalus;
                }

                if (thisMalus === 0 && SCORING.ignoreCategory(category))
                    continue;

                if (thisMalus === 0)
                {
                    const usable = _score.double ? _score.usable * 2 : _score.usable;
                    const isCut = _score.value !== usable;
                    map[category].append(this.buildFinalScores_tableRows_cell(_score.value, usable, isCut, true));

                    total += parseInt(_score.value);
                    totalUsed += parseInt(usable);
                }
                else
                    map[category].append(this.buildFinalScores_tableRows_cell(-1 * thisMalus, -1 * thisMalus, false, true));
            }

            total -= totalMalus;
            totalUsed -= totalMalus;

            listPoints.push(totalUsed);
            totalsRow.appendChild(this.buildFinalScores_tableRows_cell(total, totalUsed, total !== totalUsed, false));
        }

        return { 
            list: map,
            total: totalsRow,
            arrayPoints: this.calculateTournamentPoints(listPoints)
        };
    },

    calculateTournamentPoints : function(list)
    {
        if (list.length !== 2 || SCORING.oneRingWinnerUserid)
            return [];

        const a = list[0];
        const b = list[1];

        if (a === b)
        {
            return [3,3];
        }
        else if (a >= b * 2)
        {
            return [6,0];
        }
        else if (b >= a * 2)
        {
            return [0, 6];
        }
        else if (a >= Math.round(b * 1.5))
        {
            return [5, 1];
        }
        else if (b >= Math.round(a * 1.5))
        {
            return [1, 5];
        }
        else if (a > b)
        {
            return [4, 2];
        }
        else
            return [2, 4];
    },

    buildFinalScores : function(oneRingWinnerUserid = "")
    {
        if (oneRingWinnerUserid)
            this.oneRingUserid = oneRingWinnerUserid;

        const list = this.buildFinalScores_tableHead();
        const map = this.buildFinalScores_tableRows();

        const thead = document.createElement("thead");
        thead.append(list);

        const tbody = document.createElement("tbody");
        for (let category in map.list)
            tbody.append(map.list[category]);

        const tfoot = this.buildFinalScores_tableFooter(map);

        const table = document.createElement("table");
        table.append(thead, tbody, tfoot);
        table.setAttribute("class", "final-score-table");
        table.setAttribute("id", "final-score-table");
        
        return table;
    },

    buildFinalScores_tableFooter : function(map)
    {
        const thFinal = document.createElement("th");
        thFinal.innerText = "total";
        
        const tfootTR = document.createElement("tr");
        tfootTR.append(thFinal, map.total);

        const tfoot = document.createElement("tfoot");
        tfoot.append(
            tfootTR, 
            this.createListTRPoints(map.arrayPoints),
            this.prepareTurnStats()
        );

        return tfoot;
    },

    createSimpleNodeElement : function(type, value, id)
    {
        const elem = document.createElement(type);
        elem.innerText = value;

        if (typeof id === "string" && id !== "")
            elem.setAttribute("id", id);

        return elem;
    },

    prepareTurnStats:function()
    {
        const turnTimeTotal = document.createElement("tr");
        const turnTimeAverage = document.createElement("tr");

        turnTimeTotal.appendChild(this.createSimpleNodeElement("th", Dictionary.get("score_avg_turntime_total", "Total Turn Time"), ""));
        turnTimeAverage.appendChild(this.createSimpleNodeElement("th", Dictionary.get("score_avg_turntime", "Avg. Turn Time"), ""));

        const idPrefixTotal = "final-score-time-total-";
        const idPrefixAverage = "final-score-time-avg-";

        for (let id in SCORING_INGAME._scores)
        {
            turnTimeTotal.appendChild(this.createSimpleNodeElement("td", "-", idPrefixTotal + id));
            turnTimeAverage.appendChild(this.createSimpleNodeElement("td", "-", idPrefixAverage + id));
        }

        const result = document.createDocumentFragment();
        result.append(turnTimeTotal, turnTimeAverage);
        return result;
    },

    createListTRPoints:function(list)
    {
        if (list.length !== 2)
            return document.createDocumentFragment();

        const th = document.createElement("th");
        th.innerText = Dictionary.get("score_tournament", "Tournament");

        const tr = document.createElement("tr");
        tr.appendChild(th);
        for (let elem of list)
        {
            const td1 = document.createElement("td");
            td1.innerText = elem;
            tr.appendChild(td1);
        }

        return tr;
    },

    updateInGameScore : function(tr, score)
    {
        const fields = this.buildScoreCellMap(tr);
        
        let total = 0;
        let totalUsed = 0;
        let totalMalus = 0;

        for (let id in score)
        {
            const td = fields[id];
            if (td === undefined)
            {
                console.warn("cannot find table cell " + id);
                continue;
            }

            const _score = score[id];
            if (id === "malus" && _score.value)
                totalMalus = _score.value;   

            const ignoreCount = SCORING.ignoreCategory(id);
            const usable = _score.double && !ignoreCount ? _score.usable * 2 : _score.usable;
            const isCut = _score.value !== usable || _score.double;

            this.updateCount(td.value, _score.value, isCut);
            this.updateCount(td.usable, usable, isCut);

            if (isCut && !ignoreCount)
                td.td.classList.add("score-is-cut");
            else if (td.td.classList.contains("score-is-cut"))
                td.td.classList.remove("score-is-cut");

            if (!ignoreCount)
            {
                total += parseInt(_score.value);
                totalUsed += parseInt(usable);
            }
        }

        this.updateInGameScoreCutsFinal(tr, totalUsed, total, totalMalus);
    },

    updateInGameScoreCutsFinal : function(tr, totalUsed, total, malus = 0)
    {
        const vpClasses = tr.getElementsByClassName("final-score");
        if (vpClasses === null || vpClasses.length === 0)
            return;

        const th = vpClasses[0];
        
        const _span = th.querySelector("span");
        if (_span != null)
            _span.innerText = total - malus;

        const _strong = th.querySelector("strong");
        if (_strong != null)
            _strong.innerText = totalUsed - malus;
        
        if (totalUsed != total)
            th.classList.add("score-is-cut");
        else if (th.classList.contains("score-is-cut"))
            th.classList.remove("score-is-cut");
    },

    calculateTotals : function(score)
    {
        let sum = 0;
        let catcount = 0;
        let highestValue = 0;

        const total = {
            category: "",
            count: 0
        };

        for (let id in score)
        {
            const val = SCORING.ignoreCategory(id) ? 0 : score[id];
            if (val < 1)
                continue;

            const num = parseInt(val);

            catcount++;
            sum += num;

            if (highestValue < num)
            {
                highestValue = num;
                total.category = id;
                total.count = num;
            }
        }

        const others = sum - highestValue;
        if (catcount < 2 || highestValue <= others)
        {
            total.category = "";
            return total;
        }

        /**
         * at this point, we know that there is one category that has more points than the total of the rest combined. 
         * therefore, that particular category has to be reduced accordingly.
         */
        total.count = others;
        return total;
    },

    calculateHalves : function(score)
    {
        const result = {};
        const total = this.calculateTotals(score);
        for (let id in score)
        {
            result[id] = {
                value: score[id],
                usable: total.category === id ? total.count : score[id],
                double: false
            } 
        }

        return result;
    },

    getRowMap : function()
    {
        const table = document.getElementById("scoring-sheet-ingame");
        if (table === null)
            return { };

        const rows = {};
        for (let id in SCORING_INGAME._scores)
        {
            const tr = table.querySelector(`tr[data-player-id="${id}"]`);
            if (tr !== null)
                rows[id] = tr;
        }

        return rows;
    },

    updatedStoredData : function(list)
    {
        for (let scores of list)
        {
            const id = scores.id;
            SCORING_INGAME._scores[id] = this.calculateHalves(scores.scores);
        }
    },

    doUpdateInGameScores : function()
    {
        const rows = this.getRowMap();
        for (let id in SCORING_INGAME._scores)
        {
            const tr = rows[id] === undefined ? null : rows[id];
            if (tr !== null)
                this.updateInGameScore(tr, SCORING_INGAME._scores[id]);
        }
    },

    createDoubleCalculationMap : function()
    {
        const ptsByCategory = {};

        for (let id in SCORING_INGAME._scores)
        {
            if (SCORING.ignoreCategory(id))
                continue;

            for (let category in SCORING_INGAME._scores[id])
                ptsByCategory[category] = 0;

            break;
        }

        if (ptsByCategory["kill"] !== undefined)
            delete ptsByCategory["kill"];

        if (!this._doubleMisc && ptsByCategory["misc"] !== undefined)
            delete ptsByCategory["misc"];

        return ptsByCategory;
    },

    calculateDoubles : function()
    {
        const ids = Object.keys(SCORING_INGAME._scores);
        if (ids.length < 2)
            return;

        const ptsByCategory = this.createDoubleCalculationMap();
        for (let id of ids)
        {
            if (SCORING.ignoreCategory(id))
                continue;

            const score = SCORING_INGAME._scores[id];
            for (let category in score)
            {
                if (score[category].value > 0)
                    ptsByCategory[category]++;
            }
        }

        for (let id of ids)
        {
            const score = SCORING_INGAME._scores[id];
            for (let category in score)
                score[category].double = score[category].value > 0 && ptsByCategory[category] === 1;
        }
    },

    updateInGameScores : function(list)
    {
        if (!Array.isArray(list) || list.length === 0)
            return;
        
        this.updatedStoredData(list);
        this.calculateDoubles();
        this.doUpdateInGameScores();
    },

    setDoubleMisc(bDouble)
    {
        this._doubleMisc = bDouble === true;
        this.calculateDoubles();
        this.doUpdateInGameScores();
    },

    getPlayerTitle(name, id)
    {
        if (this._avatars[id] === undefined || this._avatars[id] === "")
            return name;
        else 
            return name + ", " + this._avatars[id];
    },

    getAvatar: function(id)
    {
        if (this._avatars[id] === undefined || this._avatars[id] === "")
            return g_Game.CardList.getBackside();
        else
            return g_Game.CardList.getImage(this._avatars[id]);
    },

    registerAvatar: function(id, code, force)
    {
        if (this._avatars[id] === undefined || force === true)
            this._avatars[id] = code;
    },

    addInGame : function(sName, _playerId, sHexId, isMe)
    {
        if (document.getElementById("scoring-ingame-" + sHexId) !== null)
            return;

        SCORING_INGAME._names[_playerId] = sName;

        const table = document.getElementById("scoring-sheet-ingame");
        if (table === null)
            return;

        const tbody = table.querySelector("tbody");
        if (tbody === null)
            return;

        SCORING_INGAME._hexIdMap[_playerId] = sHexId;

        const tr = document.createElement("tr");

        tr.setAttribute("id", "scoring-ingame-" + sHexId);
        tr.setAttribute("data-hex", sHexId);
        tr.setAttribute("data-player-id", _playerId);

        let th1 = document.createElement("td");
        tr.appendChild(th1)
        th1.setAttribute("class", "avatar");
        th1.setAttribute("title", sName);

        const img = document.createElement("img");
        img.setAttribute("src", SCORING_INGAME.getAvatar(_playerId));
        img.setAttribute("class", "scoring-ingame-avatar");
        img.setAttribute("title", SCORING_INGAME.getPlayerTitle(sName, _playerId));
        img.setAttribute("data-player-id", _playerId);

        const divAvatar = document.createElement("div");
        divAvatar.setAttribute("class", "avatar");

        divAvatar.appendChild(img);
        th1.appendChild(divAvatar);

        if (isMe)
        {
            th1.classList.add("scoring-ingame-avatar-clickable");
            th1.setAttribute("title", Dictionary.get("score_click_changeavatar", "Click to change your avatar"));
            th1.onclick = () => MeccgApi.send("/game/character/list");

            img.setAttribute("class", "scoring-ingame-avatar");
            img.setAttribute("title", Dictionary.get("score_click_changeavatar", "Click to change your avatar"));

            const linkChange = document.createElement("span");
            linkChange.setAttribute("class", "link-change fa fa-pencil-square");
           
            th1.append(linkChange);
        }
        else
        {
            img.setAttribute("class", "scoring-ingame-avatar");
        }


        this._props.forEach(function(entry)
        {
            if (entry.label.length === 0)
                return;
            
            const td = document.createElement("td");
            tr.appendChild(td);
            td.setAttribute("class", "scoring-sheet-ingame-collapse");
            td.setAttribute("data-score-type", entry.value);

            if (isMe)
            {
                const aP = document.createElement("a");
                aP.setAttribute("href", "#");
                aP.setAttribute("data-score-action", "increase");
                aP.setAttribute("title", "+1 MP - " + entry.label);
                aP.onclick = SCORING_INGAME.onClickIncrease;
                aP.innerHTML = `<i class="fa fa-plus-square" aria-hidden="true"></i>`;

                const span = document.createElement("span");
                span.innerText = "0";

                const strong = document.createElement("strong");
                strong.innerText = "0";

                const aM = document.createElement("a");
                aM.setAttribute("href", "#");
                aM.setAttribute("data-score-action", "decrease");
                aM.setAttribute("title", "-1 MP - " + entry.label);
                aM.onclick = SCORING_INGAME.onClickDecrease;
                aM.innerHTML = `<i class="fa fa-minus-square" aria-hidden="true"></i>`;

                td.append(aP, span, strong, aM);
            }
            else
            {
                const span = document.createElement("span");
                span.innerText = "0";

                const strong = document.createElement("strong");
                strong.innerText = "0";

                td.append(span, strong);
            }
        });

        th1 = document.createElement("td");
        tr.appendChild(th1)
        
        th1.setAttribute("class", "final-score");
        
        {
            const span = document.createElement("span");
            span.innerText = "0";

            const strong = document.createElement("strong");
            strong.innerText = "0";

            th1.append(span, strong);
        }

        if (isMe)
            tbody.prepend(tr);
        else
            tbody.appendChild(tr);
    },

    onUpdateValue : function(link, nDif)
    {
        const td = link.parentNode;
        const span = td == null ? null : td.querySelector("span");
        if (span === null || !td.hasAttribute("data-score-type"))
            return;

        const val = parseInt(span.innerText);
        const res = isNaN(val) ? -1 : val + nDif;
        if (res < 0)
            return;

        span.innerText = res;

        MeccgApi.send("/game/score/set", { type: td.getAttribute("data-score-type"), points: res });
    },

    onClickDecrease: function(e)
    {
        SCORING_INGAME.onUpdateValue(this, -1);
        e.preventDefault();
        return false;
    },

    onClickIncrease: function(e)
    {
        SCORING_INGAME.onUpdateValue(this, 1);
        e.preventDefault();
        return false;
    },

    toggleSize : function()
    {
        const elem = document.getElementById("scoring-sheet-ingame");
        if (elem !== null)
            elem.classList.toggle("scoring-sheet-ingame-collapsed");
    },

    createWrapper : function()
    {
        const isSingle = document.body.getAttribute("data-is-singleplayer") === "true";
        const isArda = document.body.getAttribute("data-game-arda") === "true";

        const div = document.createElement("div");
        div.setAttribute("id", "scoring-sheet-ingame");
        div.setAttribute("class", "scoring-sheet-ingame blue-box");

        if (isArda)
            div.classList.add("scoring-arda");
        else if (isSingle)
            div.classList.add("scoring-single");

        return div;
    },

    init: function(props)
    {
        if (document.getElementById("scoring-sheet-ingame") !== null)
            return;

        const div = SCORING_INGAME.createWrapper();
        if (div === null)
            return;

        this._props = props;
        const jTable = document.createElement("table");
        div.appendChild(jTable);
        {
            const thead = document.createElement("thead");
            const tbody = document.createElement("tbody");

            jTable.appendChild(thead);
            jTable.appendChild(tbody);

            const tr = document.createElement("tr");
            thead.appendChild(tr);
            const th1 = document.createElement("th");
            
            const div_close = document.createElement("div");
            div_close.setAttribute("class", "ingame-icon-openclose scoring-sheet-ingame-icon-openclose");
            div_close.onclick = SCORING_INGAME.toggleSize.bind(SCORING_INGAME);
            th1.appendChild(div_close);
            
            tr.appendChild(th1);

            this._props.forEach(function(entry)
            {
                if (entry.label.length === 0)
                    return;
                
                const th = document.createElement("th");
                th.setAttribute("title", entry.value);
                th.setAttribute("class", "scoring-sheet-ingame-collapse")

                const spanLetter = document.createElement("span");
                spanLetter.setAttribute("class", "score-letter");
                const icon = entry.icon && entry.icon !== "" ? entry.icon : "";
                if (icon === "")
                {
                    spanLetter.innerText = SCORING_INGAME.getFirstCharacter(entry.label);
                }
                else
                {
                    const imgIcon = document.createElement("img");
                    imgIcon.setAttribute("src", icon);
                    spanLetter.append(imgIcon);
                }

                const spanWord = document.createElement("div");
                spanWord.setAttribute("class", "score-word");
                spanWord.innerText = entry.label;

                th.append(spanLetter, spanWord);
                tr.appendChild(th);
            });

            const sum = document.createElement("th");
            sum.setAttribute("class", "final-score");
            sum.innerHTML = "&sum;";
            tr.appendChild(sum);
        }
        
        document.body.appendChild(div);
    }
}

const SCORING = {
        
    stats : { },
    ignore: [],
    cardList : null,
    oneRingWinnerUserid: "",
    
    _resetStats : function()
    {
        for (let k in SCORING.stats)
        {
            if (SCORING.stats.hasOwnProperty(k))
                SCORING.stats[k] = 0;
        }
    },

    ignoreCategory:function(id)
    {
        return id !== "" && SCORING.ignore.includes(id);
    },

    _createStatsMap : function(categories)
    {
        categories.forEach((entry) => { 
            SCORING.stats[entry.value] = 0;

            if (entry.ignorecount)
                SCORING.ignore.push(entry.value);
        });
    },

    _init : function(categories, min, max)
    {
        new ScoringContainers(categories, min, max).create();
        SCORING_INGAME.init(categories);

        this._createStatsMap(categories);

        if (document.getElementById("scoring-card") !== null)
        {
            const elem = document.getElementById("scoring-card");
            elem.querySelector(".menu-overlay").onclick = SCORING.hideScoringCard;
            elem.querySelector(".button").onclick = SCORING.onStoreCard;
        }

        if (document.getElementById("scoring-sheet") !== null)
        {
            const elem = document.getElementById("scoring-sheet");
            elem.querySelector(".menu-overlay").onclick = SCORING.hideScoringSheet;
            elem.querySelector(".buttonUpdate").onclick = SCORING.onStoreSheet;
            elem.querySelector(".buttonCancel").onclick = SCORING.hideScoringSheet;
            
            ArrayList(elem).find("table tbody tr a").each((_elem) => _elem.onclick = SCORING.onChangeScoreValue);
        }
    },
    
    hideScoringCard : function()
    {
        document.getElementById("scoring-card").classList.add("hidden");
        ArrayList(document.getElementById("view-score-sheet-card-list")).findByClassName(".container-data").each(DomUtils.empty);
        ArrayList(document.getElementById("scoring-card")).findByClassName(".score-type").each((_elem) => _elem.classList.remove("req"));
        ArrayList(document.getElementById("scoring-card")).findByClassName(".score-points").each((_elem) => _elem.classList.remove("req"));
    },
    
    hideScoringSheet : function()
    {
        const sheet = document.getElementById("scoring-sheet");
        if (!sheet.classList.contains("final-score"))
        {
            sheet.classList.add("hidden");
            ArrayList(sheet).find("span").each((_el) => _el.innerText = "0");
        }
    },
    
    displayCard : function(sCode)
    {
        const elem = document.getElementById("scoring-card").querySelector("img");
        elem.setAttribute("src", SCORING.cardList.getImage(sCode));
    },
    
    onStoreCard : function()
    {
        let sType = SCORING.getCurrentSelectValue("score_type");
        let nPoints = parseInt(SCORING.getCurrentSelectValue("score_points"));
        
        SCORING.hideScoringCard();
        MeccgApi.send("/game/score/add", { type: sType, points: nPoints });
    },
    
    getCurrentSelectValue : function(sName)
    {
        let val = "";

        ArrayList(document.getElementById("scoring-card")).find('input[name="' + sName + '"]').each((_el) => {

            if (_el.checked)
                val = _el.value;
        })
        
        return val === null ? "" : val;
    },

    sendScoreCard : function(sCardCode, isDefault)
    {
        fetch("/data/marshallingpoints?code=" + encodeURI(sCardCode) + "&standard=" + isDefault)
        .then((response) => response.json())
        .then((data) => 
        {
                let elem;
                const points = data.points && data.points >= 0 ? data.points : 0;
                elem = document.getElementById("score_" + points + "_points");
                if (elem !== null)
                    elem.click();

                const kat = data.type && data.type !== "" ? data.type : "misc";
                elem = document.getElementById("score_" + kat + "_label");
                if (elem !== null)
                    elem.click();
        })
        .catch(() => { /** ignore error */});
    },
    
    scoreCard : function(sCardCode)
    {
        if (sCardCode === "" || typeof sCardCode === "undefined")
            return;
        
        this.displayCard(sCardCode);
        this._clickDefault("score-type-choose");
        this._clickDefault("score-points-choose");
        
        document.getElementById("scoring-card").classList.remove("hidden");

        const isDefault = document.body.getAttribute("data-game-arda") !== "true" ? "true" : "false";
        this.sendScoreCard(sCardCode, isDefault);
    },

    _clickDefault : function(id)
    {
        let elem = document.getElementById(id);
        if (elem === null)
            return;

        const sId1 = elem.getAttribute("default-id");
        if (sId1 !== null && sId1 !== "")
            document.getElementById(sId1).dispatchEvent(new Event("click"));
    },

    _getTargetCell(jTable, type, player)
    {
        if (type === undefined || player === undefined || type === "" || player === "" || player === null || type === null)
            return null;
    
        const elem = jTable.querySelector('tr[data-score-type="'  + type + '"]');
        if (elem === null)
        {
            console.warn("Cannot obtain cell of type " + type);
            return null;
        }
        
        const cell = elem.querySelector('td[data-player="'+player+'"]');
        if (cell === null)
        {
            console.warn("Cannot obtain cell of type " + type + " for player " + player);
            return null;
        }
        else
            return cell;
    },

    scoreSheetUpdateTable(jData, jTable)
    {
        if (jTable === null)
            return;

        const trScoreTotal = document.getElementById("scoring-sheet").querySelector("tr.score-total");
        for (let key in jData)
        {
            const count = this.scoreSheetUpdateTableOnPlayer(jTable, jData, key);
            
            const elem = trScoreTotal.querySelector('th[data-player="'+count.player+'"]');
            if (elem !== null)
                elem.innerText = count.total;
        }
    },

    scoreSheetUpdateTableOnPlayer : function(jTable, jData, key)
    {
        let _elem;
        let total = 0;
        const player = MeccgPlayers.isChallenger(key) ? "self" : key;
        for (let type in jData[key])
        {
            _elem = this._getTargetCell(jTable, type, player);
            if (_elem !== null && player === "self")
                _elem = _elem.querySelector("span");
            
            if (_elem !== null)
            {
                _elem.innerText = jData[key][type];

                if (!SCORING.ignoreCategory(type))
                    total += jData[key][type];
            }
        }

        return {
            player: player,
            total: total
        };
    },
    
    _showScoreSheet : function(jData, bAllowUpdate)
    {
        if (typeof jData === "undefined")
            return;
            
        const jTable = document.getElementById("scoring-sheet").querySelector("tbody");
        this.scoreSheetUpdateTable(jData, jTable);

        if (!bAllowUpdate)
            this.removeUpdateFunctionality();
        
        document.getElementById("scoring-sheet").classList.remove("hidden");
    },

    _showShutdownNotice: function()
    {
        if (document.getElementById("disconnection-notice") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("id", "disconnection-notice");
        div.setAttribute("class", "disconnection-notice");

        const h2 = document.createElement("h2");
        h2.innerText = Dictionary.get("score_autodisconnect", "Automatic disconnect");

        const p = document.createElement("p");
        p.innerText = Dictionary.get("score_reboot", "The server rebooted automatically (scheduled).");

        div.appendChild(h2);
        div.appendChild(p);
        
        const elem = document.getElementById("scoring-sheet").querySelector(".view-score-container");
        elem.prepend(div);
    },

    removeUpdateFunctionality()
    {
        const elem = document.getElementById("scoring-sheet");
        if (elem === null)
            return;

        document.body.classList.add("final-score-page");
        elem.classList.add("final-score");
        DomUtils.remove(document.getElementById("view-score-sheet-card-list"));

        const overlay = elem.querySelector(".menu-overlay");
        overlay.classList.remove("hidden");
        overlay.onclick = () => { return false; };

        const table = elem.querySelector(".view-score-container");
        if (table === null || table.querySelector(".return-to-lobby") !== null)
            return;

        const a = document.createElement("a");
        a.setAttribute("href", "/");
        a.setAttribute("title", Dictionary.get("score_leavetolobby", "Leave game and return to lobby"));
        a.innerText = Dictionary.get("score_returntolobbdy", "Return to lobby.");

        const p = document.createElement("p");
        p.appendChild(a);
        p.classList.add("center");
        p.classList.add("return-to-lobby");

        table.appendChild(p);

        this.appendSavegameInfo(table);
    },

    appendSavegameInfo(table)
    {
        if (typeof SavedGameManager === "undefined" || !SavedGameManager.hasAutoSave())
            return;

        const a = document.createElement("a");
        a.innerText = " " + Dictionary.get("score_autosave", "Save last autosave to disk");
        a.setAttribute("href", "#");
        a.setAttribute("title", Dictionary.get("score_autosave", "Save last autosave to disk"));
        a.setAttribute("class", "fa fa-floppy-o");
        a.onclick = () => {
            document.body.dispatchEvent(new CustomEvent("meccg-game-save-auto-to-disk", { "detail": "Store." }));
            return false;
        }

        const p = document.createElement("p");
        p.appendChild(a);
        p.classList.add("center");
        p.classList.add("result-autosave");

        table.appendChild(p);
    },

    
    showScoreSheetCards : function(listCards)
    {
        if (typeof listCards !== "undefined" && listCards.length > 0)
            document.body.dispatchEvent(new CustomEvent("meccg-show-victory-sheet", { "detail": listCards }));
    },

    showScoreSheet : function(jData)
    {
        this._showScoreSheet(jData, true, "");
    },

    setOneRingWinnder : function(userid)
    {
        if (userid)
            SCORING.oneRingWinnerUserid = userid;
    },
    
    showFinalScore : function(stats, automaticShutdown)
    {
        const div = document.getElementById("scoring-sheet");
        if (div === null)
            return;

        const jTable = div.querySelector(".view-score-container");
        DomUtils.empty(jTable);
        jTable.appendChild(SCORING_INGAME.buildFinalScores(SCORING.oneRingWinnerUserid));

        this.removeUpdateFunctionality();

        if (automaticShutdown)
            this._showShutdownNotice();

        div.classList.remove("hidden");
        document.body.dispatchEvent(new CustomEvent("meccg-dice-stats", { "detail": stats }));
    },

    showScoreSheetWatch : function(jData)
    {
        this._showScoreSheet(jData, false, ""); 
        document.getElementById("scoring-sheet").querySelector(".menu-overlay").onclick = function()
        {
            const sheet = document.getElementById("scoring-sheet");
            sheet.classList.add("hidden");
            ArrayList(sheet).find("span").each((_el) => _el.innerText = "0");
        }
    },

    _updateStats : function(type, points)
    {
        if (typeof points !== "undefined" && SCORING.stats[type] !== undefined)
            SCORING.stats[type] = points;
    },
    
    onStoreSheet : function()
    {
        SCORING._resetStats();
        
        const sheet = document.getElementById("scoring-sheet");
        ArrayList(sheet).find('td[data-player="self"]').each((elem) =>
        {
            const nScore = parseInt(elem.querySelector("span").innerText);
            const type = elem.parentNode.getAttribute("data-score-type");
            SCORING._updateStats(type, nScore);
        });
        
        SCORING.hideScoringSheet();
        MeccgApi.send("/game/score/update", SCORING.stats);
    },
    
    onChangeScoreValue : function(e)
    {
        const bAdd = this.getAttribute("data-score-action") === "increase";
        let jSpan = this.parentNode.querySelector("span"); 
        const nCount = parseInt(jSpan.innerText) + (bAdd ? 1 : -1);
        jSpan.innerText = nCount;
        
        const category = e.target.parentElement?.parentElement?.parentElement?.getAttribute("data-score-type");
        const ignore = typeof category === "string" && SCORING.ignoreCategory(category);
        if (!ignore)
        {
            jSpan = document.getElementById("scoring-sheet").querySelector("th.score-total");
            if (jSpan)
                jSpan.innerText = parseInt(jSpan.innerText) + (bAdd ? 1 : -1);
        }

        e.preventDefault();
        e.stopPropagation();
        return false;
    },
    
    addPlayers : function(sMyId, jMap)
    {
        for (let _playerId in jMap)
        {
            if (sMyId !== _playerId)
                SCORING.addPlayer(_playerId, jMap[_playerId]);
        }
    },

    isAvailable : function(sPlayerId, jTable)
    {
        if (jTable === null || sPlayerId === null || sPlayerId === "")
            return false;

        let tRow = jTable.querySelector("thead tr");
        if (tRow === null)
            return false;
        else
            return tRow.querySelector('th[data-player="'+sPlayerId+'"]') !== null;
    },
    
    addPlayer : function(sPlayerId, sName)
    {
        let jTable = document.getElementById("scoring-sheet").querySelector("table");

        if (SCORING.isAvailable(sPlayerId, jTable))
            return;
        
        let th = document.createElement("th");
        th.setAttribute("data-player", sPlayerId);
        th.innerText = sName;
        jTable.querySelector("thead tr").appendChild(th);

        ArrayList(jTable.querySelector("tbody")).find("tr").each(function(_tr)
        {
            const elem = document.createElement("td");
            elem.setAttribute("data-player", sPlayerId);
            elem.innerText = "0";
            _tr.appendChild(elem)
        });

        th = document.createElement("th");
        th.setAttribute("data-player", sPlayerId);
        th.innerText = "0";
        jTable.querySelector("tfoot").querySelector("tr.score-total").appendChild(th);
    },
};

document.body.addEventListener("meccg-players-updated", (e) => 
{
    SCORING.addPlayers(e.detail.challengerId, e.detail.map)
    SCORING_INGAME.updateAvatars(e.detail.avatars);
}, false);

document.body.addEventListener("meccg-register-avatar", (e) => 
{
    SCORING_INGAME.registerAvatar(e.detail.userid, e.detail.code, e.detail.force === true);
    SCORING_INGAME.updateAvatarImages();
},  false);

document.body.addEventListener("meccg-score-card", (e) => SCORING.scoreCard(e.detail), false);

const SCORE_API = {

    addInGame: function(sName, _playerId, sHexId, isMe)
    {
        SCORING_INGAME.addInGame(sName, _playerId, sHexId, isMe);
    },

    removeInGame: function(sHexId)
    {
        SCORING_INGAME.removeInGame(sHexId);
    },

    addPlayers: function(sMyId, jNameMap)
    {
        SCORING.addPlayers(sMyId, jNameMap);
    },

    updateInGameScores : function(list)
    {
        SCORING_INGAME.updateInGameScores(list);
    },

    setDoubleMisc : function(bDouble)
    {
        SCORING_INGAME.setDoubleMisc(bDouble);
    },

    showScoreSheet : function(jData)
    {
        SCORING.showScoreSheet(jData);
    },

    showScoreSheetWatch : function(jData)
    {
        SCORING.showScoreSheetWatch(jData);
    },

    showScoreSheetCards : function(jData)
    {
        SCORING.showScoreSheetCards(jData);
    },

    showFinalScore: function(stats, automaticShutdown)
    {
        SCORING.showFinalScore(stats, automaticShutdown);
    },

    setOneRingWinnder: function(userid)
    {
        SCORING.setOneRingWinnder(userid);
    }
};

function createScoringApp(_CardList)
{
    SCORING.cardList = _CardList;
       
    const extractCategories = function(categories)
    {
        const isExtended = "true" === document.body.getAttribute("data-game-arda");
        let res = [];

        for (let _item of categories)
        {
            if (!_item.extended || (isExtended && _item.extended))
                res.push(_item);
        }
    
        return res;
    };

    fetch("/data/scores?t="+Date.now())
    .then((response) => response.json())
    .then((data) => 
    {
        if (typeof data !== "undefined" && typeof data.categories !== "undefined" && typeof data.points !== "undefined")
            SCORING._init(extractCategories(data.categories), data.points.min, data.points.max);
    })
    .catch((err) => 
    {
        MeccgUtils.logError(err);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("score_couldnotfetch", "Could not fetch scores.") }));
    });

    return SCORE_API;
}

(function()
{
    const styleSheet = document.createElement("link")
    styleSheet.setAttribute("rel", "stylesheet");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("href", "/dist-client/css/score.css?t=" + Date.now());
    document.head.appendChild(styleSheet);
})();