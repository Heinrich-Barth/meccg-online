import { AppBar, Button, Dialog, Grid, IconButton, Slide, Snackbar, TextField, Toolbar, Typography } from "@mui/material";
import React from "react";
import CachedIcon from '@mui/icons-material/Cached';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Dictionary from "../components/Dictionary";
import MeccgLogo from "../components/MeccgLogo";
import ViewCardBrowser, { GetCardImage, SearchResult, copyCode } from "../components/ViewCards";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import FetchCards, { CardData } from "../operations/FetchCards";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import BackHandIcon from '@mui/icons-material/BackHand';
import CloseIcon from '@mui/icons-material/Close';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import MapIcon from '@mui/icons-material/Map';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import SaveIcon from '@mui/icons-material/Save';
import StyleIcon from '@mui/icons-material/Style';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import RenderCardPreview from "../components/CardZoom";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { TransitionProps } from "@mui/material/transitions";
import SaveDeckDialog from "../components/SaveDeckAsDialog";
import ExploreDeckData, { CreateCountMap, DeckCardsEntry } from "../operations/ExploreDeckData";
import { InitCustomDeck } from "../components/CustomDeckInput";

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

type Deckentry = {
    code: string;
    image: string;
    count: number;
}

type DeckPart = {
    characters: Deckentry[];
    resources: Deckentry[];
    hazards: Deckentry[];
}

type DeckCountMap = {
    [key: string]: number
};

type Deck = {
    pool: DeckPart;
    playdeck: DeckPart;
    sideboard: DeckPart;
    sites: DeckPart;
    notes: string;
    counts: DeckCountMap;
}


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

function CurrentDeckPartEntry({ entry, keyVal, onIncrease, onDecrease, onPreviewImage, setPreviewImage }: { entry: Deckentry, keyVal: string, onIncrease: Function, onDecrease: Function, onPreviewImage: Function, setPreviewImage: Function }) {
    return <li key={keyVal} className="deck-edit-entry">
        {entry.count} {entry.code}
        <div className="deck-edit-entry-actions">
            {canIncrease(entry) && (<span onClick={() => onIncrease(entry.code)} title="Increase quantity">
                <AddCircleIcon />
            </span>)}
            <span onClick={() => onDecrease(entry.code)} title="Decrease quantity">
                <RemoveCircleIcon />
            </span>
            <span
                onMouseEnter={(e) => onPreviewImage(e.pageX, GetCardImage(entry.code).image)}
                onMouseLeave={() => setPreviewImage({ image: "", left: false })} >
                <RemoveRedEyeIcon />
            </span>
        </div>
    </li>
}

function CurrentDeckPart({ caption, list, pref, sectionClassname, onIncrease, onDecrease, onPreviewImage, setPreviewImage }: { caption: string, list: Deckentry[], pref: string, sectionClassname: string, onIncrease: Function, onDecrease: Function, onPreviewImage: Function, setPreviewImage: Function }) {
    return <>
        {caption !== "" && (<Typography variant="body1" component={"p"} className="display-block deck-part-cation smallcaps sections-title-specific">{caption}</Typography>)}
        {list && list.length === 0 ? <></> : <ul className={"deck-edit-section-" + sectionClassname}>
            {list.map((entry, idx) => (<CurrentDeckPartEntry
                keyVal={pref + idx + entry.code}
                entry={entry}
                onDecrease={onDecrease}
                onIncrease={onIncrease}
                onPreviewImage={onPreviewImage}
                setPreviewImage={setPreviewImage}
            />))}
        </ul>}
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
        image: ""
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
    if (card)
        fnCallback(res, card.type.toLowerCase());
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
        return count >= 3;

    const isAvatar = card.Secondary === "Avatar";
    const maxUnique = isAvatar ? 10 : 1;
    return count >= maxUnique;
}


