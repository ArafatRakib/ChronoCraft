package com.arafat.chrono;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ChronometerNotificationPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @CapacitorPlugin(name = "ChronometerNotification")
    public static class ChronometerNotificationPlugin extends Plugin {

        private static final String CHANNEL_ID = "chronocraft_active_timer_channel";

        @PluginMethod
        public void showChronometer(PluginCall call) {
            String idStr = call.getString("id", "888888");
            String title = call.getString("title", "ChronoCraft");
            String text = call.getString("text", "Active clock running in background");
            long baseTime = call.getLong("baseTime", System.currentTimeMillis());
            boolean isCountDown = call.getBoolean("isCountDown", false);

            int notificationId = Math.abs(idStr.hashCode());

            Context context = getContext();
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Active Running Timers",
                    NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Silent ongoing lock screen display for active clocks");
                channel.setShowBadge(false);
                if (manager != null) {
                    manager.createNotificationChannel(channel);
                }
            }

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(context, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(context);
            }

            int appIcon = context.getApplicationInfo().icon != 0 
                ? context.getApplicationInfo().icon 
                : android.R.drawable.ic_dialog_info;

                        builder.setContentTitle(title)
                   .setContentText(text)
                   .setSmallIcon(appIcon)
                   .setOngoing(true)
                   .setOnlyAlertOnce(true)
                   .setCategory(Notification.CATEGORY_SERVICE)
                          .setVisibility(Notification.VISIBILITY_PUBLIC);


            // Attach live chronometer if baseTime is provided
            if (baseTime > 0) {
                builder.setUsesChronometer(true).setWhen(baseTime);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    builder.setChronometerCountDown(isCountDown);
                }
            }

            if (manager != null) {
                manager.notify(notificationId, builder.build());
            }
            call.resolve();
        }

        @PluginMethod
        public void clearChronometer(PluginCall call) {
            String idStr = call.getString("id", "888888");
            boolean clearAll = call.getBoolean("clearAll", false);
            NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);

            if (manager != null) {
                if (clearAll) {
                    manager.cancelAll();
                } else {
                    int notificationId = Math.abs(idStr.hashCode());
                    manager.cancel(notificationId);
                }
            }
            call.resolve();
        }
    }
}
