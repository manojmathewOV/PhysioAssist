#!/usr/bin/env python3
"""Verify and optionally extract the immutable reviewer-source archive."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys
import zipfile

ARCHIVE_SHA256 = "a5741c2217071272157c57e7825298e42a84e63b5bf614891a681647fd8e7d23"
SOURCE_HASHES = {
    "06e77dd/review.acceptance.test.ts": "104b96dd83a9da2527450c0caba815de2bc4a18724cd5ab7e11206e1a033321c",
    "29e6e14/review.followup.test.tsx": "f6c1bb35f44855f83e10e659d40dbf04afe5c3ee99a5723e0e7a6951b5c0410e",
    "b06be91/review.clinicalJourney.test.tsx": "7656fc0be95ccbbb33548838e0cd3751caa1a0d0a899b5645dab059f306ed753",
    "c7ac7f3/review.protocols.test.ts": "b7c81a9a082a500cfa9b4ab569160e6bf89f2effeca5c795ef95fbcd5c906ade",
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--verify-only", action="store_true")
    group.add_argument("--dest", type=Path, help="New destination directory; must not exist")
    args = parser.parse_args()
    archive = Path(__file__).resolve().parents[1] / "tests" / "original-reviewer-tests.zip"
    if hashlib.sha256(archive.read_bytes()).hexdigest() != ARCHIVE_SHA256:
        raise ValueError("Archive SHA-256 mismatch; stop and inspect provenance")
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        expected_names = set(SOURCE_HASHES) | {"README.md", "MANIFEST.json"}
        if len(names) != len(set(names)) or set(names) != expected_names:
            raise ValueError("Unexpected or duplicate archive member")
        if z.testzip() is not None:
            raise ValueError("Archive CRC check failed")
        manifest = json.loads(z.read("MANIFEST.json"))
        if {row["path"]: row["sha256"] for row in manifest} != SOURCE_HASHES:
            raise ValueError("Manifest does not match pinned source digests")
        for name, expected in SOURCE_HASHES.items():
            if hashlib.sha256(z.read(name)).hexdigest() != expected:
                raise ValueError(f"Source SHA-256 mismatch: {name}")
        if args.dest is not None:
            destination = args.dest.expanduser().absolute()
            destination.mkdir(parents=True, exist_ok=False)
            for name in names:
                relative = PurePosixPath(name)
                if relative.is_absolute() or ".." in relative.parts:
                    raise ValueError("Unsafe archive path")
                target = destination.joinpath(*relative.parts)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(z.read(name))
            print(f"Extracted verified reviewer sources to {destination}")
    print("Verified archive and all four byte-for-byte reviewer test sources.")
    print("Historical tests: read tests/README.md before using them on current code.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
