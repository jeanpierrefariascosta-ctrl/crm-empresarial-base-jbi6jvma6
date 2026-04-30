migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('leads')

    col.deleteRule = "@request.auth.id != ''"

    if (!col.fields.getByName('motivo_perda')) {
      col.fields.add(new TextField({ name: 'motivo_perda' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('leads')

    col.deleteRule = null

    const field = col.fields.getByName('motivo_perda')
    if (field) {
      col.fields.removeByName('motivo_perda')
    }

    app.save(col)
  },
)