function CurrentDeck({ deck, updateDeck, onIncrease, onDecrease, onPreviewImage, setPreviewImage }: { deck: Deck, updateDeck: Function, onIncrease: Function, onDecrease: Function, onPreviewImage: Function, setPreviewImage: Function }) {

    const [value, setValue] = React.useState(0);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => setValue(newValue);

    const [textPool, setTextPool] = React.useState(deckPartToString(deck.pool));
    const [textDeck, setTextDeck] = React.useState(deckPartToString(deck.playdeck));
    const [textSideboard, setTextSideboard] = React.useState(deckPartToString(deck.sideboard));
    const [textSites, setTextSites] = React.useState(deckPartToString(deck.sites));
    const [textNotes, setTextNotes] = React.useState(deck.notes);
    const [message, setMessage] = React.useState("");

    const defaultRowCount = 15;

    const applyDeckChanges = function () {
        const data = convertToDeck(textPool, textDeck, textSideboard, textSites, textNotes);
        updateDeck(data);
        setMessage("Applied");
    }

    return <React.Fragment>
        <Grid item xs={12} className="bgPaper">
            <Box className="bgPaperBox">
                <AppBar position="static">
                    <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" textColor="primary"
                        indicatorColor="primary">
                        <Tab label="Deck List" {...a11yProps(0)} />
                        <Tab label="Deck Description" {...a11yProps(1)} />
                        <Tab label="Export/Import" {...a11yProps(2)} />
                    </Tabs>
                </AppBar>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <Grid item xs={12} sm={3} md={2} lg={1} container rowGap={2} alignSelf={"flex-start"} >
                    <Grid item xs={12}>
                        <Typography className="smallcaps section-title"><BackHandIcon /> Pool</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <CurrentDeckPart
                            caption="Characters" pref="poolc" list={deck.pool.characters} sectionClassname="character"
                            onDecrease={(code: string) => onDecrease(code, "pool")}
                            onIncrease={(code: string) => onIncrease(code, "pool")}
                            onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <CurrentDeckPart caption="Resources" pref="poolr" list={deck.pool.resources} sectionClassname="resource"
                            onDecrease={(code: string) => onDecrease(code, "pool")}
                            onIncrease={(code: string) => onIncrease(code, "pool")}
                            onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                        />
                        <CurrentDeckPart caption="" pref="poolh" list={deck.pool.hazards} sectionClassname="hazard"
                            onDecrease={(code: string) => onDecrease(code, "pool")}
                            onIncrease={(code: string) => onIncrease(code, "pool")}
                            onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
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
                                list={deck.playdeck.characters}
                                sectionClassname="character"
                                onDecrease={(code: string) => onDecrease(code, "deck")}
                                onIncrease={(code: string) => onIncrease(code, "deck")}
                                onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
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
                            />
                        </Grid>
                        <Grid item xs={12} md={4} rowGap={2}>
                            <CurrentDeckPart
                                caption="Hazards"
                                pref="deckh"
                                list={deck.playdeck.hazards}
                                sectionClassname="hazard"
                                onDecrease={(code: string) => onDecrease(code, "deck")}
                                onIncrease={(code: string) => onIncrease(code, "deck")}
                                onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={9} md={10} lg={5} container rowGap={2} alignSelf={"flex-start"}>
                    <Grid item xs={12}>
                        <Typography className="smallcaps section-title">
                            <SpaceDashboardIcon /> Sideboard
                        </Typography>
                    </Grid>
                    <Grid item xs={12} container rowGap={2}>
                        <Grid item xs={12} md={4} rowGap={2}>
                            <CurrentDeckPart
                                caption="Characters"
                                pref="sbc"
                                list={deck.sideboard.characters}
                                sectionClassname="character"
                                onDecrease={(code: string) => onDecrease(code, "sb")}
                                onIncrease={(code: string) => onIncrease(code, "sb")}
                                onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                            />
                        </Grid>
                        <Grid item xs={12} md={4} rowGap={2}>
                            <CurrentDeckPart
                                caption="Resources" pref="sbr" list={deck.sideboard.resources} sectionClassname="resource"
                                onDecrease={(code: string) => onDecrease(code, "sb")}
                                onIncrease={(code: string) => onIncrease(code, "sb")}
                                onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                            />
                        </Grid>
                        <Grid item xs={12} md={4} rowGap={2}>
                            <CurrentDeckPart
                                caption="Hazards" pref="sbr" list={deck.sideboard.hazards} sectionClassname="hazard"
                                onDecrease={(code: string) => onDecrease(code, "sb")}
                                onIncrease={(code: string) => onIncrease(code, "sb")}
                                onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={3} md={2} lg={1} container rowGap={2} alignSelf={"flex-start"}>
                    <Grid item xs={12}>
                        <Typography className="smallcaps section-title">
                            <MapIcon /> Sites
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} rowGap={2}>
                        <CurrentDeckPart
                            caption="Resources" pref="sites" list={deck.sites.resources} sectionClassname="site"
                            onDecrease={(code: string) => onDecrease(code, "deck")}
                            onIncrease={(code: string) => onIncrease(code, "deck")}
                            onPreviewImage={onPreviewImage} setPreviewImage={setPreviewImage}
                        />
                    </Grid>
                </Grid>
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <TextField rows={20} value={textNotes} multiline onChange={(e) => setTextNotes(e.target.value)} fullWidth label={"Notes"} variant="filled" />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={2}>
                <Grid item xs={12} container rowGap={2}>
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
                    <Grid item xs={12} className="custom-deck">
                        <Button variant="contained" onClick={applyDeckChanges}>Apply changes</Button>
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
            count: 1
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

