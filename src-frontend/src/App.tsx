
import React from 'react';
import Home from './application/Home';
import Menu from './application/Menu';
import { MenuSelection } from './application/Types';
import Preferences, { GetUserName, HasUserName } from './components/Preferences';
import MapView from './application/MapView';
import LogIn from './application/Login';
import Deckbuilder from './application/Deckbuilder';
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import About from './application/About';
import Help from './application/Help';
import CacheData from './application/CacheData';
import WatchGame from './application/WatchGame';
import HomeSelectDeck from './application/HomeSelectDeck';
import Tournaments, { TournamentDetail } from './application/Tournaments';
import Whatsnew from './application/Whatsnew';
import ViewCards from './application/ViewCards';
import { GetCurrentAvatar, GetCurrentAvatarImage, SetCurrentAvatar } from './components/LoadAvatar';
import MPCalculator from './application/MPCalculator';
import ExploreDecks from './application/ExploreDecks';
import { IRandomAvatarData } from './operations/FetchRandomAvatar';


function App({ requireLogin }: { requireLogin: boolean }) {

    const [openPrefs, setOpenPrefs] = React.useState(false);
    const [hasUsername, setHasUsername] = React.useState(HasUserName());
    const [avatarImage, setAvatarImage] = React.useState(GetCurrentAvatarImage());
    const [avatarCode, setAvatarCode] = React.useState(GetCurrentAvatar());
    const [username, setUsername] = React.useState(GetUserName());
    const [allowNavigation, setAllowNavigation] = React.useState(!requireLogin);

    const onChangeView = function (view: MenuSelection) {

        switch (view) {
            case MenuSelection.Preferences:
                setOpenPrefs(true);
                break;
            default:
                break;
        }
    }

    return (
        <>
            <HashRouter>
                {allowNavigation && (<Menu onMenuChange={onChangeView} hasUsername={hasUsername} username={username} avatarCode={avatarCode} avatarImage={avatarImage} />)}
                <Routes>
                    <Route path="/play" element={<Home />} />
                    <Route path="/play/:room" element={<HomeSelectDeck />} />
                    <Route path="/watch/:room" element={<WatchGame />} />
                    <Route path="/cards" element={<ViewCards />} />
                    <Route path="/map" element={<MapView app={false} />} />
                    <Route path="/mapApp" element={<MapView app={true} />} />
                    <Route path="/deckbuilder" element={<Deckbuilder />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/learn" element={<Help />} />
                    <Route path='/tournaments' element={<Tournaments />} />
                    <Route path='/tournaments/:id' element={<TournamentDetail />} />
                    <Route path="/caching" element={<CacheData onReady={(data:IRandomAvatarData) => {
                        setAvatarCode(data.code);
                        setAvatarImage(data.image);
                        SetCurrentAvatar(data.code, data.image);
                    }} />} />
                    <Route path="/points" element={<MPCalculator />} />
                    <Route path="/decks" element={<ExploreDecks />} />
                    <Route path="/blog" element={<Whatsnew />} />
                    <Route path="/blog/:id" element={<Whatsnew />} />
                    <Route path="/login" element={<LogIn onLogin={() => setAllowNavigation(true)} requireLogin={requireLogin} />} />
                    <Route
                        path="*"
                        element={<Navigate to="/login" />}
                    />
                </Routes>
            </HashRouter>
            {openPrefs && (<Preferences 
                onCallbackUpdate={(name:string, avatarCode:string, avatarImage:string) => { 
                    setHasUsername(name !== ""); 
                    setUsername(name); 
                    setAvatarCode(avatarCode);
                    setAvatarImage(avatarImage);
                }} 
                onClose={() => setOpenPrefs(false)}
             />)}
        </>
    );
}

export default App;
