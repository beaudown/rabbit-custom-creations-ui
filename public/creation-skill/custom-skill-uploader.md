# Custom Skill Uploader

Use this module inside the single Superuser Management Creation.

The uploader accepts common skill and data formats:

- `.txt`
- `.md`
- `.csv`
- `.json`
- `.yaml`
- `.yml`
- `.toml`
- `.xml`
- `.pdf`
- `.zip`

Text formats may be parsed locally by the hosted PWA to extract headings,
fields, commands, permissions, hooks, and rollback notes. Binary/package formats
must be treated as metadata until a broker-side parser validates them.

## Import Flow

1. Upload the file.
2. Parse or inspect metadata.
3. Normalize into skill fields.
4. Queue a dry-run request.
5. Show requested hooks and permissions.
6. Approve or deny broker-side import.
7. Record audit ID and rollback note.

## Hook Policy

Custom skills may be made available after a validated temporary superuser
session, but system hooks must not activate automatically. The broker must
approve hook activation, record the file hash, describe expected behavior, and
show rollback or disable steps.

The Creation may upload, parse, normalize, and request activation. The broker is
responsible for install, hook, disable, rollback, and audit decisions.
