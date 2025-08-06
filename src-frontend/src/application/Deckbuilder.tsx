import { Alert, AppBar, Button, Checkbox, FormControlLabel, FormGroup, Grid, List, ListItem, ListItemIcon, ListItemText, Snackbar, TextField, Typography } from "@mui/material";
import React from "react";
import CachedIcon from '@mui/icons-material/Cached';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Dictionary from "../components/Dictionary";
import MeccgLogo from "../components/MeccgLogo";
import ViewCardBrowser, { GetCardImage, SeachResultEntry, copyCode } from "../components/ViewCards";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import FetchCards, { CardData } from "../operations/FetchCards";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import BackHandIcon from '@mui/icons-material/BackHand';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MapIcon from '@mui/icons-material/Map';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import SaveIcon from '@mui/icons-material/Save';
import StyleIcon from '@mui/icons-material/Style';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import RenderCardPreview, { GetImagePreviewData, ImagePreviewInfo } from "../components/CardZoom";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SaveDeckDialog from "../components/SaveDeckAsDialog";
import ExploreDeckData from "../operations/ExploreDeckData";
import { GetCardByCode, InitCustomDeck } from "../components/CustomDeckInput";
import GetImageUri, { FetchFrenchImageUrl } from "../operations/GetImageUrlByLanguage";
import { DeckPart, DeckCountMap, Deck, Deckentry, DeckCardsEntry } from "./Types";
import calculateDreamcards, { DreamCardsLegalInfo } from "../components/DeckLagality";
import { CheckCircle, Help, StopCircle } from "@mui/icons-material";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const swapImage = function (id: string) {
    const elem = document.getElementById(id);
    if (elem === null)
        return;

    const src = elem.getAttribute("src");
    const flip = elem.getAttribute("data-flip");

    if (flip !== null && src !== null && flip !== "" && src !== "") {
        elem.setAttribute("src", flip);
        elem.setAttribute("data-flip", src);
    }
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            {...other}
        >
            {value === index && <Paper elevation={1}><Grid item xs={12} container className="padding2em1m">{children}</Grid></Paper>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
    };
}

const getCardByCode = function (code: string) {
    const card = g_pCards[code];
    if (card)
        return card;

    return null;
}

const canIncrease = function (entry: Deckentry) {
    const card = getCardByCode(entry.code);
    if (card === null)
        return false;

    return !disableDeckAddingActions(card, entry.count);
}

const clearCode = function (code: string) {
    const pos = code.indexOf("(");
    return pos === -1 ? code : code.substring(0, pos).trim();
}

function CurrentDeckPartEntry({ entry, keyVal, onIncrease, onDecrease, onPreviewImage, setPreviewImage, type, onMoveCardDeckSection }: { entry: Deckentry, keyVal: string, onIncrease: Function, onDecrease: Function, onPreviewImage: Function, setPreviewImage: Function, type: string, onMoveCardDeckSection: Function }) {
    return <li key={keyVal} className="deck-edit-entry"
        onMouseEnter={(e) => onPreviewImage(e.pageX, GetCardImage(entry.code).image)}
        onMouseLeave={() => setPreviewImage({ image: "", left: false })}
    >
        {entry.count} {clearCode(entry.code)}
        <div className="deck-edit-entry-actions">
            {canIncrease(entry) && (<span onClick={() => onIncrease(entry.code)} title="Increase quantity">
                <AddCircleIcon />
            </span>)}
            <span onClick={() => onDecrease(entry.code)} title="Decrease quantity">
                <RemoveCircleIcon />
            </span>
            {type !== "site" && (<>
                {type !== "pool" && (<span onClick={() => { onMoveCardDeckSection(entry.code, type, "pool"); setPreviewImage({ image: "", left: false })}} title="Transfer 1 card to Pool">
                    <BackHandIcon />
                </span>)}
                {type !== "deck" && (<span onClick={() => { onMoveCardDeckSection(entry.code, type, "deck"); setPreviewImage({ image: "", left: false })}} title="Transfer 1 card to Deck">
                    <StyleIcon />
                </span>)}
                {type !== "sideboard" && (<span onClick={() => { onMoveCardDeckSection(entry.code, type, "sideboard"); setPreviewImage({ image: "", left: false })}} title="Transfer 1 card to Sideboard">
                    <SpaceDashboardIcon />
                </span>)}
            </>)}
        </div>
    </li>
}

const getDeckListPart = function (list: Deckentry[]) {
    const map: { [key: string]: Deckentry[] } = {};

    let count = 0;
    for (let elem of list) {
        count += elem.count;
        if (map[elem.type])
            map[elem.type].push(elem);
        else
            map[elem.type] = [elem];
    }

    return {
        count: count,
        map: map
    };
}

const countDeckSectionCards = function(list: Deckentry[])
{
    if (list.length === 0)
        return 0;

    let count = 0;
    for (let elem of list)
        count += elem.count

    return count;
}

const sortTextAreaCodes = function(text:string)
{
    const map:any = {};
    for (const line of text.trim().split("\n"))
    {
        const pos = line.indexOf(" ");
        if (pos < 1)
            continue;

        const left = line.substring(0, pos).trim();
        const right = line.substring(pos+1);

        const val = parseInt(left);
        if (isNaN(val))
            continue;

        if (map[right])
            map[right] += val;
        else
            map[right] = val;
    }

    const keys = Object.keys(map).sort();
    const res:string[] = [];
    for (const key of keys)
        res.push(map[key] + " " + key);

    return res.join("\n");
}

