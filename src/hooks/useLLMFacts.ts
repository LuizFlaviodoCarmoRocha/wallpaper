import { useState, useEffect } from 'react'

async function fetchFacts(title: string, explanation: string): Promise<string[]> {
  const prompt =
    `Generate exactly 5 fun, interesting trivia facts about this NASA astronomy image titled "${title}" with the following description: "${explanation}". ` +
    `Each fact should be a single sentence, scientifically accurate, and should not repeat details already mentioned in the description; instead, provide novel insights that expand upon it. ` +
    `Return only the facts as a JSON array of strings, like this: ["fact 1", "fact 2", "fact 3", "fact 4", "fact 5"]`
  
  const response = await fetch(
    import.meta.env.VITE_LLM_API_ENDPOINT || 'https://x36464naae.execute-api.us-east-1.amazonaws.com/prod/bedrock/invoke',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }
  )
  
  if (!response.ok) {
    const errText = await response.text()
    console.error('[fetchFacts] API error:', response.status, response.statusText, errText)
    throw new Error(`API call failed: ${response.status}`)
  }
  
  const data = await response.json()
  // Try to handle facts as array or JSON string
  let arr = data.facts
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr)
    } catch {}
  }
  if (Array.isArray(arr) && arr.length > 0) {
    console.group(`[fetchFacts] Retrieved ${arr.length} facts for "${title}"`)
    arr.forEach((fact, idx) => console.log(`${idx + 1}. ${fact}`))
    console.groupEnd()
    return arr
  }
  
  // Fallback
  return [`This is a fascinating astronomical image titled "${title}".`]
}

export function useLLMFacts(title: string, explanation: string): string[] {
  const [facts, setFacts] = useState<string[]>([])
  
  useEffect(() => {
    let cancelled = false
    
    fetchFacts(title, explanation)
      .then(facts => {
        if (!cancelled) {
          setFacts(facts)
        }
      })
      .catch(error => {
        console.error('OpenAI call error:', error)
        // Fallback to a simple fact if the API call fails
        if (!cancelled) {
          setFacts([`This is a fascinating astronomical image titled "${title}".`])
        }
      })
    
    return () => {
      cancelled = true
    }
  }, [title, explanation])
  
  return facts
}
