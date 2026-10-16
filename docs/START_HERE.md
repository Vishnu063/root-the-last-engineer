# Your first visit to Nexus

## Start the game locally

You need Git, Python 3, and a modern browser. You do not need Node or npm just to play.

```bash
git clone https://github.com/Vishnu063/root-the-last-engineer.git
cd root-the-last-engineer
python3 -m http.server 8080 --bind 127.0.0.1
```

Open **http://127.0.0.1:8080**. Keep this terminal open while playing; Ctrl+C stops the server. Use the HTTP URL rather than double-clicking `index.html`, because the game uses browser modules.

## Pick a mode

| You want to… | Choose |
| --- | --- |
| Explore, evade drones, and repair machines | Play Adventure |
| Practice DevOps decisions with explanations | Training · 500 Questions |

These modes have separate progress. Adventure does not require answering the training questions.

## First Adventure objective

Move with WASD or arrows. On touch devices, tap the ground or use the displayed controls. Collect a glowing repair cell, follow the objective to a machine, then interact with E or the touch action. Each repair consumes a cell. Finish the wire, pipeline, or capacity puzzle; restore all three machines and survive the core-reboot wave to advance.

Shift sprints and Space fires an EMP to stun nearby drones. Use **Follow objective** for navigation help. Assist mode removes drone damage while keeping the repair puzzles interactive.

## First Training objective

Follow the signal to the workshop terminal. Approach the beacon and press E, or choose **Investigate beacon**. Read the evidence before answering. The explanation is part of the exercise; a correct option alone is not the lesson.

Lifelines become spendable at question 20. Two support credits arrive every ten completed questions. Skip tokens are separate and arrive only at 100, 200, and 300 completed questions.

## Keep your progress

Progress is stored in this browser, for this origin. Use the same browser and URL when returning. `localhost` and `127.0.0.1`, different ports, and the hosted game have separate browser storage. Private browsing or clearing site data can remove progress. There are no accounts or cloud saves.

## If something does not work

| Problem | Check |
| --- | --- |
| Blank screen or module error | Open the HTTP URL above; refresh and inspect the browser console if it persists. |
| Port already in use | Start with port 8081 and open the matching URL. The new port uses separate save storage. |
| Controls do not respond | Close the open dialog or puzzle and click the game before using movement keys. |
| Progress seems missing | Confirm browser, hostname, port, and game mode before clearing anything. |
| Difficulty feels unfair | Try Assist mode and report the district, puzzle, controls used, and what happened. |

Use **Feedback** in the game or GitHub's issue forms. Reports are not sent automatically. Include your browser, device, game mode, district or question number, and reproduction steps. Avoid sharing personal browser data.

The game is a prototype: ten districts reuse three repair mechanics, and training decisions do not run real infrastructure. [Full scope and development checks](../README.md).
