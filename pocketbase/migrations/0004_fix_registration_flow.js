migrate(
  (app) => {
    // 1. Remove exact CNPJ duplicates keeping the oldest record
    app
      .db()
      .newQuery(`
    DELETE FROM empresas WHERE id NOT IN (
      SELECT MIN(id) FROM empresas GROUP BY cnpj
    ) AND cnpj IS NOT NULL AND cnpj != ''
  `)
      .execute()

    // 2. Add unique index to prevent future duplication
    const col = app.findCollectionByNameOrId('empresas')
    col.addIndex('idx_empresas_cnpj_unique', true, 'cnpj', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('empresas')
    col.removeIndex('idx_empresas_cnpj_unique')
    app.save(col)
  },
)
