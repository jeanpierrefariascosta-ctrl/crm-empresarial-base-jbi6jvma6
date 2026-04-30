onRecordDelete((e) => {
  const leadId = e.record.id

  try {
    const interacoes = $app.findRecordsByFilter('interacoes', `lead_id = '${leadId}'`, '', 0, 0)
    for (const r of interacoes) $app.delete(r)
  } catch (_) {}

  try {
    const propostas = $app.findRecordsByFilter('propostas', `lead_id = '${leadId}'`, '', 0, 0)
    for (const r of propostas) $app.delete(r)
  } catch (_) {}

  try {
    const reunioes = $app.findRecordsByFilter('reunioes', `lead_id = '${leadId}'`, '', 0, 0)
    for (const r of reunioes) $app.delete(r)
  } catch (_) {}

  try {
    const contatos = $app.findRecordsByFilter('contatos', `lead_id = '${leadId}'`, '', 0, 0)
    for (const r of contatos) $app.delete(r)
  } catch (_) {}

  e.next()
}, 'leads')
