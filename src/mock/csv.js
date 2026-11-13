export function downloadCsv(filename, headings, rows) {
  const escape = (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"'
  const content = [headings, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function readCsv(content) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let index = 0; index < content.length; index++) {
    const character = content[index]
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        field += '"'
        index++
      } else {
        quoted = !quoted
      }
    } else if (!quoted && (character === ',' || character === '\n')) {
      row.push(field.trim())
      field = ''
      if (character === '\n') {
        if (row.some(Boolean)) rows.push(row)
        row = []
      }
    } else {
      field += character
    }
  }
  if (quoted) throw new Error('请检查 CSV 文件格式')
  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}
