"""Write <sandbox>/ACCESS.md: the address and sign-ins, from secrets.json.

The file lives in the sandbox folder, outside the repo; the repo never holds
the passwords. Usage: <sandbox>/venv/bin/python -I -B write_access.py <sandbox dir>
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sandbox_lib import URL, load_secrets, sandbox_dir  # noqa: E402

TEXT = """# Family Hub sandbox: access

Local only, made-up data. Nothing here reaches the house.

- Address: {url} (board: {url}/family-hub/family-hub)
- Owner (admin): user `owner`, password `{owner}`
- Jenn (not admin): user `jenn`, password `{jenn}`
- Wall (not admin; the wall tablet's sign-in, like the house's "Clover"): user `wall`, password `{wall}`

Browser setup and scripts: {readme}
Start, stop, reset: {sandbox}/start.sh, stop.sh, reset.sh
"""


def main() -> None:
    sandbox = sandbox_dir()
    secrets = load_secrets(sandbox)
    readme = Path(__file__).resolve().parent / "README.md"
    (sandbox / "ACCESS.md").write_text(TEXT.format(url=URL, sandbox=sandbox, readme=readme, **secrets))


if __name__ == "__main__":
    main()
