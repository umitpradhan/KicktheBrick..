import { sys } from 'cc';

// Declare jsb.reflection for TypeScript when running on native platforms
declare const jsb: {
    reflection: {
        callStaticMethod(className: string, methodName: string, signature: string, ...args: any[]): any;
    };
};

/**
 * NativeBridge — Android clipboard integration via jsb.reflection.
 * Falls back to navigator.clipboard for browser/editor testing.
 */
export class NativeBridge {

    /**
     * Copy text to the device clipboard.
     * On Android: calls Java ClipboardHelper via jsb.reflection.
     * On Browser: uses navigator.clipboard API.
     */
    public static copyToClipboard(text: string): void {
        if (sys.isNative && sys.platform === sys.Platform.ANDROID) {
            try {
                jsb.reflection.callStaticMethod(
                    'com/cocos/game/ClipboardHelper',
                    'copyToClipboard',
                    '(Ljava/lang/String;)V',
                    text
                );
                console.log('NativeBridge: copied to clipboard via Android native');
            } catch (e) {
                console.error('NativeBridge: failed to copy via native', e);
            }
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            // Browser fallback
            navigator.clipboard.writeText(text).then(() => {
                console.log('NativeBridge: copied to clipboard via browser API');
            }).catch((err) => {
                console.error('NativeBridge: browser clipboard failed', err);
            });
        } else {
            console.warn('NativeBridge: clipboard not available on this platform');
        }
    }
}
