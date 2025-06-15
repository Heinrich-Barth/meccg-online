import { LinearProgress, Grid, Typography } from "@mui/material";
import React from "react";
import MeccgLogo from "../components/MeccgLogo";
import FetchSampleRooms from "../operations/FetchSampleRooms";
import FetchDeckList from "../operations/FetchDeckLists";
import { CacheRequestData } from "../operations/SubmitAnswer";
import { LoadDictionary } from "../components/Dictionary";
import { Navigate } from "react-router-dom";

const Prefetch:any = {
    "/data/list/images": "Images",
    "/data/list/sites": "Sites",
    "/data/list/gamedata": "Game data",
    "/data/list/stages": "Stages",
    "/data/list/avatars": "Avatars",
    "/data/list/filters": "Filters",
    "/data/decks": "Decks",
    "/data/list/underdeeps": "Underdeeps",
    "/data/list/map": "Map data",
    "/data/list/cards": "Cards",
    "/media/assets/js/jquery.min.js": "Drag and Drop Module Framework",
    "/media/assets/js/jquery-ui.min.js": "Drag and Drop Module",
    "/media/assets/js/jquery-ui.touch-punch.min.js": "Mobile drag and drop module",
    "/media/assets/js/leaflet.js": "Map Framework",
    "/media/assets/js/leaflet.js.map": "Map Framework",
};

let isCaching = false;
let isCompleted = false;

export default function CacheData() {

    const [loadingLabel, setLoadingLabel] = React.useState("");
    const [doRedirect, setDoRedirect] = React.useState(false);


    const onSuccessfulLogin = React.useCallback(async function () {
        if (isCaching)
            return;

        isCaching = true;

        setLoadingLabel("Deck List");
        await FetchDeckList();

        setLoadingLabel("Room List");
        await FetchSampleRooms();

        setLoadingLabel("Dictionary")
        await LoadDictionary("");

        for (let uri in Prefetch)
        {
            const val = Prefetch[uri];
            if (val)
            {
                setLoadingLabel(val);
                await CacheRequestData(uri);
            }
        }

        isCompleted = true;
        setDoRedirect(true);
    }, []);

    const initialized = React.useRef(false)
    React.useEffect(() => {

        if (isCompleted)
        {
            setDoRedirect(true);
            return;
        }
        
        if (initialized.current) 
            return;

        initialized.current = true
        onSuccessfulLogin();

    }, [setDoRedirect, onSuccessfulLogin]);

    return <>
        <div className="application-home paddingTop10em">
            <Grid container spacing={2} justifyContent="center">
                <Grid item xs={10} md={6} lg={3} textAlign={"center"} className="paddingBottom3em">
                    <Grid container spacing={2} justifyContent="center">
                        <Grid item xs={10} md={8} textAlign={"center"} className="paddingBottom3em">
                            {MeccgLogo()}
                        </Grid>
                        <Grid item xs={10} textAlign={"center"}>
                            <Typography variant="body1" component="p" className="paddingBottom1em">Loading {loadingLabel}</Typography>
                        </Grid>
                        <Grid item xs={10} textAlign={"center"}>
                            <LinearProgress color="inherit" />
                        </Grid>
                        {doRedirect && (<Navigate to="/play" />)}
                    </Grid>
                </Grid>

            </Grid>
        </div>
    </>
}