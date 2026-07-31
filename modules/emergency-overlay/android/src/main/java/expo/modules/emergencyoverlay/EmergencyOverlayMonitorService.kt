package expo.modules.emergencyoverlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.IBinder

class EmergencyOverlayMonitorService : Service() {
  private val screenReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (context == null || intent == null) return
      when (intent.action) {
        Intent.ACTION_SCREEN_ON -> EmergencyOverlayManager.show(context)
        Intent.ACTION_SCREEN_OFF -> EmergencyOverlayManager.hide(context)
        Intent.ACTION_USER_PRESENT -> EmergencyOverlayManager.hide(context)
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_ON)
      addAction(Intent.ACTION_SCREEN_OFF)
      addAction(Intent.ACTION_USER_PRESENT)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(screenReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      registerReceiver(screenReceiver, filter)
    }
    startForegroundNotification()
  }

  override fun onDestroy() {
    unregisterReceiver(screenReceiver)
    EmergencyOverlayManager.hide(this)
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun startForegroundNotification() {
    val channelId = "kemix_emergency_overlay"
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        channelId,
        "비상 연락망 오버레이",
        NotificationManager.IMPORTANCE_LOW,
      )
      channel.description = "잠금화면에서 응급 정보를 표시합니다."
      manager.createNotificationChannel(channel)
    }

    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, channelId)
    } else {
      Notification.Builder(this)
    }
      .setContentTitle("KEMIX 비상 연락망 오버레이")
      .setContentText("화면이 켜질 때 응급 정보가 표시됩니다.")
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .build()

    startForeground(91001, notification)
  }

  companion object {
    fun start(context: Context) {
      val intent = Intent(context, EmergencyOverlayMonitorService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, EmergencyOverlayMonitorService::class.java))
    }
  }
}
