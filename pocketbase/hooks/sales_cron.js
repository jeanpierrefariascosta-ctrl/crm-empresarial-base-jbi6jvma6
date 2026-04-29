cronAdd('daily_sales_alerts', '0 9 * * *', () => {
  try {
    const propostas = $app.findRecordsByFilter(
      'propostas',
      "status = 'enviada' && created < @now('-3days')",
      '',
      100,
      0,
    )

    propostas.forEach((p) => {
      const lead = $app.findRecordById('leads', p.get('lead_id'))
      const resp = lead.get('responsavel_id')
      if (resp) {
        const tarefas = $app.findCollectionByNameOrId('tarefas')
        const t = new Record(tarefas)
        t.set('empresa_id', p.get('empresa_id'))
        t.set('titulo', 'Follow-up de Proposta Não Visualizada')
        t.set(
          'descricao',
          'A proposta ' +
            p.id +
            ' foi enviada há mais de 3 dias e ainda não foi visualizada pelo cliente.',
        )
        t.set('status', 'aberta')
        t.set('prioridade', 'alta')
        t.set('responsavel_id', resp)
        $app.save(t)

        p.set('status', 'follow_up_sugerido')
        $app.saveNoValidate(p)
      }
    })
  } catch (err) {
    console.log('Erro no cron de vendas:', err)
  }
})
