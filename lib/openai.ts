import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface ScriptParams {
  prompt: string
  platform: 'tiktok' | 'youtube-shorts' | 'instagram-reels'
  duration: number
  tone?: 'casual' | 'professional' | 'humorous' | 'inspirational'
}

export async function generateScript(params: ScriptParams) {
  const { prompt, platform, duration, tone = 'casual' } = params

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a viral video script writer for ${platform}. Create engaging ${duration}-second scripts with hooks, CTAs, and timing. Use a ${tone} tone. Format the response as JSON with the following structure:
{
  "hook": "Opening hook (0-3 seconds)",
  "body": ["Main point 1", "Main point 2", "Main point 3"],
  "cta": "Call to action",
  "timing": {"hook": 3, "body": ${duration - 8}, "cta": 5}
}`,
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1500,
    temperature: 1,
  })

  const content = completion.choices[0].message.content
  if (!content) {
    throw new Error('Failed to generate script from OpenAI')
  }

  return {
    script: JSON.parse(content),
    usage: completion.usage,
    cost: calculateCost(completion.usage),
  }
}

export interface ViralityAnalysis {
  score: number
  breakdown: {
    hook_strength: number
    pacing: number
    cta_effectiveness: number
  }
  hashtags: string[]
  posting_times: string[]
  sound_suggestions: string[]
}

export async function analyzeVirality(script: string): Promise<ViralityAnalysis> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a social media virality expert. Analyze the script and return a JSON with:
{
  "score": 1-10,
  "breakdown": {"hook_strength": 1-10, "pacing": 1-10, "cta_effectiveness": 1-10},
  "hashtags": ["tag1", "tag2", ...],
  "posting_times": ["Best time 1", "Best time 2"],
  "sound_suggestions": ["trending sound 1", "trending sound 2"]
}`,
      },
      { role: 'user', content: `Analyze this script:\n\n${script}` },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  })

  const content = completion.choices[0].message.content
  if (!content) {
    throw new Error('Failed to generate virality analysis from OpenAI')
  }
  return JSON.parse(content)
}

function calculateCost(usage: any) {
  if (!usage) return 0
  const inputCost = (usage.prompt_tokens / 1_000_000) * 2.5
  const outputCost = (usage.completion_tokens / 1_000_000) * 10.0
  return inputCost + outputCost
}

export { openai }