function CurrentDeckPart({ caption, list, pref, sectionClassname, onIncrease, onDecrease, onPreviewImage, setPreviewImage, type, onMoveCardDeckSection, sortType = false }: { caption: string, list: Deckentry[], pref: string, sectionClassname: string, onIncrease: Function, onDecrease: Function, onPreviewImage: Function, setPreviewImage: Function, sortType?: boolean, type: string, onMoveCardDeckSection: Function }) {

    if (sortType === false || list.length === 0) {
        return <>
            {caption !== "" && (<Typography variant="body1" component={"p"} className="display-block deck-part-cation smallcaps sections-title-specific">{caption} ({countDeckSectionCards(list)})</Typography>)}
            {list && list.length === 0 ? <>&ndash;</> : <ul className={"deck-edit-section-" + sectionClassname}>
                {list.map((entry, idx) => (<CurrentDeckPartEntry key={pref + idx + entry.code + "_r"}
                    keyVal={pref + idx + entry.code}
                    entry={entry}
                    onDecrease={onDecrease}
                    onIncrease={onIncrease}
                    onPreviewImage={onPreviewImage}
                    setPreviewImage={setPreviewImage}
                    type={type}
                    onMoveCardDeckSection={onMoveCardDeckSection}
                />))}
            </ul>}</>
    }

    const res = getDeckListPart(list);
    const map = res.map;
    return <>
        {caption !== "" && (<Typography variant="body1" component={"p"} className="display-block deck-part-cation smallcaps sections-title-specific">{caption} ({res.count})</Typography>)}
        {Object.keys(map).sort().map((key, index) => <ul className={"deck-edit-section-sorted deck-edit-section-" + sectionClassname} key={"deck-edit-section-" + sectionClassname + index}>
            <li className="sections-title-specific-sub smallcaps">{key} ({countDeckSectionCards(map[key])})</li>
            {map[key].map((entry, idx) => <CurrentDeckPartEntry
                keyVal={pref + index + "-" + idx + entry.code}
                key={pref + index + "-" + idx + entry.code+ "_c"}
                entry={entry}
                onDecrease={onDecrease}
                onIncrease={onIncrease}
                onPreviewImage={onPreviewImage}
                setPreviewImage={setPreviewImage}
                type={type}
                onMoveCardDeckSection={onMoveCardDeckSection}
            />
            )}
        </ul>)}
    </>
}

const deckentryToString = function (res: string[], part: Deckentry[]) {
    for (let e of part) {
        if (e.count > 0)
            res.push(e.count + " " + e.code)
    }
}

const deckentryToStringSimple = function (part: DeckCardsEntry) {
    const res: string[] = []
    for (let code in part) {
        if (part[code] > 0)
            res.push(part[code] + " " + code)
    }
    return res.join("\n").trim();
}

const deckPartToString = function (part: DeckPart) {
    const res: string[] = [];

    deckentryToString(res, part.characters);
    deckentryToString(res, part.resources);
    deckentryToString(res, part.hazards);

    return res.join("\n");
}

const toInt = function (input: string) {
    try {
        const val = parseInt(input);
        if (!isNaN(val) && val > 0)
            return val;
    }
    catch (errIgnore) {
        /** ignore */
    }

    return -1;
}

const explodeCardLine = function (line: string, fnCallback: Function) {
    const res: Deckentry = {
        count: 0,
        code: "",
        image: "",
        type: ""
    };

    line = line.trim().toLowerCase();
    if (line.length < 3 || line.startsWith("#"))
        return;

    const count = toInt(line.substring(0, 2).trim());
    if (count === 0) {
        console.warn("Will not add 0 cards: " + line)
        return;
    }

    if (count === -1) {
        res.code = line;
        res.count = 1;
    }
    else {
        res.code = line.substring(2).trim();
        res.count = count;
    }

    const card = getCardByCode(res.code)
    if (card) {
        res.type = card.Secondary;
        fnCallback(res, card.type.toLowerCase());
    }
}



const mapToEntrylist = function (map: any) {
    const list: Deckentry[] = [];
    const keys = Object.keys(map).sort();
    for (let key of keys)
        list.push(map[key]);

    return list;
}

const splitArea = function (text: string): DeckPart {
    const data: any =
    {
        characters: {},
        resources: {},
        hazards: {}
    }

    for (let line of text.trim().split("\n")) {
        explodeCardLine(line, (entry: Deckentry, type: string) => {
            if (entry.count < 1 || entry.code === "" || type === "")
                return;

            let map = null;
            if (type === "resource")
                map = data.resources;
            else if (type === "hazard")
                map = data.hazards;
            else if (type === "character")
                map = data.characters;

            if (map === null)
                return;

            if (map[entry.code])
                map[entry.code].count += entry.count;
            else
                map[entry.code] = entry;
        })
    }

    return {
        characters: mapToEntrylist(data.characters),
        resources: mapToEntrylist(data.resources),
        hazards: mapToEntrylist(data.hazards),
    };
}

const splitAreaSites = function (text: string): DeckPart {
    const map: any = {};

    for (let line of text.trim().split("\n")) {
        explodeCardLine(line, (entry: Deckentry, type: string) => {
            if (entry.count < 1 || entry.code === "" || type !== "site")
                return;

            if (map[entry.code])
                map[entry.code].count += entry.count;
            else
                map[entry.code] = entry;
        })
    }

    return {
        characters: [],
        resources: mapToEntrylist(map),
        hazards: [],
    };
}

