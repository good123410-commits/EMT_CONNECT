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
      requestPinnedShortcut(
        shortcutId = "kemix_medication_timer",
        deepLinkUrl = deepLinkUrl,
        shortLabel = label,
        longLabel = "약물 복용 타이머",
      )
    }

    AsyncFunction("requestPinEmergencyShortcut") { deepLinkUrl: String, label: String ->
      requestPinnedShortcut(
        shortcutId = "kemix_emergency_quick_view",
        deepLinkUrl = deepLinkUrl,
        shortLabel = label,
        longLabel = "KEMIX 응급 카드",
      )
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

  private fun requestPinnedShortcut(
    shortcutId: String,
    deepLinkUrl: String,
    shortLabel: String,
    longLabel: String,
  ): Boolean {
    val context = appContext.reactContext ?: return false
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false

    val manager = context.getSystemService(ShortcutManager::class.java)
    if (manager == null || !manager.isRequestPinShortcutSupported) return false

    val intent = buildShortcutLaunchIntent(context.packageName, deepLinkUrl)

    val shortcut = ShortcutInfo.Builder(context, shortcutId)
      .setShortLabel(shortLabel)
      .setLongLabel(longLabel)
      .setIcon(Icon.createWithResource(context, context.applicationInfo.icon))
      .setIntent(intent)
      .build()

    return manager.requestPinShortcut(shortcut, null)
  }

  private fun buildShortcutLaunchIntent(packageName: String, deepLinkUrl: String): Intent {
    return Intent(Intent.ACTION_VIEW, Uri.parse(deepLinkUrl)).apply {
      setPackage(packageName)
      addCategory(Intent.CATEGORY_DEFAULT)
      addCategory(Intent.CATEGORY_BROWSABLE)
      addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP or
          Intent.FLAG_ACTIVITY_REORDER_TO_FRONT,
      )
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        addFlags(Intent.FLAG_ACTIVITY_REQUIRE_NON_BROWSER)
      }
    }
  }
}
