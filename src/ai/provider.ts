import type { Mood } from '../shared/types'

/** Azione proposta dal companion. Se `destructive` è true l'UI chiede SEMPRE conferma prima di eseguirla. */
export interface AIAction {
  id: string
  label: string
  destructive?: boolean
  confirmText?: string
  /** Esegue la modifica reale sullo stato demo o la navigazione. Ritorna un messaggio di esito. */
  run: () => string | void
}
export interface AIReply { text: string; actions?: AIAction[]; mood?: Mood }

/** Cosa il verticale espone al motore AI: stato corrente, azioni rapide e regole di risposta. */
export interface ProductAIContext {
  headline: () => { text: string; mood: Mood }
  quickActions: () => AIAction[]
  rules: { match: RegExp; reply: (m: RegExpMatchArray) => AIReply }[]
  fallback: () => AIReply
}

/**
 * Interfaccia astratta per un provider AI.
 * Oggi esiste solo `MockProvider` (simulazione deterministica, nessuna chiamata di rete).
 * Un futuro `LLMProvider` implementerà la stessa interfaccia, lato server, mantenendo
 * le azioni con conferma esplicita per tutto ciò che è irreversibile.
 */
export interface AIProvider {
  id: string
  label: string
  simulated: boolean
  respond(input: string, ctx: ProductAIContext): Promise<AIReply>
}

export class MockProvider implements AIProvider {
  id = 'mock-rules'
  label = 'Simulazione locale basata su regole'
  simulated = true
  async respond(input: string, ctx: ProductAIContext): Promise<AIReply> {
    await new Promise((r) => setTimeout(r, 420)) // latenza simulata per realismo visivo
    const text = input.trim()
    for (const rule of ctx.rules) {
      const m = text.match(rule.match)
      if (m) return rule.reply(m)
    }
    return ctx.fallback()
  }
}

/** Stub per l'integrazione futura: nessuna chiamata reale viene effettuata. */
export class LLMProviderStub implements AIProvider {
  id = 'llm-stub'
  label = 'Provider LLM (non collegato)'
  simulated = true
  async respond(): Promise<AIReply> {
    return { text: 'Il provider LLM non è ancora collegato. Questa demo usa solo la simulazione locale.' }
  }
}

export const activeProvider: AIProvider = new MockProvider()
