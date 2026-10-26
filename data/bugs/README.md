# Bug files

One JSON file per bug, named after its `id`, in the folder of its track:
`dev/dev-001.json`, `network/net-001.json`.
Keys in English; game texts (`title`, `choices`, `explanation`, `hint`,
device `label`) in French.

## Common fields

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | `dev-NNN` or `net-NNN`, same as the file name |
| `track` | `"dev"` or `"network"` | |
| `difficulty` | integer 0 to 4 | 0 = complete beginners (high-school students) |
| `points` | integer | 100 x (`difficulty` + 1) |
| `title` | string | Short, in French |
| `choices` | array of 3 strings | The possible fixes |
| `answer` | integer 0 to 2 | Index of the right fix in `choices` |
| `explanation` | string | In French, shown after the answer |
| `hint` | string | In French, one sentence the duck whispers during the bug: it points the way, **never gives the answer** (no line number, no fix) |

`bugLine`, `bugTarget`, `answer` and `explanation` are never sent to the
client before the player answers. `hint` is sent with the bug: it must not
give the answer away.

A good hint asks a question that sends the player to the right place:
"Combien de minutes y a-t-il dans une heure ?", not "Il faut multiplier par 60".

## Views

`view` says how the bug is drawn. Without it, a dev bug is `code` and a network
bug is `diagram`, so older files need no change. Every view but `diagram` is a
list of lines the player touches, **whatever the track**: a network bug can be a
terminal.

| `view` | Each line is | Example of bug |
| --- | --- | --- |
| `code` | A line of code (`language` says which) | Python, HTML/CSS, SQL |
| `terminal` | A command (`$ ...`) or a line of its output | `ping google.fr` fails, `ping 8.8.8.8` works: the DNS |
| `email` | A header (`De :`, `Objet :`) or a line of the message | A phishing link to `paypal.secure-login.ru` |
| `config` | A setting, `key = value` | `band = 5GHz` for a console that only does 2.4 GHz |
| `rules` | A firewall rule, in the order they apply | "Tout bloquer" before "Autoriser 443" |
| `diagram` | — (devices and links, below) | A wrong gateway |

## Bug drawn as lines (every view but `diagram`)

| Field | Type | Rule |
| --- | --- | --- |
| `code` | array of strings | One string per line, indentation kept |
| `bugLine` | integer | 0-based index of the faulty line in `code` |
| `language` | string, optional | Shown above the lines: `Python`, `HTML/CSS`, `SQL` |
| `context` | string, optional | In French, shown above the lines: an error message to trace back, what the player sees on screen |

In a `terminal`, a line that starts with `$ ` is a command; any other line is
its output. In an `email`, the headers come first (`De : ...`, `Objet : ...`),
then one empty line, then the message: the empty line can't be touched, so it
is never the `bugLine`. Links (`http://...`, `www....`) are underlined.
In a `config`, each `key = value` line is a row; a line without `=` (`[wifi]`)
is a section name. In `rules`, a line starts with `Autoriser` or `Bloquer`,
and the rules are numbered in the order they apply. In both, `language` names
the panel (`Box Wi-Fi`, `Pare-feu de l'école`).

The fix of a `code` bug is a line of code (shown as a diff after the answer);
for the other views, it is an action ("Ne pas cliquer, et le signaler").

Example: `dev/dev-001.json`.

## Network bug

| Field | Type | Rule |
| --- | --- | --- |
| `diagram.devices` | array of devices | See below |
| `diagram.links` | array of `[id, id]` | Cables between two devices |
| `bugTarget` | string | `id` of the faulty device |

A device:

| Field | Required | Rule |
| --- | --- | --- |
| `id` | yes | Unique in the diagram, lowercase (`pc`, `router`) |
| `label` | yes | Name shown to the player, in French |
| `ip`, `mask` | no | Dotted IPv4, e.g. `192.168.1.10`, `255.255.255.0` |
| `gateway` | no | Dotted IPv4 |
| `dns` | no | Dotted IPv4 |
| `interfaces` | no | `[{ "ip": "...", "mask": "..." }]`, for a device with several addresses (router), instead of `ip` and `mask` |
| `ports` | no | `[{ "port": 443, "open": false }]` |

`links` and `bugTarget` must only use `id`s listed in `devices`.

Example: `network/net-001.json`.

## Checks

```bash
jq empty data/bugs/**/*.json
jq -e '.hint | type == "string" and length > 0' data/bugs/**/*.json > /dev/null
```

Then play the bug once in the game.
