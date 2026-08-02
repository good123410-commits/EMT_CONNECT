package expo.modules.emergencyoverlay

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
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

    val hasContent = json.optBoolean("hasContent", false) ||
      json.optString("fullName").isNotBlank() ||
      json.optString("contact1Phone").isNotBlank()

    val shareUrl = json.optString("publicShareUrl").trim()

    val container = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(Color.parseColor("#0f172a"))
      setPadding(24, 28, 24, 20)
    }

    val badge = TextView(context).apply {
      text = "SOS · KEMIX"
      textSize = 11f
      setTextColor(Color.parseColor("#fecaca"))
      setPadding(0, 0, 0, 8)
    }
    container.addView(badge)

    val title = TextView(context).apply {
      text = "응급 의료 정보"
      textSize = 20f
      setTextColor(Color.WHITE)
    }
    container.addView(title)

    val subtitle = TextView(context).apply {
      text = "Emergency Medical Profile"
      textSize = 12f
      setTextColor(Color.parseColor("#94a3b8"))
      setPadding(0, 4, 0, 16)
    }
    container.addView(subtitle)

    val body = TextView(context).apply {
      text = if (hasContent) {
        "개인정보 보호를 위해 이 화면에는 상세 정보가 표시되지 않습니다.\n\n" +
          "구급대원·보호자는 KEMIX 앱 잠금화면 숏컷의 QR을 스캔하거나, " +
          "응급 QR 카드에 표시된 링크로 접속해 주세요."
      } else {
        "등록된 응급 정보가 없습니다.\nKEMIX 앱에서 응급 의료 정보를 저장해 주세요."
      }
      textSize = 14f
      setTextColor(Color.parseColor("#e2e8f0"))
      setLineSpacing(4f, 1f)
    }
    container.addView(body)

    if (shareUrl.isNotBlank()) {
      val link = TextView(context).apply {
        text = "웹 프로필 열기"
        textSize = 14f
        setTextColor(Color.parseColor("#fca5a5"))
        setPadding(0, 18, 0, 0)
        setOnClickListener {
          try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(shareUrl))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
          } catch (_: Exception) {
            // ignore
          }
        }
      }
      container.addView(link)
    }

    val privacy = TextView(context).apply {
      text = "전화번호·병력은 QR 스캔 후에만 확인됩니다"
      textSize = 11f
      setTextColor(Color.parseColor("#64748b"))
      setPadding(0, 16, 0, 0)
    }
    container.addView(privacy)

    val dismiss = TextView(context).apply {
      text = "닫기"
      textSize = 14f
      setTextColor(Color.WHITE)
      setPadding(0, 20, 0, 0)
      setOnClickListener { onDismiss() }
    }
    container.addView(dismiss)

    return container
  }
}
