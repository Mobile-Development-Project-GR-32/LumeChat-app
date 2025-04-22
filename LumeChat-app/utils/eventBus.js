/**
 * A simple event bus for app-wide communication
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.lastEventData = new Map(); // Store last event data for late subscribers
    }

    // Subscribe to an event
    subscribe(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        
        this.events.get(event).add(callback);
        
        // If this event has been emitted before, immediately call the callback
        if (this.lastEventData.has(event)) {
            callback(this.lastEventData.get(event));
        }
        
        // Return unsubscribe function
        return () => {
            if (this.events.has(event)) {
                this.events.get(event).delete(callback);
                if (this.events.get(event).size === 0) {
                    this.events.delete(event);
                }
            }
        };
    }

    // Publish an event
    publish(event, data) {
        console.log(`Event published: ${event}`, data);
        
        this.lastEventData.set(event, data);
        
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    // Clear all listeners for an event
    clear(event) {
        if (event) {
            this.events.delete(event);
            this.lastEventData.delete(event);
        } else {
            this.events.clear();
            this.lastEventData.clear();
        }
    }
}

// Create a singleton instance
const eventBus = new EventBus();

export default eventBus;
