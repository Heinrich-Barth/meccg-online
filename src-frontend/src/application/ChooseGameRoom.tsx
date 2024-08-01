import React from "react";
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { TransitionProps } from "@mui/material/transitions";
import Typography from "@mui/material/Typography";
import { Slide, Button, Grid } from "@mui/material";
import { SampleRoom } from "../operations/FetchSampleRooms";
import CloseIcon from '@mui/icons-material/Close';


const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="down" ref={ref} {...props} />;
});

export default function ChooseGameRoom({ rooms, onChosen }: { onChosen: Function, rooms: SampleRoom[] }) {
    const handleClose = () => onChosen("");

    return (<>
        <Dialog
            fullScreen
            open={true}
            onClose={handleClose}
            TransitionComponent={Transition}
        >
            <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                        Click on an image to choose your room to play
                    </Typography>
                    <Button color="inherit" onClick={handleClose}>
                        <CloseIcon /> ESC to cancel
                    </Button>
                </Toolbar>
            </AppBar>
            <Grid container className="padding2em1m" rowGap={1}>
                {rooms.map((room, index) =>
                (<Grid item xs={3} sm={3} md={1}  className="paddingRight1em" key={"r" + index}>
                    <div className="room-image room-image-choose pointer" onClick={() => onChosen(room.name)} title={room.name}>
                        <img src={room.image} alt="Ambience room" />
                    </div>
                </Grid>))}
            </Grid>
        </Dialog>
    </>);
}