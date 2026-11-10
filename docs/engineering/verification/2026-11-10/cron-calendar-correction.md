Cron calculation now selects the next calendar minute strictly after the supplied timestamp in the host process timezone. Previously daily/hourly aliases were elapsed intervals, minute steps drifted from field boundaries, and any other expression silently became a one-minute interval. The daily research template was therefore incorrectly scheduled.

The implementation supports five fields, numeric lists/ranges, range or wildcard steps, month/weekday names, Sunday 0/7 and hourly/daily/weekly/monthly/yearly aliases. Restricted day-of-month and weekday fields use union semantics. Missing DST wall times are skipped and repeated times can match twice. These semantics were checked against the primary [Cronie crontab manual](https://github.com/cronie-crond/cronie/blob/master/man/crontab.5).

Unsupported syntax and schedules without a match within eight years reject explicitly. Invalid persisted jobs remain in SQLite with failed execution history and become disabled before dispatch. Existing explicit/stored next-run timestamps remain preserved; they are not bulk migrated. There is no per-job timezone override, reboot scheduling, seconds field, randomization or Quartz special-operator support.

Validation: 33 reported checks passed across scheduler, dispatcher, native assistant batch and audit tooling. Calendar cases include leap day, names, range/list/step boundaries and real isolated timezone child processes. These are bounded tests, not endurance acceptance.

A separate actual wall-clock run registered `* * * * *`, observed no early file effect, then produced one file append 199 ms after the expected minute boundary and advanced the next run. Receipt: `artifacts/automation-calendar/2026-11-10T05-02-24-429Z/receipt.json`. This proves local scheduler/timer/file integration, not native UI scheduling or arbitrary automation outcomes.

Additional catalog: 42 reviewed files, 47 unreviewed files; exhaustive classification remains unestablished. Production release remains BLOCKED.