const convertToDeckCound = function (map: DeckCountMap, ...parts: DeckPart[]) {
    const addToMap = function (list: Deckentry[]) {
        for (let elem of list) {
            if (map[elem.code])
                map[elem.code] += elem.count;
            else
                map[elem.code] = elem.count;
        }
    }

    for (let part of parts) {
        addToMap(part.hazards);
        addToMap(part.characters);
        addToMap(part.resources);
    }
}

const convertToDeck = function (pool: string, deck: string, sideboard: string, sites: string, notes: string): Deck {
    const data = {
        pool: splitArea(pool),
        playdeck: splitArea(deck),
        sideboard: splitArea(sideboard),
        sites: splitAreaSites(sites),
        notes: notes,
        counts: {}
    }

    convertToDeckCound(data.counts, data.pool, data.playdeck, data.sideboard, data.sites);
    return data;
}

const disableDeckAddingActions = function (card: CardData, count: number) {
    if (card.uniqueness !== true)
        return false;

    const isAvatar = card.Secondary === "Avatar";
    const maxUnique = isAvatar ? 10 : 1;
    return count >= maxUnique;
}
const isExceedingCardLimit = function (card: CardData, count: number) {
    return card.uniqueness !== true && count >= 3;
}

type CharacterAgents = {
        characters: Deckentry[];
        agents: Deckentry[];
}

function removeAgentsFromList(part:Deckentry[], agentsAsHazards = false)
{
    const result:CharacterAgents = {
        characters: part,
        agents: []
    }

    if (!agentsAsHazards)
        return result;

    result.characters = [];
    for (const card of part)
    {
        
        const candidate = GetCardByCode(card.code);
        if (candidate?.Secondary === "Agent")
            result.agents.push(card);
        else
            result.characters.push(card);
    }

    return result;
}

