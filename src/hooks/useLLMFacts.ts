import { useState, useEffect } from 'react'

async function fetchFacts(title: string, explanation: string): Promise<string[]> {
  const prompt = `
Generate exactly 8 brief pop-up style trivia captions about this NASA astronomy image titled "${title}" with the following description: "${explanation}". Aim for one fact from each of the example categories below, plus one additional fact of your choice.
Use brevity (1-2 sentences max), mix factual and sarcastic commentary, visual puns, insider knowledge, pop culture references, and self-aware humor.
Do not include any hyphens (single '-' or double '--') anywhere in your output. Replace any hyphens you would normally use with a period.
Minimize overly cheesy punchlines; keep facts informative while allowing subtle, light humor.
Here are example Pop-Up Video facts for style guidance:
Production & Cost Details:
- "This video cost $2.3 million to make"
- "The director shot 47 takes of this scene"
- "This location is actually a grocery store in Burbank"
- "The car in this scene belongs to the director's mother"
Behind-the-Scenes Trivia:
- "The lead singer was sick with the flu during this shoot"
- "This dance move was choreographed in 15 minutes"
- "The band learned they went #1 while filming this video"
- "The extras in this scene are all record label employees"
Personal Artist Facts:
- "The guitarist is afraid of heights"
- "This singer's real name is Susan"
- "The drummer used to work at a pizza shop"
- "The bassist wrote this song about his pet hamster"
Technical/Equipment Info:
- "This guitar solo was recorded backwards"
- "The smoke effect required 12 fog machines"
- "This is actually a stunt double, not the real singer"
- "The microphone is made of solid gold"
Pop Culture References & Wordplay:
- "But seriously..." (appears over someone's buttocks)
- "Not [Band Member Name]" (when someone else appears on screen)
- "It is illegal to Federal Express yourself" (during Madonna's "Express Yourself")
Random Connections:
- "The director's dog appears in 3 other music videos"
- "This actress later married a professional wrestler"
- "The location was later used in a soap opera"
- "This hairstyle inspired 1,000 copycats"
Snarky Commentary:
- "This outfit violates several fashion laws"
- "Note the meaningful stare into the camera"
- "Subtle as a brick through a window"
- "This pose took 6 hours to perfect"

Return only the facts as a JSON array of strings, like ["fact 1", "fact 2", "fact 3", "fact 4", "fact 5", "fact 6", "fact 7", "fact 8"].
`
  
  // Ensure we have a string prompt and log the full payload and endpoint
  const endpoint =
    import.meta.env.VITE_LLM_API_ENDPOINT ||
    'https://x36464naae.execute-api.us-east-1.amazonaws.com/prod/bedrock/invoke'
  const safePrompt = prompt || ''
  console.debug(
    '[fetchFacts] endpoint →',
    endpoint,
    'payload →',
    JSON.stringify({ prompt: safePrompt })
  )
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: safePrompt }),
  })
  
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
    const sanitized = arr.map(fact => fact.replace(/-{1,2}/g, '.'))
    console.group(`[fetchFacts] Retrieved ${sanitized.length} facts for "${title}"`)
    sanitized.forEach((fact, idx) => console.log(`${idx + 1}. ${fact}`))
    console.groupEnd()
    return sanitized
  }
  
  // Fallback
  return [`This is a fascinating astronomical image titled "${title}".`]
}

export function useLLMFacts(title: string, explanation: string): string[] {
  const [facts, setFacts] = useState<string[]>([])
  
  useEffect(() => {
    // Skip fetching until we have a valid title
    if (!title) {
      setFacts([])
      return
    }
    let cancelled = false

    fetchFacts(title, explanation)
      .then((newFacts) => {
        if (!cancelled) {
          setFacts(newFacts)
        }
      })
      .catch((error) => {
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
