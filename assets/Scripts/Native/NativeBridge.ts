import { sys, native } from 'cc';

/**
 * NativeBridge — Android clipboard integration via native.reflection.
 * Falls back to navigator.clipboard for browser/editor testing.
 */
export class NativeBridge {

    /**
     * Copy text to the device clipboard.
     * On Android: calls Java ClipboardHelper via native.reflection.
     * On Browser: uses navigator.clipboard API.
     */
    public static copyToClipboard(text: string): void {
        if (sys.isNative && sys.os === sys.OS.ANDROID) {
            try {
                native.reflection.callStaticMethod(
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
