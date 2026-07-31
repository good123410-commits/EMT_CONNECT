package expo.modules.emergencyoverlay

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONObject

object EmergencyOverlayManager {
  private var overlayView: View? = null

  fun show(context: Context) {
    if (!EmergencyOverlayStore.isEnabled(context)) return
    if (!Settings.canDrawOverlays(context)) return

    val cardJson = EmergencyOverlayStore.getCardJson(context)
    if (cardJson.isBlank()) return

    val appContext = context.applicationContext
    if (overlayView != null) return

  try {
      val wm = appContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      val root = buildOverlayView(appContext, cardJson) { hide(appContext) }

      val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      } else {
        WindowManager.LayoutParams.TYPE_PHONE
      }

      val flags = WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE

      val params = WindowManager.LayoutParams(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.WRAP_CONTENT,
        layoutType,
        flags,
        PixelFormat.TRANSLUCENT,
      )
      params.gravity = Gravity.TOP

      wm.addView(root, params)
      overlayView = root
    } catch (_: Exception) {
      overlayView = null
    }
  }

  fun hide(context: Context) {
    val appContext = context.applicationContext
    val view = overlayView ?: return
    try {
      val wm = appContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      wm.removeView(view)
    } catch (_: Exception) {
      // ignore
    }
    overlayView = null
  }

  private fun buildOverlayView(context: Context, cardJson: String, onDismiss: () -> Unit): View {
    val json = try {
      JSONObject(cardJson)
    } catch (_: Exception) {
      JSONObject()
    }

    val container = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(Color.parseColor("#B91C1C"))
      setPadding(24, 28, 24, 20)
    }

    val title = TextView(context).apply {
      text = "KEMIX 응급 의료 정보"
      textSize = 18f
      setTextColor(Color.WHITE)
    }
    container.addView(title)

    val scroll = ScrollView(context)
    val body = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(0, 12, 0, 0)
    }

    addLine(body, context, "이름", json.optString("fullName"))
    addLine(body, context, "비상 연락 1", formatContact(json.optString("contact1Name"), json.optString("contact1Phone")))
    addLine(body, context, "비상 연락 2", formatContact(json.optString("contact2Name"), json.optString("contact2Phone")))
    addLine(body, context, "알레르기/약물", json.optString("allergiesMedications"))
    addLine(body, context, "선호 병원", json.optString("preferredHospital"))
    addLine(body, context, "메모", json.optString("medicalNotes"))

    scroll.addView(body)
    container.addView(scroll)

    val dismiss = TextView(context).apply {
      text = "닫기"
      textSize = 14f
      setTextColor(Color.WHITE)
      setPadding(0, 16, 0, 0)
      setOnClickListener { onDismiss() }
    }
    container.addView(dismiss)

    return container
  }

  private fun addLine(parent: LinearLayout, context: Context, label: String, value: String) {
    if (value.isBlank()) return
    val labelView = TextView(context).apply {
      text = label
      textSize = 11f
      setTextColor(Color.parseColor("#FECACA"))
    }
    parent.addView(labelView)
    val valueView = TextView(context).apply {
      text = value
      textSize = 15f
      setTextColor(Color.WHITE)
      setPadding(0, 4, 0, 10)
    }
    parent.addView(valueView)
  }

  private fun formatContact(name: String, phone: String): String {
    return listOf(name.trim(), phone.trim()).filter { it.isNotEmpty() }.joinToString(" · ")
  }
}
