/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3088080376")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n    (ROW_NUMBER() OVER ()) AS id,\n    p.id AS proyecto_id,\n    p.nombre AS proyecto_nombre,\n    p.anio,\n    p.sinopsis,\n    p.programa,\n\n    g.id AS grupo_id,\n    g.tag AS grupo_tag,\n    g.presentadopor,\n    g.nombre AS grupo_nombre\n\nFROM proyectos p\nJOIN grupos g ON p.grupo_id = g.id"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_j8ei")

  // remove field
  collection.fields.removeById("_clone_mVtS")

  // remove field
  collection.fields.removeById("_clone_uvwY")

  // remove field
  collection.fields.removeById("_clone_vzU3")

  // remove field
  collection.fields.removeById("_clone_YCLW")

  // remove field
  collection.fields.removeById("_clone_qOqL")

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_Xdob",
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
    "id": "_clone_e7cg",
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
    "id": "_clone_vRjn",
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
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "_clone_scQw",
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

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_eHyg",
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
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "_clone_LZTU",
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
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_Ibqy",
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
  const collection = app.findCollectionByNameOrId("pbc_3088080376")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n    (ROW_NUMBER() OVER ()) AS id,\n    p.id AS proyecto_id,\n    p.nombre AS proyecto_nombre,\n    p.anio,\n    p.sinopsis,\n\n    g.id AS grupo_id,\n    g.tag AS grupo_tag,\n    g.presentadopor,\n    g.nombre AS grupo_nombre\n\nFROM proyectos p\nJOIN grupos g ON p.grupo_id = g.id"
  }, collection)

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_j8ei",
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
    "id": "_clone_mVtS",
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
    "id": "_clone_uvwY",
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
    "id": "_clone_vzU3",
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
    "id": "_clone_YCLW",
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
    "id": "_clone_qOqL",
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
  collection.fields.removeById("_clone_Xdob")

  // remove field
  collection.fields.removeById("_clone_e7cg")

  // remove field
  collection.fields.removeById("_clone_vRjn")

  // remove field
  collection.fields.removeById("_clone_scQw")

  // remove field
  collection.fields.removeById("_clone_eHyg")

  // remove field
  collection.fields.removeById("_clone_LZTU")

  // remove field
  collection.fields.removeById("_clone_Ibqy")

  return app.save(collection)
})
