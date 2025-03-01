import React from "react";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import SaveIcon from '@mui/icons-material/Save';
import DownloadDialog from "../operations/DownloadDialog";

 async function SaveDeckDialog(data: string|null) {

    if (data === null || data === "")
        return;

    await DownloadDialog(
        data, 
        'autosave.meccg-savegame', 
        [{
            description: 'Deck file',
        }]
    );

}

export default function Autosave() {
    const [hasSaved, setHasSaved] = React.useState(sessionStorage?.getItem("meccg_autosave") !== null);

    const clearAutosave = function () {
        if (sessionStorage.getItem("meccg_autosave"))
            sessionStorage.removeItem("meccg_autosave");

        setHasSaved(false);
    }

    const doSaveAutosave = function()
    {
        SaveDeckDialog(sessionStorage.getItem("meccg_autosave")).finally(() => clearAutosave());
    }

    if (!hasSaved)
        return <></>;

    return <React.Fragment>
        <Dialog
            open={hasSaved}
            onClose={() => clearAutosave()}
        >
            <DialogTitle id="alert-dialog-title">
                Autosave found
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    There is an autosave available. Do you want to save it now?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => clearAutosave()} variant="outlined">Discard it</Button>
                <Button onClick={() => doSaveAutosave()} autoFocus variant="contained" startIcon={<SaveIcon />}>
                    Save game
                </Button>
            </DialogActions>
        </Dialog>
    </React.Fragment>
}