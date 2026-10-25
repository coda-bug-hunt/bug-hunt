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

## Dev bug

| Field | Type | Rule |
| --- | --- | --- |
| `code` | array of strings | One string per line, indentation kept |
| `bugLine` | integer | 0-based index of the faulty line in `code` |

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
