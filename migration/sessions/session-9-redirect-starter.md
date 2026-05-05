# Session 9 Redirect-Map Starter

## Source-of-truth list of manual redirects from Session 6.5b

These 17 entries were captured during 8r-2b's editorial decisions. They form the starting point for Session 9's manual-redirects.csv work.

| Source slug | Redirect target | Reason |
|---|---|---|
| `events-calendar` | `/the-giza-sound-and-light-show-experience/` | Specific redirect (events-calendar was a hub, now redirects to its primary product) |
| `special-interest-tours` | `/tours/` | Hub — redirects to tour catalog |
| `group-day-tours` | `/tours/` | Hub — redirects to tour catalog |
| `multiday-adventure-and-safari-tours` | `/tours/` | Hub — redirects to tour catalog |
| `private-day-tours` | `/tours/` | Hub — redirects to tour catalog |
| `sinai-quest-adventures` | `/tours/` | Hub — redirects to tour catalog |
| `ramasside-tours` | `/tours/` | Reclassified-as-tour, Session 8 migration target |
| `snorkeling-adventure-on-the-nefertari-submarine` | `/tours/` | Reclassified-as-tour |
| `a-9-day-egypt-tour-of-culture-and-history` | `/tours/` | Reclassified-as-tour |
| `10-day-egypt-travel-journey-through-history` | `/tours/` | Reclassified-as-tour |
| `ticket-prices-for-attractions-in-al-sharqia` | `/attractions-and-ticket-prices/` | Master page TBD post-cutover |
| `ticket-prices-for-attractions-in-red-sea-sinai` | `/attractions-and-ticket-prices/` | Master page TBD post-cutover |
| `ticket-prices-for-attractions-in-western-desert` | `/attractions-and-ticket-prices/` | Master page TBD post-cutover |
| `saint-catherines-monastery-and-mount-sinai` | NO REDIRECT (410/404) | Killed entirely — content belonged to wrong destination |
| `wadi-al-hittan` | (Session 7 wikiMonument migration) | Will become a place_to_go under al-fayoum; intermediate redirect not needed |
| `wadi-el-rayan` | (Session 7 wikiMonument migration) | Will become a place_to_go under al-fayoum |
| `dendera-village` | (Session 7 wikiMonument migration) | Will become a place_to_go under qena |

## Plus: 9 entries from earlier 6.5a/6.5b sessions
(Reference earlier session-handoff documents for the original 9. Entries include dahab-related cleanups and other 6.5a editorial routing decisions.)

## Total: 26 redirect entries

## Format expected by Session 9
The session 9 importer expects entries in this CSV shape:

```csv
source,target,status_code,reason
/events-calendar/,/the-giza-sound-and-light-show-experience/,301,specific-redirect
/special-interest-tours/,/tours/,301,hub-redirect
...
```

## Notes
- All entries should use 301 status code unless specifically noted (the saint-catherines entry should use 410)
- Sources include leading and trailing slashes per WP URL pattern
- Targets are relative paths
- Master page `/attractions-and-ticket-prices/` is a future creation; verify it exists or stub it before redirects activate
