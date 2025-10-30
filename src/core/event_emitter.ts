/**
 * EventEmitter - A lightweight event emitter that replaces jQuery.Callbacks()
 * 
 * This class provides a simple event system compatible with the jQuery Callbacks API
 * that was previously used throughout the codebase.
 */

type EventListener = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, Set<EventListener>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, listener: EventListener): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, listener: EventListener): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  /**
   * Subscribe to an event for one-time execution
   */
  once(event: string, listener: EventListener): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Remove all listeners for an event, or all events if no event specified
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

/**
 * Callbacks - A jQuery.Callbacks() compatible wrapper
 * 
 * This provides a drop-in replacement for $.Callbacks() that maintains
 * the same API for minimal code changes during migration.
 * Only implements the methods actually used in the codebase: add(), fire(), remove()
 */
export class Callbacks {
  private listeners: Set<EventListener> = new Set();

  /**
   * Add a callback to the list
   */
  add(callback: EventListener): void {
    this.listeners.add(callback);
  }

  /**
   * Remove a callback from the list
   */
  remove(callback: EventListener): void {
    this.listeners.delete(callback);
  }

  /**
   * Call all callbacks with the given context and arguments
   */
  fire(...args: any[]): void {
    this.listeners.forEach(listener => listener(...args));
  }
}
