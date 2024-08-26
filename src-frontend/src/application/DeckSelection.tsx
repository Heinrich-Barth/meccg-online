

import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { DeckData, DeckEntry, DeckEntryMeta, FetchDeckById } from '../operations/FetchDeckLists';
import { Alert, Grid, Snackbar } from '@mui/material';
import { BACKSIDE_IMAGE } from './Types';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import BrowserUpdatedIcon from '@mui/icons-material/BrowserUpdated';
import ScreenSearchDesktopIcon from '@mui/icons-material/ScreenSearchDesktop';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { GameData } from '../operations/FetchGameData';
import ExploreDeckData, { ConvertCardsStringMap, DeckCards, DeckCardsEntry } from '../operations/ExploreDeckData';
import { GetUserName } from '../components/Preferences';
import PROXY_URL from '../operations/Proxy';
import Dictionary from '../components/Dictionary';
import CustomDeckInput from '../components/CustomDeckInput';
import FetchSampleRooms from '../operations/FetchSampleRooms';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import ViewDeckCards from '../components/ViewDeckCards';

const TYPE_ARDA = "arda";
const TYPE_STANDARD = "standard";
const TYPE_SOLO = "solo";
const TYPE_SOLO_HAZ = "solo_haz";

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const getLabelColor = function (index: number) {
    const labelColors = ["red", "green", "blue", "yellow", "pink"];
    if (index <= 0)
        index = 0;

    while (index > labelColors.length)
        index -= labelColors.length;

    return labelColors[index];
}

const getGameTypeLabelButton = function (val: string) {
    switch (val) {
        case TYPE_ARDA:
            return "Arda"
        case TYPE_SOLO:
        case TYPE_SOLO_HAZ:
            return "Solitary";
        case TYPE_STANDARD:
        default:
            return "Standard | DC"
    }
}

export type DeckSelectionProps = {

    selectDeckOpen: boolean;
    setSelectDeckOpen: Function;
    deckList: DeckEntry[]
    room: string;
    roomImage: string;
    roomData: GameData
}

type DeckCache = {
    [key: string]: DeckCards;
};

const CachedDecks: DeckCache = {

}

const createDeckPayload = function (input: DeckCards | null) {
    if (input === null) {
        return {
            deck: {},
            pool: {},
            sideboard: {},
            sites: {},
            notes: ""
        };

    }
    return {
        deck: input.deck,
        pool: input.pool,
        sideboard: input.sideboard,
        sites: input.sites,
        notes: input.notes
    }
}

CachedDecks["custom"] = {
    deck: {},
    pool: {},
    sideboard: {},
    sites: {},
    images: {},
    notes: ""
};

const getUrlPathByType = function (type: string) {
    if (type === TYPE_ARDA)
        return "arda";
    else if (type === TYPE_SOLO || type === TYPE_SOLO)
        return "singleplayer";
    else
        return "play";
}

const map2string = function (input: DeckCardsEntry) {
    const list = [];
    for (let key in input) {
        const n = input[key];
        if (n > 0)
            list.push(n + " " + key);
    }

    return list.join("\n");
}

const scrollTop = function()
{
    const section = document.getElementById("APP_BAR");
    if (section)
        section.scrollIntoView( { behavior: 'smooth', block: 'start' } );
}

