---
title: "The Service Evolution – No More Plain Background Services"
pubDate: 2026-03-01
series: "Rebooting Android Basics"
tag: ["android", "services", "workmanager", "background-execution"]
---

Modern Android background work is split between Foreground Services for
user-visible ongoing work and WorkManager for reliable deferred work.

## The History

Before Android 8, apps could start background Services that ran
indefinitely. Background Execution Limits changed that model to protect
battery life.

## The Modern Way

### Foreground Services

Use when the user expects work to be actively running, such as music,
navigation, or a VOIP call.

``` kotlin
class MusicService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, "channel_id")
            .setContentTitle("Playing Music")
            .setSmallIcon(R.drawable.ic_music)
            .setOngoing(true)
            .build()

        startForeground(1, notification)
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
```

### WorkManager

``` kotlin
class SyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        return try {
            performDataSync()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

WorkManager is persistent and constraint-aware.

## The "Junior" Gotcha

Do not use Foreground Services for short background tasks that can be
delegated to WorkManager. Unnecessary persistent notifications create
notification fatigue.

## Summary

Use Foreground Services for visible ongoing work and WorkManager for
reliable background execution.
