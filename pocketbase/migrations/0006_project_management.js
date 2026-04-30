migrate(
  (app) => {
    const empresas = app.findCollectionByNameOrId('empresas')
    const clientes = app.findCollectionByNameOrId('clientes')

    const projetos = new Collection({
      name: 'projetos',
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
          collectionId: empresas.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        {
          name: 'cliente_id',
          type: 'relation',
          required: true,
          collectionId: clientes.id,
          maxSelect: 1,
        },
        { name: 'valor', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['backlog', 'to_do', 'in_progress', 'review', 'done', 'suspended'],
          maxSelect: 1,
        },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim_planejada', type: 'date' },
        { name: 'data_fim_realizada', type: 'date' },
        { name: 'responsavel_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        {
          name: 'motivo_encerramento',
          type: 'select',
          values: ['concluida', 'falta_recurso', 'decisao_lider', 'bloqueio_externo', 'outro'],
          maxSelect: 1,
        },
        { name: 'observacao_encerramento', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(projetos)

    const tarefas = app.findCollectionByNameOrId('tarefas')
    if (!tarefas.fields.getByName('projeto_id')) {
      tarefas.fields.add(
        new RelationField({ name: 'projeto_id', collectionId: projetos.id, maxSelect: 1 }),
      )
      tarefas.fields.add(new DateField({ name: 'data_vencimento_planejada' }))
      tarefas.fields.add(new DateField({ name: 'data_conclusao_realizada' }))
      tarefas.fields.add(
        new SelectField({
          name: 'motivo_encerramento',
          values: ['concluida', 'falta_recurso', 'decisao_lider', 'bloqueio_externo', 'outro'],
          maxSelect: 1,
        }),
      )
      tarefas.fields.add(new TextField({ name: 'observacao_encerramento' }))
      tarefas.fields.add(
        new RelationField({ name: 'bloqueada_por', collectionId: tarefas.id, maxSelect: null }),
      )
      tarefas.fields.add(new JSONField({ name: 'subtarefas' }))
      app.save(tarefas)
    }

    const interacoes = app.findCollectionByNameOrId('interacoes')
    if (!interacoes.fields.getByName('projeto_id')) {
      interacoes.fields.add(
        new RelationField({ name: 'projeto_id', collectionId: projetos.id, maxSelect: 1 }),
      )
      interacoes.fields.add(
        new RelationField({ name: 'tarefa_id', collectionId: tarefas.id, maxSelect: 1 }),
      )
      app.save(interacoes)
    }

    const notificacoes = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'mensagem', type: 'text', required: true },
        { name: 'lida', type: 'bool' },
        { name: 'tipo', type: 'select', values: ['info', 'warning', 'critical'], maxSelect: 1 },
        { name: 'link', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(notificacoes)

    const arquivos = new Collection({
      name: 'arquivos_projeto',
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
          collectionId: empresas.id,
          maxSelect: 1,
        },
        {
          name: 'projeto_id',
          type: 'relation',
          required: true,
          collectionId: projetos.id,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'arquivo', type: 'file', maxSelect: 1, maxSize: 10485760 },
        { name: 'resumo_ia', type: 'text' },
        { name: 'uploaded_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(arquivos)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('arquivos_projeto'))
    } catch (e) {}
    try {
      app.delete(app.findCollectionByNameOrId('notificacoes'))
    } catch (e) {}
    try {
      const interacoes = app.findCollectionByNameOrId('interacoes')
      interacoes.fields.removeByName('projeto_id')
      interacoes.fields.removeByName('tarefa_id')
      app.save(interacoes)
    } catch (e) {}
    try {
      const tarefas = app.findCollectionByNameOrId('tarefas')
      tarefas.fields.removeByName('projeto_id')
      tarefas.fields.removeByName('data_vencimento_planejada')
      tarefas.fields.removeByName('data_conclusao_realizada')
      tarefas.fields.removeByName('motivo_encerramento')
      tarefas.fields.removeByName('observacao_encerramento')
      tarefas.fields.removeByName('bloqueada_por')
      tarefas.fields.removeByName('subtarefas')
      app.save(tarefas)
    } catch (e) {}
    try {
      app.delete(app.findCollectionByNameOrId('projetos'))
    } catch (e) {}
  },
)
