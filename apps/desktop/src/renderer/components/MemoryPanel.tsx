import { useState, type ReactElement } from 'react';
import type { ApiMemory, ApiSurface } from '../types';

const kindLabels = { profile: '关于你', study: '备考', shared: '你们之间' } as const;

export function MemoryPanel(props: { api: ApiSurface; memories: ApiMemory[]; onMemoriesChange: (memories: ApiMemory[]) => void }): ReactElement {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(memory: ApiMemory): Promise<void> {
    setDeletingId(memory.id);
    setError(null);
    try {
      await props.api.deleteMemory(memory.id);
      props.onMemoriesChange(props.memories.filter((item) => item.id !== memory.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '记忆没有删除成功。');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="memory-panel" aria-labelledby="memory-title">
      <div className="panel-header compact">
        <div><p className="eyebrow">MEMORY DRAWER</p><h2 id="memory-title">共同记忆</h2></div>
        <span className="count-badge">{props.memories.length}</span>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {props.memories.length === 0 ? <p className="empty-panel">还没有留下长期记忆。</p> : (
        <ul className="memory-list">
          {props.memories.map((memory) => (
            <li key={memory.id}>
              <div><span className="memory-kind">{kindLabels[memory.kind]}</span><p>{memory.content}</p></div>
              <button className="icon-button" type="button" aria-label={`删除记忆 ${memory.content}`} disabled={deletingId === memory.id} onClick={() => { void remove(memory); }}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
