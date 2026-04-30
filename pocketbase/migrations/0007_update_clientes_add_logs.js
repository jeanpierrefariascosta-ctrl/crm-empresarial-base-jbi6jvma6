migrate(
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.fields.add(new TextField({ name: 'cep' }))
    clientes.fields.add(new TextField({ name: 'logradouro' }))
    clientes.fields.add(new TextField({ name: 'numero' }))
    clientes.fields.add(new TextField({ name: 'complemento' }))
    clientes.fields.add(new TextField({ name: 'bairro' }))
    clientes.fields.add(new TextField({ name: 'cidade' }))
    clientes.fields.add(new TextField({ name: 'uf' }))
    app.save(clientes)

    const logs = new Collection({
      name: 'logs_consulta_cnpj',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'cnpj', type: 'text', required: true },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'sucesso', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(logs)
  },
  (app) => {
    const logs = app.findCollectionByNameOrId('logs_consulta_cnpj')
    app.delete(logs)

    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.fields.removeByName('cep')
    clientes.fields.removeByName('logradouro')
    clientes.fields.removeByName('numero')
    clientes.fields.removeByName('complemento')
    clientes.fields.removeByName('bairro')
    clientes.fields.removeByName('cidade')
    clientes.fields.removeByName('uf')
    app.save(clientes)
  },
)
