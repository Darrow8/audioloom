//Import Mixpanel API
import { Mixpanel, People } from "mixpanel-react-native";
 
let mixpanelInstance: Mixpanel;

function initMixpanel() {
    // Set up an instance of Mixpanel
    const trackAutomaticEvents = false;
    mixpanelInstance = new Mixpanel("9e7c55199ecb01109190b327652ecfbe", trackAutomaticEvents);
    mixpanelInstance.init();
}

// Track a specific event with optional properties
export function trackEvent(eventName: string, properties?: Record<string, any>) {
    if (!mixpanelInstance) {
        console.warn('Mixpanel not initialized');
        return;
    }
    mixpanelInstance.track(eventName, properties);
}

// Identify a user and set their properties
export function identifyUser(userId: string, userProperties?: Record<string, any>) {
    if (!mixpanelInstance) {
        console.warn('Mixpanel not initialized');
        return;
    }
    mixpanelInstance.identify(userId);
    if (userProperties) {
        mixpanelInstance.getPeople().set(userProperties);
    }
}

// Reset user tracking (e.g., on logout)
export function resetUser() {
    if (!mixpanelInstance) {
        console.warn('Mixpanel not initialized');
        return;
    }
    mixpanelInstance.reset();
}
