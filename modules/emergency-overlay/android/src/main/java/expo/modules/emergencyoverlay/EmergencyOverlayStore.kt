package expo.modules.emergencyoverlay

import android.content.Context

object EmergencyOverlayStore {
  private const val PREFS = "kemix_emergency_overlay"
  private const val KEY_ENABLED = "enabled"
  private const val KEY_CARD_JSON = "card_json"

  fun isEnabled(context: Context): Boolean {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ENABLED, false)
  }

  fun setEnabled(context: Context, enabled: Boolean) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_ENABLED, enabled).apply()
  }

  fun getCardJson(context: Context): String {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_CARD_JSON, "") ?: ""
  }

  fun setCardJson(context: Context, json: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_CARD_JSON, json).apply()
  }
}
