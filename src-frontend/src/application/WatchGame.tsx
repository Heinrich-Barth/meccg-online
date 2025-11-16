

import * as React from 'react';
import Dictionary from '../components/Dictionary';
import IFrameDialog from '../components/IFrameDialog';
import { Navigate, useParams } from 'react-router-dom';
import { validatRoomName } from './Home';
import { PlayerIsAlreadyWatching } from '../operations/IsPresentInGame';
import PROXY_URL from '../operations/Proxy';
import { GetUserName } from '../components/Preferences';
import { GetCurrentAvatar } from '../components/LoadAvatar';

export default function WatchGame() {
    const { room } = useParams();
    const [redirectPlay, setRedirectPlay] = React.useState(false);
    const [showFrame, setShowFrame] = React.useState(false);

    React.useEffect(() => {

        setRedirectPlay(false);
        setShowFrame(false);

        if (room === undefined || room === "" || validatRoomName(room) !== "") {
            setRedirectPlay(true);
            return;
        }

        PlayerIsAlreadyWatching(room)
            .then((ispresent) => {
                if (ispresent) {
                    setShowFrame(true);
                    return;
                }

                fetch(PROXY_URL + "/watch/" + room, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: GetUserName(),
                        code: GetCurrentAvatar()
                    })
                })
                    .then(res => {
                        if (res.status === 204)
                            setShowFrame(true);
                        else
                            return res.json();
                    })
                    .then((err: any) => {
                        if (err?.message)
                            throw new Error(err.message);
                    })
                    .catch((err) => {
                        console.error(err);
                        setRedirectPlay(true);
                    })
            });
    }, [room, setRedirectPlay, setShowFrame]);

    return (
        <React.Fragment>
            {redirectPlay && (<Navigate to="/play" />)}
            {showFrame && (
                <IFrameDialog
                    url={"/play/" + room}
                    title={Dictionary("home.watchgame", "Watch the game")}
                />
            )}
        </React.Fragment>
    );
}