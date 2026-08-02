package expo.modules.emergencyoverlay

import android.app.Activity
import android.app.KeyguardManager
import android.content.Intent
import android.net.Uri
import android.os.Build

/**
 * 잠금화면 숏컷(응급 Quick View)으로 앱이 열릴 때 잠금 해제 없이 화면을 표시합니다.
 */
object LockScreenLaunchHelper {
  private const val EMERGENCY_PATH = "emergency-quick-view"

  @JvmStatic
  fun applyFromIntent(activity: Activity, intent: Intent?) {
    if (intent == null || !isEmergencyLaunch(intent)) return
    enableLockScreenDisplay(activity)
  }

  @JvmStatic
  fun isEmergencyLaunch(intent: Intent): Boolean {
    val data = intent.data ?: return hasEmergencyExtra(intent)
    return matchesEmergencyUri(data)
  }

  private fun hasEmergencyExtra(intent: Intent): Boolean {
    val extras = listOf(
      intent.getStringExtra(Intent.EXTRA_TEXT),
      intent.dataString,
    )
    return extras.any { value ->
      value?.lowercase()?.contains(EMERGENCY_PATH) == true
    }
  }

  private fun matchesEmergencyUri(uri: Uri): Boolean {
    val combined = buildString {
      append(uri.scheme ?: "")
      append("://")
      append(uri.host ?: "")
      append(uri.path ?: "")
      if (!uri.query.isNullOrBlank()) {
        append('?')
        append(uri.query)
      }
    }.lowercase()

    return combined.contains(EMERGENCY_PATH)
  }

  private fun enableLockScreenDisplay(activity: Activity) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      activity.setShowWhenLocked(true)
      activity.setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      activity.window.addFlags(
        android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
      )
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val keyguardManager = activity.getSystemService(KeyguardManager::class.java) ?: return
      if (keyguardManager.isKeyguardLocked) {
        keyguardManager.requestDismissKeyguard(
          activity,
          object : KeyguardManager.KeyguardDismissCallback() {
            override fun onDismissSucceeded() {}
            override fun onDismissCancelled() {}
            override fun onDismissError() {}
          },
        )
      }
    }
  }
}
