# PhysioAssist design system

PhysioAssist is used by patients who may be older, have limited vision or dexterity,
or rarely use apps. Every screen should be calm, obvious and forgiving.

## Principles

1. **One obvious next step per screen.** A single primary button (`BigButton`
   variant `primary`, or an `ActionTile tone="primary"`). Secondary actions are
   visibly quieter.
2. **Big and readable.** Body text is 18pt and titles 28–34pt. Text scales with the
   OS text-size setting (`AppText` caps it at 1.6×). Nothing below 15pt.
3. **Big targets.** Tap targets are at least 56pt tall, and primary actions 64pt.
   Leave space between targets.
4. **Plain language.** Use "Start exercises", not "Initialize detection". Explain what
   happens next in one short sentence. No jargon (frame skip, confidence %,
   inference) in patient-facing screens. Clinician/technical options sit under
   an "Advanced" section.
5. **Never rely on colour alone.** Status always pairs an icon and text with the
   colour (`Banner`). Every text/background pair meets WCAG AA; most meet AAA.
6. **Consistent structure.** Every screen uses `Screen` (safe area, title and
   subtitle, scrolling, optional pinned `footer` for the main action). Group
   related rows in a `Card`, and use `ListRow` for settings and lists.
7. **Accessible by default.** Buttons and tiles set `accessibilityRole` and a
   label. Headings use `accessibilityRole="header"`. Live status uses a `Banner`
   (polite live region).
8. **Forgiving.** Confirm destructive actions. Show errors inline next to the
   field, in words. No time pressure.

## Tokens (`src/theme`)

| Token                                         | Use                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `colors.primary` #0B6E8F                      | primary actions, selection, links                                                           |
| `colors.accent` #F2994A                       | encouragement and highlights (sparingly)                                                    |
| `colors.background` / `surface`               | page / cards                                                                                |
| `colors.text` / `textSecondary` / `textMuted` | body / supporting / least important                                                         |
| `success` / `warning` / `danger` (+ `*Soft`)  | status, always with an icon and text                                                        |
| `spacing` xs 4 … xxl 48                       | 8-point grid; screen padding is `lg` (24)                                                   |
| `radii` md 16 / lg 24                         | buttons / cards                                                                             |
| `typography`                                  | `display`, `title`, `heading`, `body`, `bodyStrong`, `label`, `caption`, `button`, `metric` |

## Components (`src/components/ui`)

`Screen`, `AppText`, `BigButton` (primary / secondary / danger / ghost; icon,
loading), `Card`, `ActionTile` (large tappable card with icon, title and
description), `SectionTitle`, `ListRow` (icon, title, description, chevron or
large switch), `Banner` (info / success / warning / danger), `Metric` (big number
plus label).

Icons come from `react-native-vector-icons/MaterialIcons` (the only icon font
registered in the app).

## Navigation

Four always-labelled tabs: **Home**, **Exercise**, **Progress**, **Settings**.
Sub-pages (Help, My details) open as stack screens with a labelled "Back"
button. Tab test IDs: `tab-home`, `tab-exercises`, `tab-progress`,
`tab-settings`.

## Camera screens

The camera image fills the screen. Controls sit on `colors.cameraOverlay` panels
at the top and bottom:

- one big Start/Stop button;
- the current instruction in large text;
- a large rep counter (`Metric`).

Feedback is spoken as well as shown. Technical numbers (confidence, FPS) are
hidden unless the Advanced setting enables them.
