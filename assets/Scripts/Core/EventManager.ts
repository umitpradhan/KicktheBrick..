/**
 * EventManager — lightweight pub/sub event bus.
 * Decouples game components (Ball, Bricks, UI) from each other.
 *
 * Usage:
 *   EventManager.on('BRICK_DESTROYED', this.onBrickDestroyed, this);
 *   EventManager.emit('BRICK_DESTROYED', { points: 10 });
 *   EventManager.off('BRICK_DESTROYED', this.onBrickDestroyed, this);
 */
type EventCallback = (...args: any[]) => void;

interface ListenerEntry {
    callback: EventCallback;
    context: any;
}

export class EventManager {
    private static _listeners: Map<string, ListenerEntry[]> = new Map();

    /** Register a listener for an event. */
    public static on(event: string, callback: EventCallback, context?: any): void {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)!.push({ callback, context: context || null });
    }

    /** Remove a specific listener. */
    public static off(event: string, callback: EventCallback, context?: any): void {
        const entries = this._listeners.get(event);
        if (!entries) return;

        const ctx = context || null;
        for (let i = entries.length - 1; i >= 0; i--) {
            if (entries[i].callback === callback && entries[i].context === ctx) {
                entries.splice(i, 1);
            }
        }
        if (entries.length === 0) {
            this._listeners.delete(event);
        }
    }

    /** Emit an event to all registered listeners. */
    public static emit(event: string, ...args: any[]): void {
        const entries = this._listeners.get(event);
        if (!entries) return;

        // Iterate over a copy to be safe against mid-iteration removal
        const snapshot = entries.slice();
        for (const entry of snapshot) {
            entry.callback.apply(entry.context, args);
        }
    }

    /** Remove all listeners (cleanup). */
    public static clear(): void {
        this._listeners.clear();
    }
}