type ImagePreview = {
    image: string;
    left: boolean
}

function FullScreenDialog({ deck, onClose, updateDeck, onIncrease, onDecrease }: { deck: Deck, onClose: Function, updateDeck: Function, onIncrease: Function, onDecrease: Function }) {

    const [previewImage, setPreviewImage] = React.useState<ImagePreview>({ image: "", left: true });

    React.useEffect(() => { loadData() }, []);

    const onPreviewImage = function (x: number, src: string) {
        const half = window.innerWidth / 2;
        const left = x < half;
        setPreviewImage({ image: src, left: !left });
    }

    const handleClose = () => {
        onClose();
    };

    return (
        <React.Fragment>
            <Dialog
                fullScreen
                open={true}
                onClose={handleClose}
                TransitionComponent={Transition}
            >
                <RenderCardPreview image={previewImage.image} left={previewImage.left} />
                <AppBar className="pos-rel">
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={handleClose}
                            aria-label="close"
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h6" component="div">
                            Deck Details
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Grid item xs={12} container className="paddingTop4em deck-details">
                    <CurrentDeck
                        deck={deck}
                        updateDeck={updateDeck}
                        onDecrease={onDecrease}
                        onIncrease={onIncrease}
                        onPreviewImage={onPreviewImage}
                        setPreviewImage={setPreviewImage}
                    />
                </Grid>
            </Dialog>
        </React.Fragment>
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

    const [previewImage, setPreviewImage] = React.useState<ImagePreview>({ image: "", left: true });
    const [viewDeckData, setViewDeckData] = React.useState(false);
    const [deck, setDeck] = React.useState<Deck>(createEmptyDeck());
    const [message, setMessage] = React.useState("");

    React.useEffect(() => { loadData() }, []);

    const onPreviewImage = function (x: number, src: string) {
        const half = window.innerWidth / 2;
        const left = x < half;
        setPreviewImage({ image: src, left: !left });
    }


    const saveCurrentDeck = function () {
        const val = CreateSingleTextFileFromDeck(deck);
        SaveDeckDialog(val);
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

        setDeck({
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
        });

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
        setDeck({
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
        });
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
                updated = onAddToDeck(card, deck.sideboard, code, img, deck.counts);
                break;
        }

        if (updated)
            propagateDeckChanges();
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
            case "sb":
                updated = onRemoveFromDeck(card, deck.sideboard, code, deck.counts);
                break;
        }

        if (updated)
            propagateDeckChanges();
    }

    const renderSearchResult = function (img: SearchResult, key: any) {
        const card = getCardByCode(img.code)
        if (card === null)
            return <></>;

        const isSite = card?.type === "Site";
        const isRegion = card?.type === "Region";
        const count = deck.counts[img.code] ?? 0;
        const disableAll = disableDeckAddingActions(card, count);
        return <Grid
            item xs={12} sm={6} md={4} lg={3} xl={2}
            textAlign={"center"}
            key={img.code}
            className="application-deckbuilder-result"
        >
            <img src={img.image} data-flip={img.flip} alt={img.code}
                title={img.code + card.Secondary} loading="lazy" decoding="async" id={"image-" + key}
                onMouseEnter={(e) => onPreviewImage(e.pageX, img.image)}
                onMouseLeave={() => setPreviewImage({ image: "", left: false })}
            />
            {count > 0 && (<CardCountBubble count={count} />)}
            <div className="add-deck-actions">
                <Button variant="contained" disabled={disableAll || isSite || isRegion} onClick={() => onButtonAddToDeck(img.code, "pool")} title="Add to Pool"><BackHandIcon /></Button>
                <br /><Button variant="contained" disabled={disableAll || isRegion} onClick={() => onButtonAddToDeck(img.code, "deck")} title="Add to Deck"><StyleIcon /></Button>
                <br /><Button variant="contained" disabled={disableAll || isSite || isRegion} onClick={() => onButtonAddToDeck(img.code, "sb")} title="Add to sideboard"><SpaceDashboardIcon /></Button>
                <br /><Button variant="contained" onClick={() => copyCode(img.code)} title="Copy code to clipboard"><ContentCopyIcon /></Button>
                {img.flip !== "" && (
                    <Button variant="contained" onClick={() => swapImage("image-" + key)} title="Flip Backsite"><CachedIcon /></Button>
                )}
            </div>

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
                    <p>The "old" deckbuilder is still available <a href="/deckbuilder">here</a></p>
                </Grid>
            </Grid>
        </div>
        <div className={"application-home application-deckbuilder-spacer"}>
            <Grid container spacing={2} justifyContent="center">
                <ViewCardBrowser renderCardEntry={renderSearchResult} subline="Hover over the card for deck actions" />
            </Grid>
        </div>
        {viewDeckData && (<FullScreenDialog
            deck={deck}
            onClose={() => setViewDeckData(false)}
            updateDeck={setDeck}
            onDecrease={onDecreaseDeckAction}
            onIncrease={onIncreaseDeckAction}
        />)}
        <AppBar position="fixed" enableColorOnDark={true} className="deckbuilder-toolbar">
            <Toolbar className="deckbuilder-toolbar-posrel">
                <div className="deckbuilder-toolbar-icon deckbuilder-toolbar-open">
                    <Button variant="contained" onClick={() => setViewDeckData(true)} title="Details"><KeyboardDoubleArrowUpIcon /></Button>
                </div>
                <div className="deckbuilder-toolbar-icon deckbuilder-toolbar-new">
                    <Button variant="contained" onClick={() => setDeck(createEmptyDeck())} title="News Deck"><NoteAddIcon /></Button>
                    &nbsp;
                    <input className='displayNone' id="meccg-open-dialog" type="file" onChange={loadDeckFromFile} />
                    <Button variant="contained" onClick={() => document.getElementById("meccg-open-dialog")?.click()} title="News Deck"><FolderOpenIcon /></Button>
                </div>
                <div className="deckbuilder-toolbar-icon deckbuilder-toolbar-save">
                    <Button variant="contained" onClick={saveCurrentDeck} title="Save deck"><SaveIcon /></Button>
                </div>
                <Grid container>
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
                        {countDeckEntryCardsTotalDeckentryS(deck.playdeck.characters)} Characters
                        <br />{countDeckEntryCardsTotalDeckentryS(deck.playdeck.resources)} Resources / {countDeckEntryCardsTotalDeckentryS(deck.playdeck.hazards)} Hazards
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
                </Grid>
            </Toolbar>
        </AppBar>
    </React.Fragment>
}
