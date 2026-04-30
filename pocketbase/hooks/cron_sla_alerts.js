cronAdd('sla_alerts', '0 8 * * *', () => {
  const msInDay = 24 * 60 * 60 * 1000
  const now = new Date()

  try {
    const projetos = $app.findRecordsByFilter(
      'projetos',
      "status != 'done' && status != 'suspended' && data_fim_planejada != ''",
      '',
      1000,
      0,
    )
    const notificacoes = $app.findCollectionByNameOrId('notificacoes')

    for (const proj of projetos) {
      const planejadoStr = proj.getString('data_fim_planejada')
      if (!planejadoStr) continue

      const planejado = new Date(planejadoStr)
      const diffDays = Math.ceil((planejado.getTime() - now.getTime()) / msInDay)

      let tipo = ''
      let titulo = ''
      let msg = ''

      if (diffDays === 7) {
        tipo = 'warning'
        titulo = 'Alerta de SLA (7 dias)'
        msg = `O projeto '${proj.getString('nome')}' vence em 7 dias.`
      } else if (diffDays === 3) {
        tipo = 'critical'
        titulo = 'Alerta de SLA (3 dias)'
        msg = `O projeto '${proj.getString('nome')}' vence em 3 dias!`
      } else if (diffDays < 0 && diffDays > -5) {
        tipo = 'critical'
        titulo = 'SLA Vencido!'
        msg = `O projeto '${proj.getString('nome')}' está atrasado em ${Math.abs(diffDays)} dias.`
      }

      if (tipo && proj.getString('responsavel_id')) {
        const notif = new Record(notificacoes)
        notif.set('user_id', proj.getString('responsavel_id'))
        notif.set('titulo', titulo)
        notif.set('mensagem', msg)
        notif.set('tipo', tipo)
        notif.set('link', `/projetos/${proj.id}`)
        $app.save(notif)
      }
    }
  } catch (e) {
    console.log('Error in SLA cron: ' + e)
  }
})
