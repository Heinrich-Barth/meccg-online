import React from "react";
import DeckSelection from "./DeckSelection";
import FetchDeckList, { DeckEntry } from "../operations/FetchDeckLists";
import { BACKSIDE_IMAGE } from "./Types";
import GetGameData, { GameData } from "../operations/FetchGameData";
import { Navigate, useParams } from "react-router-dom";
import { validatRoomName } from "./Home";

let deckList:DeckEntry[] = [];
let roomData:GameData = { exists: false }

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
            .then((list) => deckList = list)
            .finally(() => setSelectDeckOpen(true));

        })

    }, [room, setRedirectPlay, setSelectDeckOpen]);

    return <React.Fragment>
        {redirectPlay && (<Navigate to="/play" />)}
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