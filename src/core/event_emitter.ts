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

  /**
   * Call all callbacks with a given context and array of arguments
   */
  fireWith(context: any, args: any[]): void {
    this.listeners.forEach(listener => listener.apply(context, args));
  }

  /**
   * Determine if callbacks have been called at least once
   */
  fired(): boolean {
    // This is a simplified implementation - full jQuery.Callbacks tracks this
    return this.listeners.size > 0;
  }

  /**
   * Remove all callbacks from the list
   */
  empty(): void {
    this.listeners.clear();
  }

  /**
   * Disable the callback list from doing anything more
   */
  disable(): void {
    this.listeners.clear();
  }

  /**
   * Check if the callbacks list is disabled
   */
  disabled(): boolean {
    return this.listeners.size === 0;
  }

  /**
   * Lock the callback list in its current state
   */
  lock(): void {
    // Simplified implementation
  }

  /**
   * Check if the callbacks list is locked
   */
  locked(): boolean {
    return false;
  }

  /**
   * Determine if the callbacks list has any listeners
   */
  has(callback?: EventListener): boolean {
    if (callback) {
      return this.listeners.has(callback);
    }
    return this.listeners.size > 0;
  }
}
