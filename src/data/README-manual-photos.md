# Manual Course Photos

`coursePhotosManual.json` is the manual override layer for course photos.

Resolution order:
- manual entry in `coursePhotosManual.json`
- automatic entry in `coursePhotos.json`
- UI placeholder

Rules:
- use a real `courseId` from the course catalog
- keep manual and automatic files separate
- manual entries always win
- include attribution fields on every entry
- use `photoConfidence: "high"` for curated overrides
- replace the sample placeholder URLs before shipping

Fields:
- `courseId`
- `coverPhotoUrl`
- `thumbnailUrl`
- `photoSource`
- `photoLicense`
- `photoCredit`
- `photoConfidence`
- `addedBy`
- `addedDate`

Optional compatibility fields:
- `wikidataEntityId`
- `lastEnriched`

Example:

```json
{
  "courseId": "ak-anchorage-tanglewood-lakes-golf-club",
  "coverPhotoUrl": "https://placehold.co/1600x900/png?text=Replace+Manual+Course+Photo",
  "thumbnailUrl": "https://placehold.co/600x338/png?text=Manual+Photo+Sample",
  "photoSource": "manual",
  "photoLicense": "Sample only - replace before launch",
  "photoCredit": "manual-curation sample",
  "photoConfidence": "high",
  "addedBy": "manual-curation",
  "addedDate": "2026-03-17T00:00:00.000Z"
}
```
