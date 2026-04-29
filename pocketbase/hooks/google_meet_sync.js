routerAdd(
  'POST',
  '/backend/v1/sales/meetings',
  (e) => {
    const body = e.requestInfo().body
    const empresaId = e.auth.get('empresa_id')

    const meetLink =
      'https://meet.google.com/' +
      $security.randomString(3).toLowerCase() +
      '-' +
      $security.randomString(4).toLowerCase() +
      '-' +
      $security.randomString(3).toLowerCase()

    const reunioes = $app.findCollectionByNameOrId('reunioes')
    const record = new Record(reunioes)
    record.set('empresa_id', empresaId)
    record.set('lead_id', body.lead_id)
    record.set('titulo', body.titulo)
    record.set('data_hora', body.data_hora)
    record.set('participantes', body.participantes)
    record.set('meet_link', meetLink)
    $app.save(record)

    const tarefas = $app.findCollectionByNameOrId('tarefas')
    const task = new Record(tarefas)
    task.set('empresa_id', empresaId)
    task.set('titulo', 'Preparar para reunião: ' + body.titulo)
    task.set('status', 'aberta')
    task.set('responsavel_id', e.auth.id)
    $app.save(task)

    const interacoes = $app.findCollectionByNameOrId('interacoes')
    const int = new Record(interacoes)
    int.set('empresa_id', empresaId)
    int.set('lead_id', body.lead_id)
    int.set('tipo', 'reuniao')
    int.set(
      'conteudo',
      'Reunião agendada: ' + body.titulo + ' em ' + body.data_hora + ' - Link: ' + meetLink,
    )
    int.set('autor_id', e.auth.id)
    $app.save(int)

    return e.json(200, { meet_link: meetLink, record: record })
  },
  $apis.requireAuth(),
)
