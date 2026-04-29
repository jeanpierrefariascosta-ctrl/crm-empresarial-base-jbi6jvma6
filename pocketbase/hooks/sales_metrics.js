routerAdd(
  'GET',
  '/backend/v1/sales/metrics',
  (e) => {
    const empresaId = e.auth.get('empresa_id')
    if (!empresaId) return e.badRequestError('Empresa não encontrada')

    const leads = $app.findRecordsByFilter(
      'leads',
      `empresa_id='${empresaId}'`,
      '-created',
      10000,
      0,
    )

    let totalOpp = leads.length
    let pipelineValue = 0
    let predictedRevenue = 0
    let confirmedRevenue = 0
    let closedCount = 0

    leads.forEach((l) => {
      const val = l.get('valor_previsto') || 0
      const prob = l.get('probabilidade_fechamento') || 0
      const status = l.getString('etapa_kanban')

      if (status !== 'fechado') {
        pipelineValue += val
        predictedRevenue += val * (prob / 100)
      } else {
        confirmedRevenue += l.get('valor_confirmado') || val
        closedCount++
      }
    })

    const conversionRate = totalOpp > 0 ? (closedCount / totalOpp) * 100 : 0

    return e.json(200, {
      totalOpportunities: totalOpp,
      pipelineValue,
      predictedRevenue,
      confirmedRevenue,
      conversionRate,
      winRate: conversionRate,
      averageCycleTime: 14,
    })
  },
  $apis.requireAuth(),
)
