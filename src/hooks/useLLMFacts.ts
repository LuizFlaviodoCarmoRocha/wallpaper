import { useState, useEffect } from 'react'

async function fetchFacts(title: string, explanation: string): Promise<string[]> {
  const prompt = `
Generate exactly 5 brief pop‑up style trivia captions about this NASA astronomy image titled "${title}" with the following description: "${explanation}".
Use brevity (1‑2 sentences max), mix factual and sarcastic commentary, visual puns, insider knowledge, pop culture references, and self‑aware humor.
Avoid using hyphens (`-`) in the pop‑up captions.
Here are example Pop‑Up Video facts for style guidance:
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

Return only the facts as a JSON array of strings, like ["fact 1", "fact 2", "fact 3", "fact 4", "fact 5"].
`
  
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
