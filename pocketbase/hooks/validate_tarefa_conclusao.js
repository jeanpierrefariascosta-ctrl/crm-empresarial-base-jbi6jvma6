onRecordUpdateRequest((e) => {
  const body = e.requestInfo().body
  if (!body) return e.next()

  const newStatus = body.status
  if (newStatus === 'concluida' || newStatus === 'encerrada') {
    const bloqueadaPor = e.record.get('bloqueada_por') || []
    if (bloqueadaPor.length > 0) {
      for (const id of bloqueadaPor) {
        try {
          const blockingTask = $app.findRecordById('tarefas', id)
          const bStatus = blockingTask.getString('status')
          if (bStatus !== 'concluida' && bStatus !== 'encerrada') {
            throw new BadRequestError(
              'Não é possível concluir esta tarefa pois ela está bloqueada por tarefas pendentes.',
            )
          }
        } catch (err) {
          if (err.name === 'BadRequestError') throw err
        }
      }
    }
  }
  e.next()
}, 'tarefas')