function CurrentDeck({ deck, updateDeck, onIncrease, onDecrease, onPreviewImage, setPreviewImage, onMoveCardDeckSection, agentsAsHazards }: { deck: Deck, updateDeck: Function, onIncrease: Function, onDecrease: Function, onPreviewImage: Function, setPreviewImage: Function, onMoveCardDeckSection: Function, agentsAsHazards:boolean }) {

    const [value, setValue] = React.useState(0);

    const [textPool, setTextPool] = React.useState("");
    const [textDeck, setTextDeck] = React.useState("");
    const [textSideboard, setTextSideboard] = React.useState("");
    const [textSites, setTextSites] = React.useState("");
    const [textNotes, setTextNotes] = React.useState("");
    const [message, setMessage] = React.useState("");

    const defaultRowCount = 15;

    const applyDeckChanges = function () {
        const data = convertToDeck(textPool, textDeck, textSideboard, textSites, textNotes);
        updateDeck(data);
        setMessage("Applied");
    }

    const sortCodesInTextarea = function()
    {
        setTextPool(sortTextAreaCodes(textPool));
        setTextDeck(sortTextAreaCodes(textDeck));
        setTextSideboard(sortTextAreaCodes(textSideboard));
        setTextSites(sortTextAreaCodes(textSites));
    }

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        if (newValue === 0)
            return;

        setTextPool(deckPartToString(deck.pool));
        setTextDeck(deckPartToString(deck.playdeck));
        setTextSideboard(deckPartToString(deck.sideboard));
        setTextSites(deckPartToString(deck.sites));
        setTextNotes(deck.notes);
    }

    const characters = removeAgentsFromList(deck.playdeck.characters, agentsAsHazards);
    const hazards = [...characters.agents, ...deck.playdeck.hazards];

    return <React.Fragment>
        <Grid item xs={12} className="bgPaper">
            <Box className="bgPaperBox">
                <AppBar position="static">
                    <Tabs value={value} onChange={handleChange} textColor="primary" indicatorColor="primary">
                        <Tab label="Deck List" {...a11yProps(0)} />
                        <Tab label="Export/Import" {...a11yProps(1)} />
                    </Tabs>
                </AppBar>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <Grid item xs={12} sm={3} md={2} container rowGap={2} alignSelf={"flex-start"} >
                    <Grid item xs={12}>
                        <Typography className="smallcaps section-title"><BackHandIcon /> Pool</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <CurrentDeckPart
                            caption="Characters" pref="poolc" list={deck.pool.characters} sectionClassname="character"
                            onDecrease={(code: string) => onDecrease(code, "pool")}
                            onIncrease={(code: string) => onIncrease(code, "pool")}
                            onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                            onMoveCardDeckSection={onMoveCardDeckSection}
                            type="pool"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <CurrentDeckPart caption="Resources" pref="poolr" list={deck.pool.resources} sectionClassname="resource"
                            onDecrease={(code: string) => onDecrease(code, "pool")}
                            onIncrease={(code: string) => onIncrease(code, "pool")}
                            onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                            onMoveCardDeckSection={onMoveCardDeckSection}
                            type="pool"
                        />
                        <CurrentDeckPart caption="" pref="poolh" list={deck.pool.hazards} sectionClassname="hazard"
                            onDecrease={(code: string) => onDecrease(code, "pool")}
                            onIncrease={(code: string) => onIncrease(code, "pool")}
                            onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                            onMoveCardDeckSection={onMoveCardDeckSection}
                            type="pool"
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={9} md={10} lg={5} container rowGap={2} alignSelf={"flex-start"} className="deck-edit-section-deck">
                    <Grid item xs={12}>
                        <Typography className="smallcaps section-title"><StyleIcon /> Play Deck</Typography>
                    </Grid>
                    <Grid item xs={12} container rowGap={2}>
                        <Grid item xs={12} md={4} rowGap={2}>
                            <CurrentDeckPart
                                caption="Characters"
                                pref="deckchar"
                                list={characters.characters}
                                sectionClassname="character"
                                onDecrease={(code: string) => onDecrease(code, "deck")}
                                onIncrease={(code: string) => onIncrease(code, "deck")}
                                onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                                onMoveCardDeckSection={onMoveCardDeckSection}
                                type="deck"
                            />
                        </Grid>
                        <Grid item xs={12} md={4} rowGap={2}>
                            <CurrentDeckPart
                                caption="Resources"
                                pref="deckres"
                                list={deck.playdeck.resources}
                                sectionClassname="resource"
                                onDecrease={(code: string) => onDecrease(code, "deck")}
                                onIncrease={(code: string) => onIncrease(code, "deck")}
                                onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                                onMoveCardDeckSection={onMoveCardDeckSection}
                                type="deck"
                                sortType={true}
                            />
                        </Grid>
                        <Grid item xs={12} md={4} rowGap={2}>
                            <CurrentDeckPart
                                caption="Hazards"
                                pref="deckh"
                                list={hazards}
                                sectionClassname="hazard"
                                onDecrease={(code: string) => onDecrease(code, "deck")}
                                onIncrease={(code: string) => onIncrease(code, "deck")}
                                onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                                onMoveCardDeckSection={onMoveCardDeckSection}
                                type="deck"
                                sortType={true}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={9} md={10} lg={4} container rowGap={2} alignSelf={"flex-start"}>
                    <Grid item xs={12}>
                        <Typography className="smallcaps section-title">
                            <SpaceDashboardIcon /> Sideboard
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6} container rowGap={2}>
                        <Grid item xs={12}>
                            <CurrentDeckPart
                                caption="Resources" pref="sbr" list={deck.sideboard.resources} sectionClassname="resource"
                                onDecrease={(code: string) => onDecrease(code, "sb")}
                                onIncrease={(code: string) => onIncrease(code, "sb")}
                                onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                                onMoveCardDeckSection={onMoveCardDeckSection}
                                type="sideboard"
                                sortType={true}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <CurrentDeckPart
                                caption="Characters"
                                pref="sbc"
                                list={deck.sideboard.characters}
                                sectionClassname="character"
                                onDecrease={(code: string) => onDecrease(code, "sb")}
                                onIncrease={(code: string) => onIncrease(code, "sb")}
                                onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                                onMoveCardDeckSection={onMoveCardDeckSection}
                                type="sideboard"
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <CurrentDeckPart
                            caption="Hazards" pref="sbr" list={deck.sideboard.hazards} sectionClassname="hazard"
                            onDecrease={(code: string) => onDecrease(code, "sb")}
                            onIncrease={(code: string) => onIncrease(code, "sb")}
                            onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                            onMoveCardDeckSection={onMoveCardDeckSection}
                            type="sideboard"
                            sortType={true}
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={3} md={2} lg={1} container rowGap={2} alignSelf={"flex-start"}>
                    <Grid item xs={12}>
                        <Typography className="smallcaps section-title">
                            <MapIcon /> Sites
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <CurrentDeckPart
                            caption="Resources" pref="sites" list={deck.sites.resources} sectionClassname="site"
                            onDecrease={(code: string) => onDecrease(code, "deck")}
                            onIncrease={(code: string) => onIncrease(code, "deck")}
                            onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                            type="site"
                            onMoveCardDeckSection={onMoveCardDeckSection}
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12} className="deck-notes">
                    <TextField rows={10} value={textNotes} multiline onChange={(e) => setTextNotes(e.target.value)} fullWidth label={"Notes"} variant="filled" />
                </Grid>
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <Grid item xs={12} container rowGap={2}>
                    <Grid item xs={6} className="custom-deck">
                        <Button variant="contained" onClick={applyDeckChanges}>Apply changes</Button>
                    </Grid>
                    <Grid item xs={6} className="custom-deck" style={{ textAlign: "right"}}>
                        <Button variant="outlined" onClick={sortCodesInTextarea}>Sort codes</Button>
                    </Grid>
                    <Grid item xs={6} lg={3} className="custom-deck">
                        <TextField rows={defaultRowCount} value={textPool} multiline onChange={(e) => setTextPool(e.target.value)} fullWidth label={"Pool"} placeholder={"1 Gandalf [H] (TW)"} variant="filled" />
                    </Grid>
                    <Grid item xs={6} lg={3} className="custom-deck">
                        <TextField rows={defaultRowCount} value={textDeck} multiline onChange={(e) => setTextDeck(e.target.value)} fullWidth label={"Deck"} placeholder={"1 Gandalf [H] (TW)"} variant="filled" />
                    </Grid>
                    <Grid item xs={6} lg={3} className="custom-deck">
                        <TextField rows={defaultRowCount} value={textSideboard} multiline onChange={(e) => setTextSideboard(e.target.value)} fullWidth label={"Sideboard"} placeholder={"1 Gandalf [H] (TW)"} variant="filled" />
                    </Grid>
                    <Grid item xs={6} lg={3} className="custom-deck">
                        <TextField rows={defaultRowCount} value={textSites} multiline onChange={(e) => setTextSites(e.target.value)} fullWidth label={"Sites"} placeholder={"1 Rivendell [H] (TW)"} variant="filled" />
                    </Grid>
                    <Grid item xs={12} className="custom-deck">
                        <TextField rows={10} value={textNotes} multiline onChange={(e) => setTextNotes(e.target.value)} fullWidth label={"Notes"} variant="filled" />
                    </Grid>
                </Grid>
            </CustomTabPanel>
        </Grid>
        <Snackbar
            open={message !== ""}
            autoHideDuration={5000}
            onClick={() => setMessage("")}
            message={message}
        />
    </React.Fragment>;
}

