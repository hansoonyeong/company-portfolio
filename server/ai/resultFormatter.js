export function parseAiResult(rawText) {
  const text = String(rawText || '').trim()
  let suggestedTasks = []
  let suggestedMemory = []
  let result = text

  const fence = text.match(/```json\s*([\s\S]*?)```/i)
  const jsonCandidate = fence?.[1] || text.match(/(\{[\s\S]*"suggestedTasks"[\s\S]*\})\s*$/)?.[1]

  if (jsonCandidate) {
    try {
      const parsed = JSON.parse(jsonCandidate)
      if (Array.isArray(parsed.suggestedTasks)) suggestedTasks = parsed.suggestedTasks
      if (Array.isArray(parsed.suggestedMemory)) suggestedMemory = parsed.suggestedMemory
      result = text.replace(fence ? fence[0] : jsonCandidate, '').trim()
    } catch {
      // keep plain text
    }
  }

  return {
    result: result || text,
    suggestedTasks,
    suggestedMemory,
  }
}
