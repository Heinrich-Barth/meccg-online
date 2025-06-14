

import * as React from 'react';
import Button from '@mui/material/Button';
import FetchDeckList, { FetchDeckById } from '../operations/FetchDeckLists';
import { Grid } from '@mui/material';
import { BACKSIDE_IMAGE, DeckCards, DeckCardsEntry, DeckData, DeckEntry, DeckEntryMeta } from './Types';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import { GameData } from '../operations/FetchGameData';
import ExploreDeckData from '../operations/ExploreDeckData';
import Dictionary from '../components/Dictionary';
import { InitCustomDeck } from '../components/CustomDeckInput';
import ViewDeckCards from '../components/ViewDeckCards';

const getLabelColor = function (index: number) {
    const labelColors = ["red", "green", "blue", "yellow", "pink"];
    if (index <= 0)
        index = 0;

    while (index > labelColors.length)
        index -= labelColors.length;

    return labelColors[index];
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

CachedDecks["custom"] = {
    deck: {},
    pool: {},
    sideboard: {},
    sites: {},
    images: {},
    notes: ""
};

export default function ExploreDecks() {

    const [deckList, setDeckList] = React.useState<DeckEntry[]>([]);

    const [viewDeckId, setViewDeckId] = React.useState("");
    const [currentDeckGroup, setCurrentDeckGroup] = React.useState("");
    const [showCardList, setShowCardList] = React.useState<DeckCards|null>(null)

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

    React.useEffect(() => {

        setViewDeckId("");
        InitCustomDeck();

        FetchDeckList()
        .then((list) => setDeckList(list))


    }, [setViewDeckId, setDeckList]);

    const createChallengeDeckCard = function (deck: DeckEntry, key: string, meta: DeckEntryMeta, labelColor: string, indexKey: string) {
        const tempDecks: any = deck.decks;
        const _deckid: string | undefined = tempDecks[key];
        if (_deckid === undefined || (currentDeckGroup !== "" && currentDeckGroup !== deck.name.toLowerCase()))
            return <React.Fragment key={indexKey} />;

        const imgAvatar = meta.avatar !== "" ? meta.avatar : BACKSIDE_IMAGE;
        const imgAvatarClass = meta.avatar !== "" ? "" : "avatar-backside";

        return (
            <Grid item xs={12} md={6} lg={4} className="room-game-list paddingRight1em" key={indexKey} data-deck-id={_deckid} data-deck-name={key} data-deck-group={deck.name.toLowerCase()} id={_deckid}>
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
                            <Grid item xs={12} md={4} alignContent={"center"}>
                                <Button 
                                    onClick={() => { viewDeckId === _deckid ? viewDeckById("") : viewDeckById(_deckid) }} title={Dictionary("home.lookatdeck", "Look at deck")}
                                    className='buttonLeft'
                                    variant='contained'
                                    startIcon={viewDeckId === _deckid ? <VisibilityIcon /> : <RemoveRedEyeOutlinedIcon />}
                                >
                                    {Dictionary("frontend.decklist.view", "View")}
                                </Button>
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

    return (
        <React.Fragment>

            <Grid container className='padding2em1m' rowGap={1}>
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
            </Grid>
            {showCardList !== null && (
                <ViewDeckCards
                    imageMap={showCardList.images}
                    notes={showCardList.notes}
                    deck={showCardList.deck}
                    pool={showCardList.pool}
                    sideboard={showCardList.sideboard}
                    sites={showCardList.sites}
                    onClose={() => setShowCardList(null)}
                />
            )}
        </React.Fragment>
    );
}
