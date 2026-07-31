package expo.modules.emergencyoverlay

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class EmergencyOverlayBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
    if (!EmergencyOverlayStore.isEnabled(context)) return
    EmergencyOverlayMonitorService.start(context)
  }
}
