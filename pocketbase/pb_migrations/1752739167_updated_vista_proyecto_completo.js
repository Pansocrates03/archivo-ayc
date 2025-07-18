/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4043693475")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewRule": ""
  }, collection)

  // remove field
  collection.fields.removeById("_clone_5e7D")

  // remove field
  collection.fields.removeById("_clone_9glc")

  // remove field
  collection.fields.removeById("_clone_pRBY")

  // remove field
  collection.fields.removeById("_clone_4SUf")

  // remove field
  collection.fields.removeById("_clone_Q0HD")

  // remove field
  collection.fields.removeById("_clone_Nmu1")

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_RuuQ",
    "max": 0,
    "min": 0,
    "name": "proyecto_nombre",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "_clone_Ii0c",
    "max": null,
    "min": null,
    "name": "anio",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_zSua",
    "max": 0,
    "min": 0,
    "name": "sinopsis",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_btjk",
    "max": 0,
    "min": 0,
    "name": "grupo_tag",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "_clone_DqnE",
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

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_80tH",
    "max": 0,
    "min": 0,
    "name": "grupo_nombre",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4043693475")

  // update collection data
  unmarshal({
    "listRule": null,
    "viewRule": null
  }, collection)

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_5e7D",
    "max": 0,
    "min": 0,
    "name": "proyecto_nombre",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "_clone_9glc",
    "max": null,
    "min": null,
    "name": "anio",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_pRBY",
    "max": 0,
    "min": 0,
    "name": "sinopsis",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_4SUf",
    "max": 0,
    "min": 0,
    "name": "grupo_tag",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "_clone_Q0HD",
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

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_Nmu1",
    "max": 0,
    "min": 0,
    "name": "grupo_nombre",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("_clone_RuuQ")

  // remove field
  collection.fields.removeById("_clone_Ii0c")

  // remove field
  collection.fields.removeById("_clone_zSua")

  // remove field
  collection.fields.removeById("_clone_btjk")

  // remove field
  collection.fields.removeById("_clone_DqnE")

  // remove field
  collection.fields.removeById("_clone_80tH")

  return app.save(collection)
})
