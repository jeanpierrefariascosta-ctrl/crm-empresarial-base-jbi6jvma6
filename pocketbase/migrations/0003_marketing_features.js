migrate(
  (app) => {
    // Update campanhas_ads
    const campanhas = app.findCollectionByNameOrId('campanhas_ads')
    campanhas.fields.add(new DateField({ name: 'data_inicio' }))
    campanhas.fields.add(new DateField({ name: 'data_fim' }))
    campanhas.fields.add(new TextField({ name: 'descricao' }))
    campanhas.fields.add(
      new RelationField({
        name: 'responsavel_default_id',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
      }),
    )
    app.save(campanhas)

    // Update leads
    const leads = app.findCollectionByNameOrId('leads')
    leads.fields.add(new TextField({ name: 'fonte_lead' }))
    leads.fields.add(new BoolField({ name: 'enriquecido' }))
    app.save(leads)

    // Create contatos
    const contatos = new Collection({
      name: 'contatos',
      type: 'base',
      listRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      viewRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      createRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      updateRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      deleteRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('empresas').id,
          maxSelect: 1,
        },
        {
          name: 'cliente_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('clientes').id,
          maxSelect: 1,
        },
        {
          name: 'lead_id',
          type: 'relation',
          required: false,
          collectionId: leads.id,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'cargo', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'linkedin_url', type: 'url' },
        { name: 'avatar_url', type: 'url' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(contatos)
  },
  (app) => {
    const contatos = app.findCollectionByNameOrId('contatos')
    app.delete(contatos)
  },
)
