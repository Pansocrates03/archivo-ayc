/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_40403509012")

  // remove field
  collection.fields.removeById("relation1345710554")

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1204015838",
    "max": 0,
    "min": 0,
    "name": "puesto",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select3298579211",
    "maxSelect": 1,
    "name": "equipo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "presentacion",
      "direccion",
      "produccion",
      "staff",
      "auditorio",
      "elenco"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_40403509012")

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1892724624",
    "hidden": false,
    "id": "relation1345710554",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "puesto_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // remove field
  collection.fields.removeById("text1204015838")

  // remove field
  collection.fields.removeById("select3298579211")

  return app.save(collection)
})
