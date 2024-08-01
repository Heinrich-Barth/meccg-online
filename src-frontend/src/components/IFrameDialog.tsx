

import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import PROXY_URL from '../operations/Proxy';
import Dictionary from './Dictionary';
import { Navigate } from 'react-router-dom';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

type Parameters = {
    url: string;
    title: string;
}

export default function IFrameDialog({ url, title }: Parameters) {

    const [visible, setVisible] = React.useState(true);
    const [thisurl, setUrl] = React.useState("/blank");
    const [thistitle, setTitle] = React.useState("");
    const [renderRedirect, setRenderRedirect] = React.useState(false);

    const handleClose = () => {
        setUrl("/blank");
        setVisible(false);
        setRenderRedirect(true);
    }
    
    React.useEffect(() => {
        setUrl(PROXY_URL + url);
        setTitle(title);
        setVisible(true);
        setRenderRedirect(false);
    }, [title, url, setVisible, setRenderRedirect]);

    return (
        <React.Fragment>
            {renderRedirect && (<Navigate to="/play" />)}
            <Dialog
                fullScreen
                open={visible}
                onClose={handleClose}
                TransitionComponent={Transition}
            >
                <AppBar sx={{ position: 'relative' }}>
                    <Toolbar>
                        <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                            {thistitle}
                        </Typography>
                        <Button color="inherit" onClick={handleClose} startIcon={<CloseIcon />}>
                            {Dictionary("frontend.esctoclose", "ESC to close")}
                        </Button>
                    </Toolbar>
                </AppBar>
                <iframe className={"iframe"} src={thisurl} title={thistitle} />
            </Dialog>
        </React.Fragment>
    );
}