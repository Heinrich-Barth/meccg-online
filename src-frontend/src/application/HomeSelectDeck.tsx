import React from "react";
import DeckSelection from "./DeckSelection";
import FetchDeckList from "../operations/FetchDeckLists";
import { BACKSIDE_IMAGE, DeckEntry } from "./Types";
import GetGameData, { GameData } from "../operations/FetchGameData";
import { Navigate, useParams } from "react-router-dom";
import { validatRoomName } from "./Home";
import { Backdrop, LinearProgress } from "@mui/material";

let deckList:DeckEntry[] = [];
let roomData:GameData = { exists: false }


function RenderIsLoading() {
    return <Backdrop
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={true}
    >
        <LinearProgress color="inherit" />
    </Backdrop>;
}

export default function HomeSelectDeck() {
    const { room } = useParams();
    const [selectDeckOpen, setSelectDeckOpen] = React.useState(false);
    const [redirectPlay, setRedirectPlay] = React.useState(false);
    const onCloseFrame = () => {
        setRedirectPlay(true);
    }
    React.useEffect(() => {

        setRedirectPlay(false);
        setSelectDeckOpen(false);

        if (room === undefined || room === "" || validatRoomName(room) !== "")
        {
            setRedirectPlay(true);
            setSelectDeckOpen(false);
            return;
        }

        GetGameData(room).then((info) => {

            if (info.allowPlayers === false)
            {
                setRedirectPlay(true);
                setSelectDeckOpen(false);
                return;
            }
                
            roomData = info;
            FetchDeckList()
            .then((list) => deckList = list.sort((a,b) => a.name.localeCompare(b.name)))
            .finally(() => setSelectDeckOpen(true));

        })

    }, [room, setRedirectPlay, setSelectDeckOpen]);

    return <React.Fragment>
        {redirectPlay && (<Navigate to="/play" />)}
        {!redirectPlay && !selectDeckOpen && (<RenderIsLoading />)}
        {!redirectPlay && (<>
            <DeckSelection
                selectDeckOpen={selectDeckOpen}
                setSelectDeckOpen={onCloseFrame}
                room={room ?? ""}
                deckList={deckList}
                roomImage={BACKSIDE_IMAGE}
                roomData={roomData}
            />
        </>)}
    </React.Fragment>
}