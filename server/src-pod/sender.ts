import fetch from 'node-fetch';

interface OneSignalNotification {
    app_id: string;
    include_external_user_ids: string[];
    contents: {
        en: string;
    };
    headings?: {
        en: string;
    };
    data?: Record<string, any>;
}

export async function sendOneSignalNotification({
    externalUserId,
    message,
    title,
    additionalData = {},
}: {
    externalUserId: string;
    message: string;
    title?: string;
    additionalData?: Record<string, any>;
}): Promise<void> {
    console.log('Sending OneSignal notification');
    const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
    const ONE_SIGNAL_REST_API_KEY = process.env.ONE_SIGNAL_REST_API_KEY;

    if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_REST_API_KEY) {
        throw new Error('OneSignal credentials are not configured');
    }

    try {
        const response = await fetch('https://api.onesignal.com/notifications?c=push', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                Authorization: `Key ${ONE_SIGNAL_REST_API_KEY}`,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                app_id: ONE_SIGNAL_APP_ID,
                contents: { en: message },
                "include_aliases": {
                    "external_id": [ externalUserId ]
                },
                "target_channel": "push"
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OneSignal API error: ${JSON.stringify(errorData)}`);
        }
        console.log('OneSignal notification sent successfully');
    } catch (error) {
        console.error('Failed to send OneSignal notification:', error);
        throw error;
    }
}

