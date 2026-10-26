import type { FullBug, PublicBug } from './types'

// What a player sees of a bug before answering: never bugLine, bugTarget,
// answer or explanation. Used by the mock and by the admin test tool.
export function publicBugOf(bug: FullBug): PublicBug {
  const base = {
    id: bug.id,
    track: bug.track,
    difficulty: bug.difficulty,
    points: bug.points,
    title: bug.title,
    choices: bug.choices,
    ...(bug.hint && { hint: bug.hint }),
  }
  if ('bugLine' in bug) {
    return {
      ...base,
      ...(bug.view && { view: bug.view }),
      code: bug.code,
      ...(bug.language && { language: bug.language }),
      ...(bug.context && { context: bug.context }),
    }
  }
  return { ...base, ...(bug.view && { view: bug.view }), diagram: bug.diagram }
}
