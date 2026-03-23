package com.cocos.game;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;

import com.cocos.lib.CocosHelper;

/**
 * ClipboardHelper — Java bridge for Android clipboard access.
 * Called from TypeScript via jsb.reflection.callStaticMethod().
 *
 * Usage from TS:
 *   jsb.reflection.callStaticMethod(
 *       "com/cocos/game/ClipboardHelper",
 *       "copyToClipboard",
 *       "(Ljava/lang/String;)V",
 *       scoreText
 *   );
 */
public class ClipboardHelper {

    public static void copyToClipboard(final String text) {
        CocosHelper.runOnGameThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Context context = CocosHelper.getActivity();
                    if (context == null) return;

                    ClipboardManager clipboard =
                        (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
                    if (clipboard != null) {
                        ClipData clip = ClipData.newPlainText("BrickGame Score", text);
                        clipboard.setPrimaryClip(clip);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }
}
