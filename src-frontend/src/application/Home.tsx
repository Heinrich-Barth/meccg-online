import { Alert, Button, Grid } from "@mui/material";
import React from "react";
import StyleIcon from '@mui/icons-material/Style';
import TextField from '@mui/material/TextField';
import MeccgLogo from "../components/MeccgLogo";
import FetchActiveGames, { ActiveGame } from "../operations/FetchActiveGames";
import FetchSampleRooms, { SampleRoom } from "../operations/FetchSampleRooms";
import FetchDeckList, { DeckEntry } from "../operations/FetchDeckLists";
import { BACKSIDE_IMAGE } from "./Types";
import GetGameData from "../operations/FetchGameData";
import ChooseGameRoom from "./ChooseGameRoom";
import Dictionary from "../components/Dictionary";
import { PlayerIsAlreadyPlaying } from "../operations/IsPresentInGame";
import PROXY_URL from "../operations/Proxy";
import AddBoxIcon from '@mui/icons-material/AddBox';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import EditIcon from '@mui/icons-material/Edit';
import { Navigate } from "react-router-dom";

const calcDuration = function (time: number) {
    if (time < 1)
        return "now"

    return new Date(time).getUTCMinutes() + "min";
}

const getGameType = function (game: ActiveGame) {
    if (game.single)
        return "Solo";
    else if (game.arda)
        return "Arda";
    else
        return "Standard | DC";
}

const listActiveGames = function (list: ActiveGame[], sampleRooms: SampleRoom[], onJoin: Function, onWatch: Function) {
    if (list.length === 0)
        return <></>;

    return <Grid container columnGap={1} rowGap={0} className="paddingTop4em paddingLeft2em paddingRight2em">
        <Grid item xs={12} textAlign={"center"}>
            <h2><span data-translation="home.currentgames">Current Games</span></h2>
            <p className="center" data-translation="home.clickongame">Click on a game to join or watch</p>
        </Grid>
        {list.map((game, key) => <Grid item xs={12} md={5} className="room-game-list blue-box paddingRight1em" key={"room" + key} >
            <Grid container>
                <Grid item xs={4} md={3}>
                    <div className="room-image room-image-game">
                        <img src={getRoomImage(game.room, sampleRooms)} decoding="async" alt="ambience" />
                    </div>
                </Grid>
                <Grid item xs={8} md={9}>
                    <h3>{game.room} <span className="game-duration fa fa-clock-o"> {calcDuration(game.duration)}</span></h3>
                    <Grid container>
                        <Grid item xs={12} md={10}>
                            <ul className="player-list">
                                {game.players.map((player, key) => <li key={key}> {player.name} ({player.score < 0 ? 0 : player.score})</li>)}
                            </ul>
                            <ul className="avatar-list">
                                {game.avatars.map((src, key) => <li key={key}><img decoding="async" src={src} alt="avatar" /></li>)}
                            </ul>
                        </Grid>
                        <Grid item xs={12} md={2} alignContent={"center"}>
                            <Grid container rowGap={2}>
                                <Grid item xs={12}>
                                    <Button disabled={!game.accessible || game.single} startIcon={<AddBoxIcon />} fullWidth variant="contained" onClick={() => onJoin(game.room)}>PLAY</Button>
                                </Grid>
                                <Grid item xs={12}>
                                    <Button disabled={!game.visitors || game.single} startIcon={<RemoveRedEyeIcon />} className="marginTop1em" fullWidth onClick={() => onWatch(game.room)}>WATCH</Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <div>{getGameType(game)}</div>
                </Grid>
            </Grid>
        </Grid>
        )}
    </Grid>
}

// Code from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min: number, max: number) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

const chooseRandomRoomName = function (activeGames: ActiveGame[]) {

    if (sampleRooms.length === 0) {
        return {
            room: "room" + Date.now(),
            image: BACKSIDE_IMAGE
        };
    }

    const map: any = {};
    for (let e of sampleRooms)
        map[e.name] = e.image;

    for (let game of activeGames) {
        if (map[game.room] !== undefined)
            delete map[game.room];
    }

    const keys = Object.keys(map);
    const size = keys.length;

    if (size === 0) {
        return {
            room: "room" + Date.now(),
            image: BACKSIDE_IMAGE
        };
    }

    const idx = getRandomInt(0, size);
    return {
        room: keys[idx],
        image: "" + map[keys[idx]]
    }
}


const getRoomByName = function (room: string): SampleRoom {

    for (let e of sampleRooms) {
        if (e.name.toLowerCase() === room.toLowerCase())
            return e;
    }

    return {
        name: "room" + Date.now(),
        image: BACKSIDE_IMAGE
    };
}

const getRoomImage = function (room: string, rooms: SampleRoom[]) {
    room = room.toLowerCase();
    for (let e of rooms) {
        if (e.name.toLowerCase() === room)
            return e.image;
    }

    return BACKSIDE_IMAGE;
}

let sampleRooms: SampleRoom[] = [];

export function validatRoomName(sName: string) {
    if (sName === "" || sName.length < 4)
        return "Enter valid room name with at least 4 characters.";
    else if (!sName.match(/^[0-9a-zA-Z]+$/))
        return "Please only use latin characters or numbers (a-zA-Z0-9)";
    else if (sName.length > 100)
        return "Your room name may only have 100 characters"
    else
        return "";
};

export function GetSampleRooms()
{
    return sampleRooms;
}

