/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4040350901")

  // update collection data
  unmarshal({
    "name": "personas"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4040350901")

  // update collection data
  unmarshal({
    "name": "participantes"
  }, collection)

  return app.save(collection)
})
