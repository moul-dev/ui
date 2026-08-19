import type { LogItem } from './Logs.types'
import { parseLogs } from './parseLogs'

export const SERVER_LOG_RAW = `2026/08/19 11:16:49 INFO Starting mould engine server addr="http://localhost:8090" env="development" version="dev"
2026/08/19 11:16:49 INFO Request tracking flusher started component="analytics"
2026/08/19 11:16:50 DEBU Flushed request records component="analytics" count=12
2026/08/19 11:16:52 INFO HTTP request bytes_sent=48 ip="127.0.0.1" latency="182.4µs" method="GET" path="/api/health" status=200
2026/08/19 11:16:55 INFO HTTP request bytes_sent=1420 email="alex@example.com" ip="192.168.1.45" latency="3.12ms" method="GET" path="/api/mouls/posts/records" status=200 user_id="usr_01j7k9p2"
2026/08/19 11:17:02 WARN HTTP request bytes_sent=68 ip="192.168.1.45" latency="410.5µs" method="GET" path="/api/mouls/nonexistent/records" status=404 error="moul 'nonexistent' not found"
2026/08/19 11:17:08 WARN Request tracking channel full, dropping request component="analytics" path="/api/events"
2026/08/19 11:17:15 WARN Background job failed, scheduled for retry error="dial tcp: lookup smtp.mailgun.org: no such host" jobID="job_01j7k8a" nextAttemptAt="2026-08-19 11:18:15" worker="SendEmail"
2026/08/19 11:17:21 ERRO HTTP request bytes_sent=112 email="alex@example.com" ip="192.168.1.80" latency="14.85ms" method="POST" path="/api/mouls/orders/records" status=500 user_id="usr_01j7k9p2" error="database locked (sqlite busy)"
2026/08/19 11:17:25 ERRO After-webhook execution failed err="Post \\"https://webhook.site/test\\": context deadline exceeded" url="https://webhook.site/test"
2026/08/19 11:17:30 ERRO Failed to start Litestream replication err="credentials not set in environment (AWS_ACCESS_KEY_ID)"
2026/08/19 11:17:40 INFO Cleaned up old requests count=42
2026/08/19 11:17:40 INFO Cleaned up old visits count=15
2026/08/19 11:17:40 INFO Cleaned up expired revoked tokens count=0
2026/08/19 11:17:55 INFO Stopping Litestream replication...
2026/08/19 11:17:55 INFO Server stopped gracefully
2026/08/19 11:18:02 FATA Server failed to run err="listen tcp :8090: bind: address already in use"`

export const SERVER_LOGS: LogItem[] = parseLogs(SERVER_LOG_RAW)
