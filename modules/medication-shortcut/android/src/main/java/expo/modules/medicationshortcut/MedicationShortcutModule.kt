package expo.modules.medicationshortcut

import android.content.Intent
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MedicationShortcutModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MedicationShortcut")

    AsyncFunction("isPinShortcutSupported") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@AsyncFunction false
      val manager = context.getSystemService(ShortcutManager::class.java)
      manager?.isRequestPinShortcutSupported == true
    }

    AsyncFunction("requestPinShortcut") { deepLinkUrl: String, label: String ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@AsyncFunction false

      val manager = context.getSystemService(ShortcutManager::class.java)
      if (manager == null || !manager.isRequestPinShortcutSupported) return@AsyncFunction false

      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLinkUrl)).apply {
        setPackage(context.packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }

      val shortcut = ShortcutInfo.Builder(context, "kemix_medication_timer")
        .setShortLabel(label)
        .setLongLabel("약물 복용 타이머")
        .setIcon(Icon.createWithResource(context, context.applicationInfo.icon))
        .setIntent(intent)
        .build()

      return@AsyncFunction manager.requestPinShortcut(shortcut, null)
    }

    AsyncFunction("openHomeScreen") {
      val context = appContext.reactContext
      if (context == null) return@AsyncFunction null
      val intent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_HOME)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      context.startActivity(intent)
      null
    }
  }
}
