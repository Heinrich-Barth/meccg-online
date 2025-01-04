import * as React from "react";
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Avatar, Badge, Box, Button, Stack } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import StyleIcon from '@mui/icons-material/Style';
import MapIcon from '@mui/icons-material/Map';
import InfoIcon from '@mui/icons-material/Info';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import { BACKSIDE_IMAGE, MenuSelection } from "./Types";
import Dictionary, { LoadDictionary } from "../components/Dictionary";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { Link } from "react-router-dom";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FetchTournaments from "../operations/FetchTournaments";

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});


export default function Menu(props: { onMenuChange: Function, username:string, hasUsername: boolean, avatarCode:string, avatarImage:string }) {

    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [openLanguageChanged, setOpenLanguageChanged] = React.useState(false);

    const handleClose = () => window.location.reload();
    const collapseMenu = () => setDrawerOpen(false);

    const toggleDrawer = (open: boolean) =>
        (event: React.KeyboardEvent | React.MouseEvent) => {
            if (
                event.type === 'keydown' &&
                ((event as React.KeyboardEvent).key === 'Tab' ||
                    (event as React.KeyboardEvent).key === 'Shift')
            ) {
                return;
            }

            setDrawerOpen(open);
        };

    const loadDictionary = (lang: string) => {
        setDrawerOpen(false);
        LoadDictionary(lang).then((res) => {
            if (res)
                setOpenLanguageChanged(true);
        })
    }

    const list = () => (
        <Box sx={{ minWidth: 250 }} role="presentation">
            <List>
                <ListItem>
                    <ListItemText
                        primary="Middle-Earth CCG"
                        primaryTypographyProps={{ fontSize: "0.9em", textTransform: "uppercase" }}
                    />
                </ListItem>
                <ListItem disablePadding className="menu-item" dense={true}>
                    <Link to="/play" onClick={collapseMenu}>
                        <ListItemButton >
                            <ListItemIcon >
                                <MenuOpenIcon />
                            </ListItemIcon>
                            <ListItemText primary={Dictionary("frontend.menu.play", "Play")} />
                        </ListItemButton>
                    </Link>
                </ListItem>
                <ListItem disablePadding className="menu-item" dense={true}>
                    <Link to="/cards" onClick={collapseMenu}>
                        <ListItemButton >
                            <ListItemIcon >
                                <DashboardIcon />
                            </ListItemIcon>
                            <ListItemText primary={Dictionary("frontend.menu.cardbrowser", "View Cards")} />
                        </ListItemButton>
                    </Link>
                </ListItem>
                <ListItem disablePadding className="menu-item" dense={true}>
                    <Link to="/deckbuilder" onClick={collapseMenu}>
                        <ListItemButton>
                            <ListItemIcon>
                                <StyleIcon />
                            </ListItemIcon>
                            <ListItemText primary={Dictionary("frontend.menu.deck", "Deckbuilder")} />
                        </ListItemButton>
                    </Link>
                </ListItem>
                <ListItem disablePadding className="menu-item" dense={true}>
                    <Link to="/map" onClick={collapseMenu}>
                        <ListItemButton >
                            <ListItemIcon>
                                <MapIcon />
                            </ListItemIcon>
                            <ListItemText primary={Dictionary("frontend.menu.map", "Map")} />
                        </ListItemButton>
                    </Link>
                </ListItem>
            </List>
            <Divider />
            <List>
                <ListItem>
                    <ListItemText
                        primary={Dictionary("frontend.menu.resources", "Resources")}
                        primaryTypographyProps={{ fontSize: "0.9em", textTransform: "uppercase" }}
                    />
                </ListItem>
                
                <ListItem disablePadding className="menu-item" dense={true}>
                    <Link to="/blog" onClick={collapseMenu}>
                        <ListItemButton >
                            <ListItemIcon>
                                <NewspaperIcon />
                            </ListItemIcon>
                            <ListItemText primary={Dictionary("frontend.menu.whatsnew", "What's new")} />
                        </ListItemButton>
                    </Link>
                </ListItem>

                <ListItem disablePadding className="menu-item" dense={true}>
                    <Link to="/learn" onClick={collapseMenu}>
                        <ListItemButton >
                            <ListItemIcon>
                                <ContactSupportIcon />
                            </ListItemIcon>
                            <ListItemText primary={Dictionary("frontend.menu.help", "Lean to play")} />
                        </ListItemButton>
                    </Link>
                </ListItem>

                <ListItem disablePadding className="menu-item" dense={true}>
                    <Link to="/about" onClick={collapseMenu}>
                        <ListItemButton>
                            <ListItemIcon>
                                <InfoIcon />
                            </ListItemIcon>
                            <ListItemText primary={Dictionary("frontend.menu.about", "About")} />
                        </ListItemButton>
                    </Link>
                </ListItem>
            </List>
            <Divider />
            <List>
                <ListItem>
                    <ListItemText
                        primary={Dictionary("conf_h_language", "Language")}
                        primaryTypographyProps={{ fontSize: "0.9em", textTransform: "uppercase" }}
                    />
                </ListItem>
                <ListItem disablePadding dense={true}>
                    <ListItemButton onClick={() => loadDictionary("en")}>
                        <ListItemText inset primary={"English"} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding dense={true}>
                    <ListItemButton onClick={() => loadDictionary("fr")}>
                        <ListItemText inset primary={"Français"} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding dense={true}>
                    <ListItemButton onClick={() => loadDictionary("es")}>
                        <ListItemText inset primary={"Español"} />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    const [tournamentCount, setTournamentCount] = React.useState(0);

    const initialized = React.useRef(false)
    React.useEffect(() => {

        if (initialized.current) return;
        initialized.current = true

        FetchTournaments().then((list) => setTournamentCount(list.length));

    }, [setTournamentCount]);

    return (
        <>
            <Stack direction="row" spacing={2} justifyContent="flex-end" className="paddingRight1em paddingTop1em">
                <Button onClick={() => props.onMenuChange(MenuSelection.Preferences)} title={Dictionary("frontend.configuration", "Settings")}>
                    <Badge badgeContent={props.hasUsername ? "" : "?"}>
                        <Avatar alt={props.avatarCode} src={props.avatarImage ? props.avatarImage : BACKSIDE_IMAGE} className="avatar-container" />
                        {props.username === "" ? <>Set your player name</> : <>Welcome, <b>{props.username}</b></>}
                    </Badge>
                </Button>
                {tournamentCount > 0 && (<Link to="/tournaments" onClick={collapseMenu}>
                    <Button title={Dictionary("score_tournament", "Tournament")}>
                        <Badge badgeContent={tournamentCount}>
                            <EmojiEventsIcon />
                        </Badge>
                    </Button>
                </Link>
                )}
                {tournamentCount === 0 && (
                    <Button disabled title={Dictionary("score_tournament", "Tournament")}>
                        <Badge badgeContent="0">
                            <EmojiEventsIcon />
                        </Badge>
                    </Button>
                )}
                
                <Button onClick={toggleDrawer(true)}>
                    <MenuOutlinedIcon />
                </Button>
            </Stack>
            <Drawer
                anchor={"right"}
                open={drawerOpen}
                onClose={toggleDrawer(false)}
            >
                {list()}
            </Drawer>
            <Dialog
                open={openLanguageChanged}
                TransitionComponent={Transition}
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>{Dictionary("frontend.language.switched.title", "Language changed")}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {Dictionary("frontend.language.switched.text", "Please reload this page to apply the change.")}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenLanguageChanged(false)}>{Dictionary("cancel", "Cancel")}</Button>
                    <Button variant="contained" autoFocus onClick={handleClose}>{Dictionary("refresh_now", "Refresh now")}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}