cronAdd('sla_alerts_leads', '0 9 * * *', () => {
  const msInDay = 24 * 60 * 60 * 1000
  const now = new Date()

  try {
    const leads = $app.findRecordsByFilter(
      'leads',
      "etapa_kanban != '' && etapa_kanban != 'fechado' && etapa_kanban != 'perdido'",
      '',
      1000,
      0,
    )
    const notificacoes = $app.findCollectionByNameOrId('notificacoes')

    for (const lead of leads) {
      const updatedStr = lead.getString('updated')
      if (!updatedStr) continue

      const updatedDate = new Date(updatedStr)
      const diffDays = Math.floor((now.getTime() - updatedDate.getTime()) / msInDay)

      if (diffDays >= 5 && lead.getString('responsavel_id')) {
        const notif = new Record(notificacoes)
        notif.set('user_id', lead.getString('responsavel_id'))
        notif.set('titulo', 'SLA de Lead Excedido')
        notif.set('mensagem', `O lead não tem interações ou atualizações há ${diffDays} dias.`)
        notif.set('tipo', 'warning')
        notif.set('link', `/vendas/leads`)
        $app.save(notif)
      }
    }
  } catch (e) {
    console.log('Error in SLA leads cron: ' + e)
  }
})
