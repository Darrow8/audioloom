//Import Mixpanel API
import { Mixpanel, People } from "mixpanel-react-native";
import { env } from '../config/env';

let mixpanelInstance: Mixpanel;

function initMixpanel() {
    if(!env.MIXPANEL_TOKEN) {
        throw new Error('No MIXPANEL_TOKEN available');
    }
    // Set up an instance of Mixpanel
    const trackAutomaticEvents = false;
    mixpanelInstance = new Mixpanel(env.MIXPANEL_TOKEN, trackAutomaticEvents);
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
