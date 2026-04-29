routerAdd('POST', '/backend/v1/sales/proposals/{id}/view', (e) => {
  const id = e.request.pathValue('id')
  try {
    const record = $app.findRecordById('propostas', id)
    const views = record.getInt('visualizacoes') || 0
    record.set('visualizacoes', views + 1)
    if (record.getString('status') === 'enviada') {
      record.set('status', 'visualizada')
    }
    $app.saveNoValidate(record)
    return e.json(200, { success: true, views: views + 1 })
  } catch (err) {
    return e.notFoundError('Proposta não encontrada')
  }
})
