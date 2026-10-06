# Baseball Go

A Hot Shots–style 3D baseball game for phones with a high school → college or draft → minors → the Bigs career.
Play it at https://hartwigcam98-star.github.io/baseball-go/

Built on the same characters, rig and app shell as [Tennis Go](https://github.com/hartwigcam98-star/Tennis-go).

## How to hit

- **Aim:** drag anywhere to move the yellow contact circle (PCI) onto the pitch. The drag is relative, so your finger never covers it.
- **Swing:** tap (timed from the moment your finger touches), or press the Swing button. Early pulls the ball, late goes the other way.
- **Lift:** circle under the ball lifts it, circle over the ball beats it into the ground.
- **Swing types:** Contact (bigger circle), Normal, Power (smaller circle, harder contact).

## How the project is put together

`index.html` is the whole game in one file, **built** from `src/`. Edit those, never `index.html` directly.

| Path | What it is |
|---|---|
| `src/head.html` | Page head and all CSS |
| `src/body.html` | Screens: title, player select, position, career hub, draft/college decision, season summary, at-bat HUD, results |
| `src/game.js` | Roster, pitch types, scene setup, the plate appearance (pitching, the PCI, contact model, the play animation), input, camera |
| `src/rig.js` | Character loading, Mixamo retargeting, the posed rig (arm and leg IK), batting, pitching, throwing, catcher and fielder poses, bat and glove. Inserted at `/*@RIG*/` |
| `src/park.js` | Ballparks by level (high school, college, minors, the Bigs): field, wall, stands, crowd. Inserted at `/*@PARK*/` |
| `src/play.js` | Ball flight physics (drag, lift, bounces, the wall) and how the defence turns a batted ball into an out or a hit, plus baserunning. Pure JS, testable in Node. Inserted at `/*@PLAY*/` |
| `src/sim.js` | Levels, teams, pitchers, simulated plate appearances and whole games around your live at-bats. Inserted at `/*@SIM*/` |
| `src/career.js` | Career flow: seasons, training, promotions, the draft, college, awards, records, save and backup codes, batting practice, quick games. Inserted at `/*@CAREER*/` |
| `src/fx.js`, `src/audio.js` | Hit-stop, bursts, ball trail, haptics; synthesised bat, glove and crowd sounds |
| `src/vendor/three.js` | three.js r170 |
| `src/assets/` | Fallback character and Mixamo locomotion clips |
| `chars/` | Player characters (same as Tennis Go) |
| `tools/build.py` | Builds `index.html` |
| `tools/tests/` | Node and Playwright checks: ball physics and outcome rates, poses, auto-hitting, a full career sim |

## Build

```
python3 tools/build.py
```

Then commit `src/` changes together with the rebuilt `index.html`.

## Coming next

Pitching for two-way players, fielding and baserunning control, more swing and stance animation polish.
