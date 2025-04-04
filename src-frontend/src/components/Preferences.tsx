import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Save from '@mui/icons-material/Save';
import TextField from '@mui/material/TextField';
import { Alert, Grid } from '@mui/material';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Dictionary from './Dictionary';
import FetchSampleName from '../operations/FetchSampleNames';
import LoadAvatar, { SetCurrentAvatar } from './LoadAvatar';
import { DeleteForeverOutlined } from '@mui/icons-material';

const saveLocalStorageUsername = function (val: string) {
    if (val !== "")
        localStorage.setItem("meccg_username", val);
}

const getLocalStorageUsername = function () {
    const val = localStorage.getItem("meccg_username");
    return typeof val === "string" ? val.trim() : "";
}

const saveLocalStorageCardLanguage = function (val: string) {
    if (val !== "")
        localStorage.setItem("meccg_cards", val);
    else if (localStorage.getItem("meccg_cards"))
        localStorage.removeItem("meccg_cards");
}

const getLocalStorageCardLanguage = function () {
    const val = localStorage.getItem("meccg_cards");
    return typeof val === "string" ? val.trim() : "";
}

export function HasUserName() {
    return getLocalStorageUsername() !== "";
}

export function GetUserName() {
    return getLocalStorageUsername();
}

export function SetDefaultUsername() {
    if (!HasUserName())
        FetchSampleName().then(saveLocalStorageUsername);
}

let g_sCurrentAvatar = "";
let g_sAvatarImage = "";

export default function Preferences(props: { onClose: Function, onCallbackUpdate?: Function | undefined }) {

    const [username, setUsername] = React.useState(getLocalStorageUsername());
    const [cardLanguage, setCardLanguage] = React.useState(getLocalStorageCardLanguage());
    const [errorMessage, setErrorMessage] = React.useState("");
    const [cacheCleared, setCacheCleared] = React.useState(false);

    const handleClose = () => props.onClose(username !== "");

    const validateUsername = function (sName: string) {
        if (sName === "" || sName.length < 4)
            return "Enter valid username with at least 4 characters.";
        else if (!sName.match(/^[0-9a-zA-Z]+$/))
            return "Please only use latin characters or numbers (a-zA-Z0-9)";
        else if (sName.length > 20)
            return "Your username may only have 20 characters"
        else
            return "";
    };

    const deleteCache = function() {

        fetch("/data/clearcache").then((res) => {
            if (res.ok)
                setCacheCleared(true);
        })
        .catch(console.error);
    }

    const saveChanges = function () {
        const msg = validateUsername(username);
        if (msg !== "") {
            setErrorMessage(msg);
            return;
        }

        saveLocalStorageCardLanguage(cardLanguage)
        saveLocalStorageUsername(username);
        if (props.onCallbackUpdate)
            props.onCallbackUpdate(username, g_sCurrentAvatar, g_sAvatarImage);

        SetCurrentAvatar(g_sCurrentAvatar, g_sAvatarImage);
        props.onClose();
    }

    return <>
        <Dialog
            open={true}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            className='padding1em2m'
        >
            <DialogTitle id="alert-dialog-title">
                {Dictionary("frontend.configuration", "Preferences")}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={4} textAlign={"center"}>
                        <LoadAvatar onValidAvatar={(code:string, image:string) => {
                            g_sCurrentAvatar = code;
                            g_sAvatarImage = image;
                        }} />
                    </Grid>
                    <Grid item xs={8}>
                        <DialogContentText className='paddingBottom1em'>{Dictionary("frontend.setuser", "You can set your display name so other players may recognise you")}</DialogContentText>
                        <TextField id="enter_room" value={username} variant="standard" margin="dense" autoFocus onChange={(e) => setUsername(e.target.value.trim())} fullWidth label="Your display name" placeholder="Your name may only contain a-zA-Z0-9" />
                        {errorMessage !== "" && (<Alert severity="error">{errorMessage}</Alert>)}

                        <FormControl className='marginTop2em'>
                            <FormLabel id="demo-radio-buttons-group-label">Card Language</FormLabel>
                            <RadioGroup
                                aria-labelledby="demo-radio-buttons-group-label"
                                name="radio-buttons-group"
                                value={cardLanguage}
                                onChange={(e) => setCardLanguage(e.target.value)}
                            >
                                <FormControlLabel value="" control={<Radio />} label={Dictionary("home.useenglish", "Prefer English cards")} />
                                <FormControlLabel value="cards-fr" control={<Radio />} label={Dictionary("home.usesfrench", "Prefer French cards (if available)")} />
                                <FormControlLabel value="cards-es" control={<Radio />} label={Dictionary("home.usespanish", "Prefer Spanish cards (if available)")} />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} textAlign={"center"}>
                        {!cacheCleared && (<>
                            This app uses caching. Click <Button variant='text' startIcon={<DeleteForeverOutlined />} onClick={deleteCache}>here</Button> to clear caches and reload.
                        </>)}
                        {cacheCleared && (<Alert severity='success'>Cache cleared. Please refresh your screen.</Alert>)}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions className="padding1em2m">
                <Button onClick={handleClose}>{Dictionary("cancel", "Cancel")}</Button>
                <Button onClick={saveChanges} variant='contained' startIcon={<Save />}>
                    {Dictionary("seat_save", "Save changes")}
                </Button>
            </DialogActions>
        </Dialog>
    </>
}