const getInitDeckSelection = function () {
    const url = new URL(window.location.href);

    if ("select" !== url.searchParams.get("action"))
        return "";

    const room = url.searchParams.get("room");
    if (room === null || room === "")
        return "";

    url.searchParams.delete("room");
    url.searchParams.delete("action");
    if (validatRoomName(room) === "")
        return room;
    else
        return "";
}

export default function Home() {

    const [activeGames, setActiveGames] = React.useState<ActiveGame[]>([]);
    const [roomImagUri, setRoomImageUri] = React.useState("");
    const [roomName, setRoomName] = React.useState(getInitDeckSelection());
    const [roomError, setRoomError] = React.useState("");
    const [selectDeckOpen, setSelectDeckOpen] = React.useState(false);
    const [deckList, setDeckList] = React.useState<DeckEntry[]>([]);
    const [chooseRoom, setChooseRoom] = React.useState(false);
    const [watchGame, setWatchGame] = React.useState("");
   
    const onWatch = (room: string) => setWatchGame(room);
    
    const onJoin = async (room: string) => {

        try
        {
            const ispresent = await PlayerIsAlreadyPlaying(room);
            if (ispresent)
            {
                window.location.href = PROXY_URL + "/play/" + room;
                return;                
            }
        }
        catch (err)
        {
            console.error(err);
        }

        try
        {
            const info = await GetGameData(room);
            if (info)
            {   
                if (info.allowPlayers === false)
                    setRoomError("You cannot join this room");
                else
                {
                    setRoomName(room);
                    onStartOrJoinGame(room);    
                }
            }
        }
        catch (err)
        {
            console.error(err);
        }
    }

    const onUpdateRoomName = function (data: { room: string, image: string }) {
        if (data.image !== "")
            setRoomImageUri(data.image);

        setRoomName(data.room.toLowerCase());
    }

    const onChangeRoomName = function (room: string) {
        if (room !== "") {
            const data = getRoomByName(room);
            setRoomName(data.name);
            setRoomImageUri(data.image);
        }

        setChooseRoom(false);
    }

    const onSelectDeck = function () {
        const msg = validatRoomName(roomName);
        if (msg !== "") {
            setRoomError(msg);
            return;
        }

        setRoomError("");
        GetGameData(roomName).then((info) => {
            if (info.allowPlayers === false)
                setRoomError("You cannot join this room");
            else
                onStartOrJoinGame(roomName);
        });
    }

    const initialized = React.useRef(false)
    React.useEffect(() => {

        setWatchGame("");
        setSelectDeckOpen(false);

        if (initialized.current) return;

        initialized.current = true

        FetchSampleRooms().then((list) => sampleRooms = list).finally(() => FetchActiveGames().then(setActiveGames).finally(() => 
        {
            if (roomName === "")
                onUpdateRoomName(chooseRandomRoomName(activeGames))
        }));

        setInterval(() => FetchActiveGames().then((res) => setActiveGames(res)), 1000 * 10);
        
    }, [activeGames, roomName, setWatchGame, setSelectDeckOpen]);

    const onStartOrJoinGame = function (room: string) {
        if (room === "")
            return;

        if (deckList.length > 0) {
            setSelectDeckOpen(true);
            return;
        }

        FetchDeckList().then((list) => setDeckList(list)).finally(() => {
            setSelectDeckOpen(true);
        });
    }
   
    return <React.Fragment>
        <div className={"application-home "}>
            <Grid container spacing={2} justifyContent="center">
                <Grid item xs={10} md={8} textAlign={"center"} className="paddingBottom3em">
                    {MeccgLogo()}
                </Grid>
                <Grid item xs={10} sm={8} lg={6} textAlign={"center"}>
                    <h1 data-translation="home.startgame">{Dictionary("home.startgame", "Start a game")}</h1>
                    <p className="center padBottom10" data-translation="home.choosegame">{Dictionary("home.choosegame", "Choose your game name and click on Continue & choose deck or check out how to play")}</p>

                    <Grid container justifyContent="center">
                        <Grid item xs={4} md={3}>
                            <div className="room-image room-image-choose" onClick={() => setChooseRoom(true)}>
                                <img src={roomImagUri !== "" ? roomImagUri : BACKSIDE_IMAGE} alt="Ambience room" decoding="async" />
                                <span className="room-image-edit"><EditIcon /></span>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={8} className="room-text">
                            <Grid container rowGap={1} columnGap={2}>
                                <Grid item xs={12} className="room-text-container">
                                    <TextField id="enter_room" value={roomName} onChange={(e) => setRoomName(e.target.value.trim())} fullWidth label={Dictionary("frontend.gamename", "Your game name")} placeholder={Dictionary("frontend.gamename", "Your game name") + " (a-zA-Z0-9)"} variant="filled" />
                                    {roomError !== "" && (<Alert severity="error">{roomError}</Alert>)}
                                </Grid>

                                <Grid item xs={12}>
                                    <Button fullWidth size="medium" variant="contained" onClick={onSelectDeck}><StyleIcon /> Choose deck to play</Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                {listActiveGames(activeGames, sampleRooms, onJoin, onWatch)}
            </Grid>
        </div>
        {selectDeckOpen && (<Navigate to={"/play/" + roomName} />)}
        {chooseRoom && (<ChooseGameRoom rooms={sampleRooms} onChosen={onChangeRoomName} />)}
        {watchGame !== "" && (<Navigate to={"/watch/" + watchGame} />)}
    </React.Fragment>
}