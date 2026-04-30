onRecordAfterUpdateSuccess((e) => {
  const status = e.record.getString('status')
  const oldStatus = e.record.original().getString('status')

  if ((status === 'concluida' || status === 'encerrada') && oldStatus !== status) {
    try {
      const blockedTasks = $app.findRecordsByFilter(
        'tarefas',
        `bloqueada_por ~ '${e.record.id}' && status != 'concluida' && status != 'encerrada'`,
        '',
        100,
        0,
      )

      const notificacoes = $app.findCollectionByNameOrId('notificacoes')

      for (const task of blockedTasks) {
        const respId = task.getString('responsavel_id')
        if (respId) {
          const notif = new Record(notificacoes)
          notif.set('user_id', respId)
          notif.set('titulo', 'Tarefa Desbloqueada')
          notif.set(
            'mensagem',
            `A tarefa '${task.getString('titulo')}' foi desbloqueada pois '${e.record.getString('titulo')}' foi concluída.`,
          )
          notif.set('tipo', 'info')
          notif.set('link', `/projetos/tarefas`)
          $app.save(notif)
        }
      }
    } catch (err) {}
  }
  e.next()
}, 'tarefas')
