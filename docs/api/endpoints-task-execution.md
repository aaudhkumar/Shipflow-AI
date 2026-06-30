# Endpoints: Task Execution

This section covers the AI Task Execution engine endpoints.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/taskExecution/start` | POST | Triggers an AI worker to execute a task. |
| `/api/taskExecution/status` | GET | Polls the current status of the execution. |
| `/api/taskExecution/logs` | GET | Retrieves the execution logs and diffs. |

## Example: Triggering a Task Execution
```bash
curl -X POST http://localhost:8000/api/taskExecution/start \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{
    "taskId": "tsk_123",
    "model": "gpt-4o"
  }'
```

## Example: Polling Execution Status
```bash
curl -X GET "http://localhost:8000/api/taskExecution/status?executionId=exec_890" \
  -H "Cookie: better-auth.session_token=..."
```