const onAddToDeck = function (card: CardData, playdeck: DeckPart, code: string, image: string, counts: DeckCountMap) {
    let list;
    if (card.type === "Hazard")
        list = playdeck.hazards;
    else if (card.type === "Character")
        list = playdeck.characters;
    else
        list = playdeck.resources;

    let found = false;
    for (let e of list) {
        if (e.code === code) {
            e.count++;
            found = true;
            break;
        }
    }

    if (!found) {
        list.push({
            code: code,
            image: image,
            count: 1,
            type: card.Secondary
        });
        list.sort((a, b) => a.code.localeCompare(b.code));
    }

    if (counts[code])
        counts[code] += 1;
    else
        counts[code] = 1;

    return true;
}

const onRemoveFromDeck = function (card: CardData, playdeck: DeckPart, code: string, counts: DeckCountMap) {

    let list;
    if (card.type === "Hazard")
        list = playdeck.hazards;
    else if (card.type === "Character")
        list = playdeck.characters;
    else
        list = playdeck.resources;

    let found = false;
    const size = list.length;
    for (let i = 0; !found && i < size; i++) {
        const e = list[i];
        if (e.code !== code)
            continue;

        e.count--;
        found = true;
        if (e.count < 1)
            list.splice(i, 1);

        if (counts[code]) {
            counts[code]--;
            if (counts[code] < 1)
                delete counts[code];
        }
    }

    return true;
}

const g_pCards: { [key: string]: CardData } = {};

let g_bLoadCards = true;

const loadData = async function () {
    if (!g_bLoadCards)
        return;

    g_bLoadCards = true;
    try {
        await FetchFrenchImageUrl();
        
        const cards = await FetchCards();
        for (let card of cards)
            g_pCards[card.code] = card;

        InitCustomDeck();
    }
    catch (err) {
        console.error(err);
    }

    return true;
}

function DeckDetailsSection({ deck, updateDeck, onIncrease, onDecrease, onMoveCardDeckSection, agentsAsHazards }: { deck: Deck, updateDeck: Function, onIncrease: Function, onDecrease: Function, onMoveCardDeckSection: Function, agentsAsHazards : boolean }) {

    const [previewImage, setPreviewImage] = React.useState<ImagePreviewInfo>({ image: "", left: true });
    const onPreviewImage = function (x: number, src: string) {
        const half = window.innerWidth / 2;
        const left = x < half;
        setPreviewImage({ image: src, left: !left });
    }

    return (
        <>
            <RenderCardPreview image={previewImage.image} left={previewImage.left} />
            <Grid item xs={12} container className="paddingTop4em deck-details">
                <CurrentDeck
                    deck={deck}
                    updateDeck={updateDeck}
                    onDecrease={onDecrease}
                    onIncrease={onIncrease}
                    onPreviewImage={onPreviewImage}
                    setPreviewImage={setPreviewImage}
                    onMoveCardDeckSection={onMoveCardDeckSection}
                    agentsAsHazards={agentsAsHazards}
                />
            </Grid>
        </>
    );
}

const countDeckEntryCardsTotalDeckentry = function (part: Deckentry[]) {
    if (!part)
        return 0;

    let total = 0;
    for (let list of part) {
        if (list.count > 0)
            total += list.count;
    }
    return total;
}


const countDeckEntryCardsTotalDeckentryS = function (part: Deckentry[]) {
    const count = countDeckEntryCardsTotalDeckentry(part);
    return count > 0 ? count : "-";
}

const countDeckEntryCardsTotal = function (part: DeckPart) {
    if (!part)
        return "-";

    const val = countDeckEntryCardsTotalDeckentry(part.characters)
        + countDeckEntryCardsTotalDeckentry(part.hazards)
        + countDeckEntryCardsTotalDeckentry(part.resources);

    return val > 0 ? val : "-";
}

const createEmptyDeck = function (): Deck {
    return {
        playdeck: {
            characters: [],
            hazards: [],
            resources: []
        },
        pool: {
            characters: [],
            hazards: [],
            resources: []
        },
        sideboard: {
            characters: [],
            hazards: [],
            resources: []
        },
        sites: {
            characters: [],
            hazards: [],
            resources: []
        },
        notes: "",
        counts: {}
    };
}

const CardCountBubble = function ({ count }: { count: number }) {
    return <div className="card-count">{count}</div>;
}

const createDeckSaveSection = function (text: string, title: string) {
    if (text.trim() === "")
        return;

    return "\n####\n" + title + "\n####\n\n" + text;
}

const CreateSingleTextFileFromDeck = function (deck: Deck) {
    const res = [
        "#\n# Middle-earth Deck\n#\n",
        createDeckSaveSection(deckPartToString(deck.playdeck), "Deck"),
        createDeckSaveSection(deckPartToString(deck.pool), "Pool"),
        createDeckSaveSection(deckPartToString(deck.sideboard), "Sideboard"),
        createDeckSaveSection(deckPartToString(deck.sites), "Sites"),
        createDeckSaveSection(deck.notes, "Notes")
    ];

    return res.join("\n");
}

