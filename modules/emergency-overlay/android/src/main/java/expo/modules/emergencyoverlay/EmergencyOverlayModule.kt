package expo.modules.emergencyoverlay

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EmergencyOverlayModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EmergencyOverlay")

    AsyncFunction("canDrawOverlays") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      Settings.canDrawOverlays(context)
    }

    AsyncFunction("requestOverlayPermission") {
      val context = appContext.reactContext
      if (context == null) return@AsyncFunction null
      if (!Settings.canDrawOverlays(context)) {
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${context.packageName}"),
        )
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
      null
    }

    AsyncFunction("setOverlayEnabled") { enabled: Boolean ->
      val context = appContext.reactContext
      if (context == null) return@AsyncFunction null
      EmergencyOverlayStore.setEnabled(context, enabled)
      if (enabled) {
        EmergencyOverlayMonitorService.start(context)
      } else {
        EmergencyOverlayMonitorService.stop(context)
        EmergencyOverlayManager.hide(context)
      }
      null
    }

    AsyncFunction("isOverlayEnabled") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      EmergencyOverlayStore.isEnabled(context)
    }

    AsyncFunction("syncCardData") { json: String ->
      val context = appContext.reactContext
      if (context == null) return@AsyncFunction null
      EmergencyOverlayStore.setCardJson(context, json)
      null
    }
  }
}
