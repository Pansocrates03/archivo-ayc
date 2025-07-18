/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_860569520")

  // remove field
  collection.fields.removeById("text1316898521")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1316898521",
    "maxSelect": 1,
    "name": "presentadopor",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Arte y Cultura",
      "Prepa Tec",
      "Grupo Estudiantil",
      "Sociedad Artística del Tecnológico"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_860569520")

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1316898521",
    "max": 0,
    "min": 0,
    "name": "presentadopor",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("select1316898521")

  return app.save(collection)
})
