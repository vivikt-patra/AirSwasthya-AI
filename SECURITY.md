# Security policy

## Supported status

This is an academic project scaffold. It is not currently a production service.

## Reporting issues

For college/project-team use, report issues directly to the project team lead.

## Security rules

- Do not commit API keys or credentials.
- Do not commit `.streamlit/secrets.toml`.
- Do not load model artifacts from unknown sources.
- Validate future upload inputs before processing.
- Keep dataset license and source documentation with the project.

## Known security limitations

- No authentication is implemented.
- No public API is exposed.
- The dashboard is intended for local/demo use in version 1.