export default function Deckbuilder() {

    const [previewImage, setPreviewImage] = React.useState<ImagePreviewInfo>({ image: "", left: true });
    const [deck, setDeck] = React.useState<Deck>(createEmptyDeck());
    const [message, setMessage] = React.useState("");
    const [showLegalInfo, setShowLegalInfo] = React.useState(false);
    const [agentsAsHazards, setAgentsAsHazards] = React.useState(false);

    React.useEffect(() => { 
        loadData().finally(() => {
            const data = sessionStorage?.getItem("currentdeck") ?? "";
            if (data)
                setDeck(JSON.parse(data));
        })
    }, [setDeck]);

    const onPreviewImage = function (id:string, x: number) {
        const data = GetImagePreviewData(id, x);
        if (data !== null)
            setPreviewImage(data);
    }
    
    const saveCurrentDeck = function () {
        const val = CreateSingleTextFileFromDeck(deck);
        SaveDeckDialog(val);
        
        if (sessionStorage?.getItem("currentdeck"))
            sessionStorage.removeItem("currentdeck");
    }

    const onDeckFileRead = function (e: any) {
        const contents = e.target?.result;
        if (typeof contents !== "string" || contents === "" || contents.indexOf("#") === -1) {
            setMessage(Dictionary("login.empty", "File seems to be empty..."));
            return;
        }

        const deck = ExploreDeckData({
            deck: contents,
            images: {}
        });

        if (deck === null) {
            setMessage("Could not load deck. It seems to be empty.");
            return;
        }

        const res = convertToDeck(
            deckentryToStringSimple(deck.pool),
            deckentryToStringSimple(deck.deck),
            deckentryToStringSimple(deck.sideboard),
            deckentryToStringSimple(deck.sites),
            deck.notes
        )
        const data = {
            playdeck: {
                characters: [...res.playdeck.characters],
                hazards: [...res.playdeck.hazards],
                resources: [...res.playdeck.resources]
            },
            pool: {
                characters: [...res.pool.characters],
                hazards: [...res.pool.hazards],
                resources: [...res.pool.resources]
            },
            sideboard: {
                characters: [...res.sideboard.characters],
                hazards: [...res.sideboard.hazards],
                resources: [...res.sideboard.resources]
            },
            sites: {
                characters: [],
                hazards: [],
                resources: [...res.sites.resources]
            },
            notes: res.notes,
            counts: res.counts
        };
        
        setDeck(data);
        if (sessionStorage)
            sessionStorage.setItem("currentdeck", JSON.stringify(data));

        setMessage("Deck loaded.");
    }

    const loadDeckFromFile = function (e: any) {
        const file = e.target.files[0];
        e.target.value = "";

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = onDeckFileRead;
        reader.readAsText(file);
    }

    const propagateDeckChanges = function () {
        const data = {
            playdeck: {
                characters: [...deck.playdeck.characters],
                hazards: [...deck.playdeck.hazards],
                resources: [...deck.playdeck.resources]
            },
            pool: {
                characters: [...deck.pool.characters],
                hazards: [...deck.pool.hazards],
                resources: [...deck.pool.resources]
            },
            sideboard: {
                characters: [...deck.sideboard.characters],
                hazards: [...deck.sideboard.hazards],
                resources: [...deck.sideboard.resources]
            },
            sites: {
                characters: [],
                hazards: [],
                resources: [...deck.sites.resources]
            },
            notes: deck.notes ?? "",
            counts: deck.counts
        };

        setDeck(data);
        if (sessionStorage)
            sessionStorage.setItem("currentdeck", JSON.stringify(data));
    }

    const onButtonAddToDeck = function (code: string, which: string) {
        const card = getCardByCode(code)
        if (card === null)
            return false;

        const img = GetCardImage(code).image;

        let updated = false;
        switch (which) {
            case "deck":
                updated = card.type === "Site" ? onAddToDeck(card, deck.sites, code, img, deck.counts) : onAddToDeck(card, deck.playdeck, code, img, deck.counts);
                break;
            case "pool":
                updated = onAddToDeck(card, deck.pool, code, img, deck.counts);
                break;
            case "sb":
            case "sideboard":
                updated = onAddToDeck(card, deck.sideboard, code, img, deck.counts);
                break;
        }

        if (updated)
            propagateDeckChanges();
    }

    const onMoveCardDeckSection = function (code: string, from: string, to: string) {

        const card = getCardByCode(code)
        if (card === null)
            return;

        let updated = false;
        switch (from) {
            case "deck":
                updated = onRemoveFromDeck(card, deck.playdeck, code, deck.counts);
                break;
            case "pool":
                updated = onRemoveFromDeck(card, deck.pool, code, deck.counts);
                break;
            case "sideboard":
            case "sb":
                updated = onRemoveFromDeck(card, deck.sideboard, code, deck.counts);
                break;
        }

        if (updated)
            onButtonAddToDeck(code, to)
    }

    const onIncreaseDeckAction = (code: string, which: string) => onButtonAddToDeck(code, which);

    const onDecreaseDeckAction = function (code: string, which: string) {
        const card = getCardByCode(code);
        if (card === null)
            return false;

        let updated = false;
        switch (which) {
            case "deck":
                updated = card.type === "Site" ? onRemoveFromDeck(card, deck.sites, code, deck.counts) : onRemoveFromDeck(card, deck.playdeck, code, deck.counts);
                break;
            case "pool":
                updated = onRemoveFromDeck(card, deck.pool, code, deck.counts);
                break;
            case "sideboard":
            case "sb":
                updated = onRemoveFromDeck(card, deck.sideboard, code, deck.counts);
                break;
        }

        if (updated)
            propagateDeckChanges();
    }

    const renderSearchResult = function (img: SeachResultEntry, preferErrata:boolean, key: any) {
        const card = getCardByCode(img.code)
        if (card === null)
            return <></>;

        const isSite = card?.type === "Site";
        const isRegion = card?.type === "Region";
        const count = deck.counts[img.code] ?? 0;
        const disableUnique = disableDeckAddingActions(card, count);
        const exceedNotice = !disableUnique && isExceedingCardLimit(card, count);
        const image = preferErrata && img.imageErrata ? img.imageErrata : img.image;
        const imgSrc = GetImageUri(image); 
        const isDCErrata = preferErrata && img.imageErrata;

        return <Grid
                item xs={12} sm={6} md={4} lg={3} xl={2}
                textAlign={"center"}
                key={img.code}
                className="application-deckbuilder-result"
            >
                <img src={imgSrc} data-flip={GetImageUri(img.flip)} alt={img.code}
                    title={img.code + card.Secondary} loading="lazy" decoding="async" id={"image-" + key}
                    onMouseEnter={(e) => onPreviewImage("image-"+key, e.pageX)}
                    onMouseLeave={() => setPreviewImage({ image: "", left: false })}
                    className={exceedNotice ? "application-deckbuilder-result-exceednotive": ""}
                />
                {isDCErrata && (<div className="view-card-errata">DC Errata</div>)}
                {exceedNotice && (<div className="view-card-exceeding">3 usually is max</div>)}
                
                {count > 0 && (<CardCountBubble count={count} />)}
                <div className="add-deck-actions">
                    <Button variant="contained" disabled={disableUnique || isSite || isRegion} onClick={() => onButtonAddToDeck(img.code, "pool")} title="Add to Pool"><BackHandIcon /></Button>
                    <br /><Button variant="contained" disabled={disableUnique || isRegion} onClick={() => onButtonAddToDeck(img.code, "deck")} title="Add to Deck"><StyleIcon /></Button>
                    <br /><Button variant="contained" disabled={disableUnique || isSite || isRegion} onClick={() => onButtonAddToDeck(img.code, "sb")} title="Add to sideboard"><SpaceDashboardIcon /></Button>
                    <br /><Button variant="contained" onClick={() => copyCode(img.code)} title="Copy code to clipboard"><ContentCopyIcon /></Button>
                    {img.flip !== "" && (
                        <Button variant="contained" onClick={() => swapImage("image-" + key)} title="Flip Backsite"><CachedIcon /></Button>
                    )}
                </div>
            </Grid>
    }

    const RenderSingleRule = function(props: { text:string, desc?:string, checked:boolean, details:DreamCardsLegalInfo|null})
    {
        const total = props.details === null ? "" : " - " + props.details.dreamcards + " dream-cards of " + props.details.total + " cards in total"; 
        const txt = (props.desc??"") + " " + total;
        return <ListItem>
        <ListItemIcon>
            {props.checked ? <CheckCircle /> : <StopCircle />}
        </ListItemIcon>
        <ListItemText primary={props.text} secondary={txt.trim()} />
    </ListItem>
    }

    const ShowLegalInfo = function() {
        const dcLegalInfo = calculateDreamcards(deck, agentsAsHazards);
        const ruleTotal = dcLegalInfo.dreamcards.percTotal >= 25;
        const ruleHaz = dcLegalInfo.dreamcards.percHazards >= 25;
        const ruleRes = dcLegalInfo.dreamcards.percResources >= 25;
        const rullesSideboard = dcLegalInfo.sidebaord.allowed >= dcLegalInfo.details.sideboard.total.total;
        const rulesAvatar = dcLegalInfo.avatars.maximum >= dcLegalInfo.avatars.count;
        const isDCLegal = ruleTotal && ruleHaz && ruleRes;

        return <Grid item xs={12} className="deck-legality">
            <Alert severity={isDCLegal ? "success" : "warning"}>
                {isDCLegal ? "This is a legal dream-cards deck." : "This is not a legal dream-cards deck"}
            </Alert>
            <List>
                <RenderSingleRule checked={ruleTotal} text="Overall minimum of 25% dream-cards (round up)." desc={"Dream-cards in deck: " + dcLegalInfo.dreamcards.percTotal + "%"} details={dcLegalInfo.details.total} />
                <RenderSingleRule checked={ruleRes} text="Resource portion of deck has +25% dream-cards (round up)." desc={"Dream-card resources: " + dcLegalInfo.dreamcards.percResources + "%"} details={dcLegalInfo.details.playdeck.resources} />
                <RenderSingleRule checked={ruleHaz} text="Hazard portion of deck has +25% dream-cards (round up)." desc={"Dream-card hazards: " + dcLegalInfo.dreamcards.percHazards + "%"} details={dcLegalInfo.details.playdeck.hazards}/>
                <RenderSingleRule checked={rullesSideboard} text={"Your sideboard may contain up to " + dcLegalInfo.sidebaord.allowed + " cards"} desc={"You have " + dcLegalInfo.details.sideboard.total.total + " cards in your sideboard."} details={dcLegalInfo.details.sideboard.total}/>
                <RenderSingleRule checked={rulesAvatar} text={"You may have up to " + dcLegalInfo.avatars.maximum + " avatar copies"} desc={"You have " + dcLegalInfo.avatars.count + " avatars in your deck"} details={null} />
            </List>
        </Grid>
    }

    const DeckSummary = function () {

        const characters = removeAgentsFromList(deck.playdeck.characters, agentsAsHazards);
        const hazards = [...characters.agents, ...deck.playdeck.hazards];
 
        return <Grid container item xs={12} spacing={0} className="deck-summary">
            <Grid item xs={1} container>
                <Grid item xs={3}><BackHandIcon /></Grid>
                <Grid item xs={9}>
                    Pool<br />
                    {countDeckEntryCardsTotal(deck.pool)}
                </Grid>
            </Grid>
            <Grid item xs={3}>
                {countDeckEntryCardsTotalDeckentryS(deck.pool.characters)} Characters
                <br />{countDeckEntryCardsTotalDeckentryS(deck.pool.resources)} Resources / {countDeckEntryCardsTotalDeckentryS(deck.pool.hazards)} Hazards
                <br />
            </Grid>
            <Grid item xs={1} container>
                <Grid item xs={3}><StyleIcon /></Grid>
                <Grid item xs={9}>
                    Deck<br />
                    {countDeckEntryCardsTotal(deck.playdeck)}
                </Grid>
            </Grid>
            <Grid item xs={3}>
                {countDeckEntryCardsTotalDeckentryS(characters.characters)} Characters
                <br />{countDeckEntryCardsTotalDeckentryS(deck.playdeck.resources)} Resources / {countDeckEntryCardsTotalDeckentryS(hazards)} Hazards
                <br />{countDeckEntryCardsTotalDeckentryS(deck.sites.resources)} Sites
            </Grid>
            <Grid item xs={1} container>
                <Grid item xs={3}><SpaceDashboardIcon /></Grid>
                <Grid item xs={9}>
                    Sideboard<br />
                    {countDeckEntryCardsTotal(deck.sideboard)}
                </Grid>
            </Grid>
            <Grid item xs={3}>
                {countDeckEntryCardsTotalDeckentryS(deck.sideboard.characters)} Characters
                <br />{countDeckEntryCardsTotalDeckentryS(deck.sideboard.resources)} Resources / {countDeckEntryCardsTotalDeckentryS(deck.sideboard.hazards)} Hazards
                <br />
            </Grid>
            <Grid container item xs={12} textAlign={"center"} className="deck-summary-pt1">
                <Grid item xs={2}>
                    <Button variant="contained" onClick={() => { setDeck(createEmptyDeck()); sessionStorage.setItem("currentdeck", ""); }} title="News Deck" startIcon={<NoteAddIcon />}>New Deck</Button>
                </Grid>
                <Grid item xs={6}>
                    <input className='displayNone' id="meccg-open-dialog" type="file" onChange={loadDeckFromFile} />
                    <Button variant="contained" onClick={() => document.getElementById("meccg-open-dialog")?.click()} title="News Deck" startIcon={<FolderOpenIcon />}>Load</Button>
                    &nbsp; <Button variant="contained" onClick={saveCurrentDeck} title="Save deck" startIcon={<SaveIcon />}>Save</Button>
                </Grid>
                <Grid item xs={2}>
                    <Button variant="contained" onClick={() => setShowLegalInfo(!showLegalInfo)} title="Legality" startIcon={<Help />}>Info</Button>
                </Grid>
                <Grid item xs={2}>
                    <FormGroup style={{alignContent: "center"}}>
                        <FormControlLabel control={<Checkbox  checked={agentsAsHazards} onChange={(e) => setAgentsAsHazards(e.target.checked)} />} label="Agents are Hazards" />
                    </FormGroup>
                </Grid>
            </Grid>
            {showLegalInfo && <ShowLegalInfo />}
        </Grid>
    }

    return <React.Fragment>
        <Snackbar
            open={message !== ""}
            autoHideDuration={5000}
            onClick={() => setMessage("")}
            message={message}
        />
        <RenderCardPreview image={previewImage.image} left={previewImage.left} />
        <div className={"application-deckbuilder"}>
            <Grid container spacing={2} justifyContent="center">
                <Grid item xs={10} md={8} textAlign={"center"} className="paddingBottom3em">
                    {MeccgLogo()}
                </Grid>
                <Grid item xs={12} textAlign={"center"}>
                    <h1 data-translation="home.startgame">{Dictionary("frontend.menu.deck", "Deckbuilder")}</h1>
                </Grid>
            </Grid>
        </div>
        <div className={"application-home application-deckbuilder-spacer"}>
            <Grid container spacing={2} justifyContent="center">
                <DeckSummary />
                <ViewCardBrowser renderCardEntry={renderSearchResult} subline="Hover over the card for deck actions" />
            </Grid>
            <Grid container spacing={2} justifyContent="center">
                <DeckDetailsSection
                    deck={deck}
                    updateDeck={setDeck}
                    onDecrease={onDecreaseDeckAction}
                    onIncrease={onIncreaseDeckAction}
                    onMoveCardDeckSection={onMoveCardDeckSection}
                    agentsAsHazards={agentsAsHazards}
                />
            </Grid>
        </div>
    </React.Fragment>
}
