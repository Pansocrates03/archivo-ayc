/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3455578297")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "file49288205",
    "maxSelect": 1,
    "maxSize": 10485760,
    "mimeTypes": [],
    "name": "programa",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3455578297")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "file49288205",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "programa",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
