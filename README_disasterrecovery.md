# Disaster Recovery

The platform architecture was designed to not use any database or any persistance mechanism.

The consequence is that an unintended or intended reboot of the server automatically ends all current games.

Previously, the platform tried so send a savegame to the host of a game to safe the current state and to be able to restore it once the platform comes back online.

Although this is useful feature, a better one would be full disaster recovery with automatic game restoration once the server is back online.

## Technical Considerations

A central issue arises around the following questions:

- How can a game be restored?
- If there is no persistence, how can such a restoration process be trusted?

Issue 1) is quite simple, because the platform already sends a savegame to the host of the game. 

Especially issue 2) is important: The restoration request has to be trustworthy annd only work once and only after a server restart.

## Establishing trust without persistence

In software development, there is a very simple but elegant solution: json web tokens (JWT).

I will not go into too many details but quickly describe the most relevant aspects.

A JWT follows a defined base64 pattern `{header}.{actual-data}.{signature}`.

The `{header}` holds information about the hashing routine being used (there are many and they will be ignored here). 

The `{actual-data}` is a json object that can hold any data you need. In this case, the savegame **and** some additional information about the room, the creation date of the JWT and the time it is valid (i.e. 2 minutes).

Practically, this is sufficient to restore the game and an example would look like this:

```json
{
    "iss": 1234556789, //unix timestamp of creation
    "exp": 1234555555, //expiration 
    "room": "bagend",
    "players": {
        "id1": "Player name 1",
        "id2": "Player name 2"
    },
    "savegame": {
        ...
    }
}
```

So, how we make sure, that the `{actual-data}` was created by the platform and not by any third party? 

This is where the `{signature}` shines. It is quite simple to convert the string `{header}.{actual-data}` (I will call it hash-candidate here) into some random byte sequence using a common hashing mechanism such as `sha-256`. The result is appended to the end.

Each hashing of the hash-candidate will result in the identical result. However, any change of the data will result in a slightly different result. That way, we can identify manipulations.

If the platform receives a restoration request using a given JWT, it is easy to verify that the signature is as expected (valid). If it is valid, the properties `iss` and `exp` can be used to verify that the JWT is still valid. If it has been issued 2 days ago (an attacked has saved it, for example) and is only valid for 2 minutes, we can discard it as being "too old".

Unortunately, if we just use `sha-256`, we can easily manipulate the data and calculate the signature and forge our own JWT...

The solution is simple: Since the hash-candidate is a simple string, the platform can inject a secret string sequence anywhere into the candidate, as long as it is clear where. 

In practice, this will result in a different hash-candidate, e.g. `SECREAT_PART_A{header}.{actual-data}SECREAT_PART_B`. As long as `SECREAT_PART_A` and `SECREAT_PART_B` are secrets and remain unknown to anybody except the platform itself, it is quite impossible to "guess" them. This mechanism is a standard method in software development.

As a consequence, this allows the platform to create a piece of information that can be sent to the players before the server restarts. 

What is more, after the server has restarted, the players can use that information and send it to the platform again. In turn, the platform can verify that the JWT is legitimate and restore the game.

## Restoring the game

Once the server is back online, the host sends a restoration request using the JWT.

Since the JWT contains information about players (importantly, their ids), a new room can be created (only if it has not yet been created, so exacly once!) and the players added.

Once the room exists, the savegame will be used to restore the game data.

After this has been done successfully, the host will receive a success message and simply refresh the browser window and find themself at the table and ready to play. The only thing missing is the other player(s).

The non-hosts (i.e. opponents) also wait for the server to come back online. In addition, they also wait until the room exists again and also simply refresh the browser window.

## Why does this work?

Since the JWT is a trusted piece of data, the platform can trust it and restore the game. That is clear.

A very important detail is the player ids that are included in the JWT. A player id is also stored in a cookie and allows a player to enter the room/page if the cookie matches a player's id as stored in the game data.

If you try to enter a room you are actually part of, this will allow you to proceed to the table.

If you are not part of that game, you will be greeted with a screen that asks you for you deck to join the game (if allowed). 

## Closing remarks

Quite a simple and elegant application of the JWT technique.