onRecordAfterUpdateSuccess((e) => {
  const oldKanban = e.record.original().getString('etapa_kanban')
  const newKanban = e.record.getString('etapa_kanban')

  if (oldKanban !== newKanban) {
    try {
      const interacoes = $app.findCollectionByNameOrId('interacoes')
      const rec = new Record(interacoes)
      rec.set('empresa_id', e.record.getString('empresa_id'))
      rec.set('lead_id', e.record.id)
      rec.set('tipo', 'sistema')
      rec.set('conteudo', `Lead movido de '${oldKanban || 'Nenhuma'}' para '${newKanban}'`)

      const auth = e.requestInfo().auth
      if (auth) {
        rec.set('autor_id', auth.id)
      } else if (e.record.getString('responsavel_id')) {
        rec.set('autor_id', e.record.getString('responsavel_id'))
      }

      $app.save(rec)
    } catch (err) {
      console.log('Erro ao criar interacao de timeline: ' + err)
    }
  }

  e.next()
}, 'leads')