export default function DeckSelection({ selectDeckOpen, setSelectDeckOpen, room, deckList, roomImage, roomData }: DeckSelectionProps) {

    const handleClose = () => setSelectDeckOpen(false);

    const [currentDeckId, setCurrentDeckId] = React.useState("");
    const [viewDeckId, setViewDeckId] = React.useState("");
    const [currentDeckGroup, setCurrentDeckGroup] = React.useState("");
    const [gametype, setGametype] = React.useState(TYPE_STANDARD);
    const [allowDeckLoading, setAllowDeckLoading] = React.useState(true);
    const [allowGameChoice, setAllowGameChoice] = React.useState(true);
    const [gameTypeLabel, setGameTypeLabel] = React.useState(getGameTypeLabelButton(TYPE_STANDARD));
    const [allowStart, setAllowStart] = React.useState(false);
    const [currentDeckLoaded, setCurrentDeckLoaded] = React.useState<DeckCards | null>(null);
    const [allowGameTypeSelection, setAllowGameTypeSelection] = React.useState(true);
    const hideDeckSelection = roomData?.arda === true;
    const avatars = roomData.avatars && roomData.avatars?.length > 0 ? roomData.avatars : [];
    const [errorMessage, setErrorMessage] = React.useState("");
    const [snachMessage, setSnachMessage] = React.useState("");
    const [showCardList, setShowCardList] = React.useState<any>(null)

    const [showCustomDeck, setShowCustomDeck] = React.useState(false);
    const [textPool, setTextPool] = React.useState("");
    const [textDeck, setTextDeck] = React.useState("");
    const [textSideboard, setTextSideboard] = React.useState("");
    const [textSites, setTextSites] = React.useState("");
    const [textNotes, setTextNotes] = React.useState("");
    const [errorMessageFile, setErrorMessageFile] = React.useState("");
    const [roomImageUri, setRoomImageUri] = React.useState(roomImage);

    const onApplyCustomDeck = function (pool: string, deck: string, sideboard: string, sites: string, notes: string) {
        setCurrentDeckId("custom");
        CachedDecks["custom"] = {
            deck: ConvertCardsStringMap(deck),
            pool: ConvertCardsStringMap(pool),
            sideboard: ConvertCardsStringMap(sideboard),
            sites: ConvertCardsStringMap(sites),
            images: {},
            notes: notes.trim()
        }
        setShowCustomDeck(false);
        loadDeckById("custom");
        setSnachMessage("Deck loaded.");
    }

    const onCancelCustomDeck = function () {
        setShowCustomDeck(false);
    }

    const onStartGame = function () {
        setErrorMessage("");
        setErrorMessageFile("");
        const name = GetUserName();
        if (name === "") {
            setErrorMessage("Please set a display name");
            return;
        }

        if (currentDeckLoaded === null && roomData?.arda !== true) {
            setErrorMessage("Please select a deck");
            return;
        }

        const deckdata = createDeckPayload(currentDeckLoaded);

        const bodyData = {
            name: GetUserName(),
            dce: true,
            randomHazards: gametype === TYPE_SOLO_HAZ,
            deck: deckdata
        }

        fetch(PROXY_URL + "/" + getUrlPathByType(gametype) + "/" + room + "/login", {
            method: "POST",
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        })
            .then(res => {
                sessionStorage.setItem("deck-notes", deckdata.notes);

                if (res.status === 204)
                    window.location.href = PROXY_URL + "/play/" + room;
                else
                    return res.json();
            })
            .then((err: any) => {
                if (err?.message)
                    setErrorMessage(err.message);
            })
            .catch(err => {
                if (err) {
                    console.error(err);
                    setErrorMessage("Failed");

                }
            })
    }

    const updateDeckTextdata = function (deck: DeckCards | null) {
        setShowCustomDeck(false);
        if (deck === null) {
            setTextPool("");
            setTextDeck("");
            setTextSideboard("");
            setTextSites("");
            setTextNotes("");
        }
        else {
            setTextPool(map2string(deck.pool));
            setTextDeck(map2string(deck.deck));
            setTextSideboard(map2string(deck.sideboard));
            setTextSites(map2string(deck.sites));
            setTextNotes(deck.notes);
        }
    }

    const viewDeckById = function (deckid: string) {
        if (deckid === "") {
            return;
        }

        const val = CachedDecks[deckid];
        if (val) {
            setShowCardList(val);
            return;
        }

        FetchDeckById(deckid).then((data: DeckData) => {
            if (data.deck === "")
                return;

            const deck = ExploreDeckData(data);
            if (deck !== null) {
                CachedDecks[deckid] = deck;
                setShowCardList(deck);
            }
        });
    }

    const editDeckById = function (deckid: string) {
        if (deckid === "") {
            updateDeckTextdata(null);
            setShowCustomDeck(true);
            return;
        }

        const val = CachedDecks[deckid];
        if (val) {
            updateDeckTextdata(val);
            setShowCustomDeck(true);
            scrollTop();
            return;
        }

        FetchDeckById(deckid).then((data: DeckData) => {
            if (data.deck === "")
                return;

            const deck = ExploreDeckData(data);
            if (deck !== null) {
                CachedDecks[deckid] = deck;
                updateDeckTextdata(deck);
                setShowCustomDeck(true);
                scrollTop();
            }
        });
    }

    const loadDeckById = function (deckid: string, group:string = "") {
        setErrorMessageFile("");
        setErrorMessage("");
        if (deckid === "") {
            setCurrentDeckId("");
            updateDeckTextdata(null);
            setCurrentDeckLoaded(null);
            setAllowStart(false);
        }

        const val = CachedDecks[deckid];
        if (val) {
            setCurrentDeckId(deckid);
            setCurrentDeckLoaded(val);
            setAllowStart(true);
            updateDeckTextdata(val);
            updateGameTypeFromDeckGroup(group);
            scrollTop();
            return;
        }

        FetchDeckById(deckid).then((data: DeckData) => {
            if (data.deck === "")
                return;

            const deck = ExploreDeckData(data);
            if (deck !== null) {
                CachedDecks[deckid] = deck;
                setCurrentDeckId(deckid)
                updateGameTypeFromDeckGroup(group);
                setCurrentDeckLoaded(deck);
                setAllowStart(true);
                scrollTop();            
            }
        });
    }

    const updateGameType = function (val: string) {
        setGametype(val);
        setGameTypeLabel(getGameTypeLabelButton(val));
    }

    const updateGameTypeFromDeckGroup = function(group:string)
    {
        if (!allowGameTypeSelection)
            return;

        if (group.toLowerCase().startsWith("arda"))
            updateGameType(TYPE_ARDA);
        else if (group.toLowerCase().startsWith("solo"))
            updateGameType(TYPE_SOLO);
        else 
            updateGameType(TYPE_STANDARD);
    }

    React.useEffect(() => {

        setAllowDeckLoading(!roomData.exists || roomData.arda !== true)
        setGametype(roomData.arda === true ? TYPE_ARDA : TYPE_STANDARD);

        setAllowGameChoice(!roomData.exists);
        setAllowGameTypeSelection(!roomData.exists);

        setAllowStart(roomData?.arda === true);

        setGameTypeLabel(getGameTypeLabelButton(roomData.arda ? TYPE_ARDA : TYPE_STANDARD));
        setCurrentDeckGroup("");
        setViewDeckId("");
        setCurrentDeckId("");

        FetchSampleRooms().then(list => {
            for (let e of list) {
                if (e.name.toLowerCase() === room.toLowerCase()) {
                    setRoomImageUri(e.image);
                    break;
                }
            }
        })

    }, [roomData, room]);

    const createChallengeDeckCard = function (deck: DeckEntry, key: string, meta: DeckEntryMeta, labelColor: string, indexKey: string) {
        const tempDecks: any = deck.decks;
        const _deckid: string | undefined = tempDecks[key];
        if (_deckid === undefined || (currentDeckGroup !== "" && currentDeckGroup !== deck.name.toLowerCase()))
            return <></>;

        //divDeck.oncontextmenu = (e) => onDownloadDeck(e, _deckid, key);

        const imgAvatar = meta.avatar !== "" ? meta.avatar : BACKSIDE_IMAGE;
        const imgAvatarClass = meta.avatar !== "" ? "" : "avatar-backside";
        
        return (
            <Grid item xs={12} md={5} lg={4} className="room-game-list paddingRight1em" key={indexKey} data-deck-id={_deckid} data-deck-name={key} data-deck-group={deck.name.toLowerCase()} id={_deckid}>
                <Grid container className='blue-box'>
                    <Grid item xs={4} md={3}>
                        <div className="room-image room-image-game">
                            <img src={imgAvatar} alt={"avatar"} className={imgAvatarClass} decoding="async" />
                        </div>
                    </Grid>
                    <Grid item xs={8} md={9} className='paddingBottom1em paddingLeft1em'>
                        <h3>{key}</h3>
                        <Grid container>
                            <Grid item xs={12} md={8}>
                                <p>
                                    Deck: {meta?.resources} / {meta?.hazards}
                                    <br />Characters: {meta?.character}
                                    <br />Sideboard: {meta?.sideboard}
                                </p>
                            </Grid>
                            <Grid item xs={12} lg={4} >
                                <Grid container rowGap={2}>
                                    <Grid item xs={12}>
                                        <Button onClick={() => { viewDeckId === _deckid ? viewDeckById("") : viewDeckById(_deckid) }} title={Dictionary("home.lookatdeck", "Look at deck")}
                                            fullWidth
                                            variant='text'
                                            startIcon={viewDeckId === _deckid ? <VisibilityIcon /> : <RemoveRedEyeOutlinedIcon />}
                                        >
                                            {Dictionary("frontend.decklist.view", "View Deck")}
                                        </Button>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button onClick={() => { viewDeckId === _deckid ? editDeckById("") : editDeckById(_deckid) }} title={Dictionary("home.lookatdeck", "Look at deck")}
                                            fullWidth

                                            variant='text'
                                            startIcon={<BorderColorIcon />}
                                        >
                                            {Dictionary("frontend.decklist.edit", "Edit Deck")}
                                        </Button>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button
                                            fullWidth
                                            title={Dictionary("home.choosethisdeck", "Choose this deck to play")}
                                            variant={currentDeckId === _deckid ? "contained" : "outlined"}
                                            onClick={() => { currentDeckId === _deckid ? loadDeckById("") : loadDeckById(_deckid, deck.name) }}
                                            startIcon={currentDeckId === _deckid ? <CheckCircle /> : <CheckCircleOutlineIcon />}
                                        >
                                            {currentDeckId === _deckid ? "Selected" : "Select"}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} className='paddingBottom1em paddingLeft1em'>
                        <div className='deck-label'>
                            <span className={'deck-label-' + labelColor}>{deck.name}</span>
                        </div>
                    </Grid>
                </Grid>
            </Grid>

        );
    }

    const onDeckFileRead = function (e: any) {
        const contents = e.target.result;
        if (typeof contents !== "string" || contents === "" || contents.indexOf("#") === -1) {
            setErrorMessageFile(Dictionary("login.empty", "File seems to be empty..."));
            return;
        }

        const deck = ExploreDeckData({
            deck: contents,
            images: {}
        });

        if (deck === null) {
            setErrorMessageFile(Dictionary("deck.corrupt", "Could not read the deck file"));
            return;
        }

        CachedDecks["custom"] = deck;
        setCurrentDeckId("custom")
        setCurrentDeckLoaded(deck);
        setSnachMessage("Deck loaded");
        viewDeckById("custom");
        setAllowStart(true);
    }

    const onLoadLocalDeck = function (e: any) {
        setErrorMessageFile("");
        setErrorMessage("");

        const file = e.target.files[0];
        if (!file) {
            setErrorMessageFile(Dictionary("login.choosefile", "Please choose a file..."));
            return;
        }

        const reader = new FileReader();
        reader.onload = onDeckFileRead;
        reader.readAsText(file);
    }

    const createLabelDiv = function (elem: DeckEntry, index: number) {
        const color = getLabelColor(index);
        const count = Object.keys(elem.decks).length;
        if (count === 0)
            return <></>;

        const isSelected = currentDeckGroup !== "" && currentDeckGroup === elem.name.toLowerCase();

        return (
            <div className='deck-label marginBottom0-5em pointer' key={"label-" + index} onClick={() => currentDeckGroup === "" ? setCurrentDeckGroup(elem.name.toLowerCase()) : setCurrentDeckGroup(isSelected ? "" : elem.name.toLowerCase())}>
                <span data-deck-group={elem.name.toLowerCase()} className={"deck-label-" + color}>
                    {isSelected && (<><i className='fa fa-eye' />&nbsp;</>)}{elem.name} ({count})
                </span>
            </div>);
    }

    const getDialogTitle = function () {
        if (roomData?.arda)
            return Dictionary("home.joinarda", "Join the Arda game");

        return Dictionary("home.selectdeck", "Choose your deck to play")
    }

    return (
        <React.Fragment>
            <Dialog
                fullScreen
                open={selectDeckOpen}
                onClose={handleClose}
                TransitionComponent={Transition}
            >
                {snachMessage && (<Snackbar
                    open={snachMessage !== ""}
                    autoHideDuration={5000}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center'
                    }}
                    onClick={() => setSnachMessage("")}
                    onClose={() => setSnachMessage("")}
                    message={snachMessage} />)}
                <AppBar sx={{ position: 'relative' }} id="APP_BAR">
                    <Toolbar>
                        <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                            {getDialogTitle()} @ {room.toUpperCase()}
                        </Typography>
                        <Button color="inherit" onClick={handleClose}>
                            <CloseIcon /> {Dictionary("cancel", "ESC to cancel")}
                        </Button>
                    </Toolbar>
                </AppBar>
                <Grid container className='padding2em1m' rowGap={1}>
                    {roomImage !== "" && (<Grid item xs={3} sm={2} className="paddingRight1em">
                        <div className="room-image room-image-choose">
                            <img src={roomImageUri} alt="Ambience room" decoding="async" />
                        </div>
                    </Grid>)}
                    <Grid item xs={8} sm={6}>
                        <FormControl disabled={!allowGameChoice}>
                            <FormLabel id="demo-radio-buttons-group-label">{Dictionary("home.gametype", "Choose a game")}</FormLabel>
                            <RadioGroup
                                aria-labelledby="demo-radio-buttons-group-label"
                                name="radio-buttons-group"
                                value={gametype}
                                onChange={(e) => updateGameType(e.target.value)}
                            >
                                <FormControlLabel disabled={!allowGameTypeSelection} value={TYPE_ARDA} control={<Radio />} label="Arda" />
                                <FormControlLabel disabled={!allowGameTypeSelection} value={TYPE_STANDARD} control={<Radio />} label="Standard / DC" />
                                <FormControlLabel disabled={!allowGameTypeSelection} value={TYPE_SOLO} control={<Radio />} label={Dictionary("home.gametype.solo", "Solitary")} />
                                <FormControlLabel disabled={!allowGameTypeSelection} value={TYPE_SOLO_HAZ} control={<Radio />} label={Dictionary("home.gametype.solorandom", "Solitary Mode with random hazard deck")} />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3} alignContent={"center"}>
                        <Grid container rowGap={2} >
                            <Grid item xs={12}>
                                {errorMessage !== "" && (<Alert severity="error">{errorMessage}</Alert>)}
                                <Button disabled={!allowStart} onClick={onStartGame} fullWidth variant='contained' startIcon={<PlayCircleFilledIcon />} >{Dictionary("frontend.menu.play", "Play")} {gameTypeLabel}</Button>
                            </Grid>
                            <Grid item xs={12}>
                                {errorMessageFile !== "" && (<Alert severity="error">{errorMessageFile}</Alert>)}
                                <input className='displayNone' id="meccg-open-dialog" type="file" onChange={onLoadLocalDeck} />
                                <Button
                                    onClick={() => document.getElementById("meccg-open-dialog")?.click()}
                                    disabled={!allowDeckLoading} fullWidth variant='outlined' startIcon={<ScreenSearchDesktopIcon />} >{Dictionary("frontend.loadeck", "Load Deck")}</Button>

                            </Grid>
                            <Grid item xs={12}>
                                <Button disabled={!allowDeckLoading} onClick={() => {
                                    if (!showCustomDeck)
                                        editDeckById("custom")
                                    else
                                        setShowCustomDeck(false);
                                }}
                                    fullWidth startIcon={<BrowserUpdatedIcon />} >{Dictionary("frontend.importdeck", "Import / Edit Deck")}</Button>
                            </Grid>
                        </Grid>
                    </Grid>
                    {!hideDeckSelection && (<>

                        {showCustomDeck && (
                            <CustomDeckInput
                                pool={textPool}
                                deck={textDeck}
                                sideboard={textSideboard}
                                sites={textSites}
                                notes={textNotes}
                                onUpdate={onApplyCustomDeck}
                                onCancel={onCancelCustomDeck}
                            />
                        )}
                        {deckList.length === 0 ? <>
                            <Grid item xs={12} textAlign="center" className='padding2em1m'>
                                <h3>No decks available</h3>
                                <p>Please load or import your own decks.</p>
                            </Grid>
                        </> : <>

                            <Grid item xs={12} textAlign="center" className='padding2em1m'>
                                <h3>Deck Selection</h3>
                                <p>Choose a deck or click here to load/import a deck</p>

                                {deckList.map((entry, index) => createLabelDiv(entry, index))}
                            </Grid>

                            <Grid container rowGap={2} justifyContent="center" className='padding2em1m'>
                                {deckList.map((deckGroup, index) => {
                                    const res: any = [];
                                    const color = getLabelColor(index);
                                    let i = 0;
                                    const deckList: any = deckGroup.decks;
                                    const deckGroupMeta: any = deckGroup.meta;
                                    for (let deckName in deckList) {
                                        const deckUid = deckList[deckName] ?? "null";
                                        const deckData = deckGroupMeta[deckUid]
                                        if (deckData !== undefined)
                                            res.push(createChallengeDeckCard(deckGroup, deckName, deckData, color, "deck-" + index + "-" + (++i)));
                                    }
                                    return res;
                                })}
                            </Grid>
                        </>}
                    </>)}
                </Grid>
                {showCardList !== null && (<ViewDeckCards imageMap={showCardList.images} notes={showCardList.notes} onClose={() => setShowCardList(null)} />)}
            </Dialog>
        </React.Fragment>
    );
}