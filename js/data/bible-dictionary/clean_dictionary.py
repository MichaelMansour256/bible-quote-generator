

"""
Stage 2
Clean Arabic Bible Dictionary JSON
and build a SQLite database optimized for search/games.

Input:
    bible_dictionary.json

Output:
    bible_dictionary_clean.json
    bible_dictionary.db
    bible_dictionary_game.json
"""

import json
import os
import re
import sqlite3
import unicodedata


INPUT_FILE = "bible_dictionary.json"

CLEAN_JSON = "bible_dictionary_clean.json"
GAME_JSON = "bible_dictionary_game.json"
DB_FILE = "bible_dictionary.db"


# =========================================================
# Arabic normalization
# =========================================================

ARABIC_DIACRITICS = re.compile(
    r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]"
)


def normalize_arabic(text):
    """
    Normalization for searching.

    Example:

        أَبُو
        ابو
        أَبُو

    become approximately:

        ابو
    """

    if not text:
        return ""

    text = unicodedata.normalize(
        "NFC",
        text
    )

    # Remove tashkeel
    text = ARABIC_DIACRITICS.sub(
        "",
        text
    )

    # Normalize Arabic letters
    replacements = {
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ٱ": "ا",
        "ى": "ي",
        "ة": "ه",
        "ؤ": "و",
        "ئ": "ي",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    # Normalize whitespace
    text = " ".join(
        text.split()
    )

    return text.strip().lower()


# =========================================================
# Clean spaces / punctuation
# =========================================================

def clean_display_text(text):

    if not text:
        return ""

    text = unicodedata.normalize(
        "NFC",
        text
    )

    text = text.replace(
        "\n",
        " "
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# =========================================================
# Split aliases
# =========================================================

def split_aliases(word):
    """
    Try to split common alias patterns.

    Examples:

        أَرَاسْتُسُ أو أَرَسْطُوسَ
        أَرْدُونُ أو ...
        أَشْنَانَ، إِشْنَانَ، أَشْنَانِ

    We keep the original word intact,
    while also generating searchable aliases.
    """

    word = clean_display_text(word)

    if not word:
        return []

    aliases = []

    # -----------------------------------------------------
    # Arabic "أو"
    # -----------------------------------------------------

    if " أو " in word:

        parts = re.split(
            r"\s+أو\s+",
            word
        )

        aliases.extend(parts)

    # -----------------------------------------------------
    # Comma-separated variants
    # -----------------------------------------------------

    comma_parts = re.split(
        r"\s*[،,]\s*",
        word
    )

    if len(comma_parts) > 1:

        aliases.extend(
            comma_parts
        )

    # -----------------------------------------------------
    # Remove duplicates
    # -----------------------------------------------------

    result = []

    seen = set()

    for alias in aliases:

        alias = clean_display_text(
            alias
        )

        if not alias:
            continue

        key = normalize_arabic(
            alias
        )

        if key in seen:
            continue

        seen.add(key)

        result.append(
            alias
        )

    return result


# =========================================================
# Extract details text
# =========================================================

def extract_details(details):

    if not details:
        return ""

    texts = []

    if isinstance(details, list):

        for item in details:

            if not isinstance(item, dict):
                continue

            value = item.get(
                "details"
            )

            if value:

                texts.append(
                    clean_display_text(
                        value
                    )
                )

    elif isinstance(details, dict):

        value = details.get(
            "details"
        )

        if value:

            texts.append(
                clean_display_text(
                    value
                )
            )

    elif isinstance(details, str):

        texts.append(
            clean_display_text(
                details
            )
        )

    return "\n\n".join(
        x for x in texts if x
    )


# =========================================================
# Load input
# =========================================================

def load_input():

    if not os.path.exists(
        INPUT_FILE
    ):

        raise FileNotFoundError(
            f"File not found: {INPUT_FILE}"
        )

    with open(
        INPUT_FILE,
        "r",
        encoding="utf-8"
    ) as f:

        data = json.load(f)

    return data


# =========================================================
# Convert raw dictionary
# =========================================================

def build_clean_dictionary(raw):

    cleaned = []

    seen_words = set()

    # -----------------------------------------------------
    # Raw dictionary is expected to be:
    #
    # {
    #   "normalized key": {
    #       "word": "...",
    #       "details": [...]
    #   }
    # }
    # -----------------------------------------------------

    if isinstance(raw, dict):

        entries = raw.values()

    elif isinstance(raw, list):

        entries = raw

    else:

        raise ValueError(
            "Unsupported JSON format"
        )

    for entry in entries:

        if not isinstance(entry, dict):
            continue

        word = entry.get(
            "word"
        )

        if not word:
            continue

        word = clean_display_text(
            word
        )

        key = normalize_arabic(
            word
        )

        if not key:
            continue

        # -------------------------------------------------
        # Merge duplicate normalized words
        # -------------------------------------------------

        if key in seen_words:
            continue

        seen_words.add(
            key
        )

        details = extract_details(
            entry.get("details")
        )

        aliases = split_aliases(
            word
        )

        # -------------------------------------------------
        # Determine status
        # -------------------------------------------------

        if details:

            status = "has_details"

        elif entry.get("details") == []:

            status = "no_entry"

        else:

            status = "no_details"

        cleaned.append(
            {
                "id": len(cleaned) + 1,

                "word": word,

                "normalized": key,

                "aliases": aliases,

                "definition": details,

                "status": status
            }
        )

    return cleaned


# =========================================================
# Build SQLite
# =========================================================

def create_database(entries):

    if os.path.exists(
        DB_FILE
    ):

        os.remove(
            DB_FILE
        )

    conn = sqlite3.connect(
        DB_FILE
    )

    cursor = conn.cursor()

    # -----------------------------------------------------
    # Main entries table
    # -----------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE entries (

            id INTEGER PRIMARY KEY,

            word TEXT NOT NULL,

            normalized TEXT NOT NULL,

            definition TEXT,

            status TEXT NOT NULL

        )
        """
    )

    # -----------------------------------------------------
    # Aliases
    # -----------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE aliases (

            id INTEGER PRIMARY KEY,

            entry_id INTEGER NOT NULL,

            alias TEXT NOT NULL,

            normalized TEXT NOT NULL,

            FOREIGN KEY(entry_id)
                REFERENCES entries(id)

        )
        """
    )

    # -----------------------------------------------------
    # Normal indexes
    # -----------------------------------------------------

    cursor.execute(
        """
        CREATE INDEX idx_entries_normalized
        ON entries(normalized)
        """
    )

    cursor.execute(
        """
        CREATE INDEX idx_aliases_normalized
        ON aliases(normalized)
        """
    )

    # -----------------------------------------------------
    # Full Text Search
    # -----------------------------------------------------

    try:

        cursor.execute(
            """
            CREATE VIRTUAL TABLE entries_fts
            USING fts5(

                word,
                normalized,
                definition,

                content='entries',
                content_rowid='id'

            )
            """
        )

        fts_available = True

    except sqlite3.OperationalError:

        print(
            "⚠️ SQLite FTS5 غير متاح في هذه النسخة."
        )

        fts_available = False

    # -----------------------------------------------------
    # Insert entries
    # -----------------------------------------------------

    for entry in entries:

        cursor.execute(
            """
            INSERT INTO entries
            (
                id,
                word,
                normalized,
                definition,
                status
            )

            VALUES (?, ?, ?, ?, ?)
            """,
            (
                entry["id"],
                entry["word"],
                entry["normalized"],
                entry["definition"],
                entry["status"]
            )
        )

        for alias in entry["aliases"]:

            cursor.execute(
                """
                INSERT INTO aliases
                (
                    entry_id,
                    alias,
                    normalized
                )

                VALUES (?, ?, ?)
                """,
                (
                    entry["id"],
                    alias,
                    normalize_arabic(
                        alias
                    )
                )
            )

    # -----------------------------------------------------
    # Populate FTS
    # -----------------------------------------------------

    if fts_available:

        cursor.execute(
            """
            INSERT INTO entries_fts
            (
                rowid,
                word,
                normalized,
                definition
            )

            SELECT
                id,
                word,
                normalized,
                definition

            FROM entries
            """
        )

    conn.commit()

    conn.close()


# =========================================================
# Game JSON
# =========================================================

def build_game_json(entries):

    games = []

    for entry in entries:

        # Only entries with real definitions
        if entry["status"] != "has_details":
            continue

        games.append(
            {
                "id": entry["id"],

                "word": entry["word"],

                "aliases": entry["aliases"],

                "definition": entry["definition"],

                "search": entry["normalized"]
            }
        )

    with open(
        GAME_JSON,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            games,
            f,
            ensure_ascii=False,
            indent=2
        )


# =========================================================
# Main
# =========================================================

def main():

    print()
    print("=" * 60)
    print("Bible Dictionary Cleaner")
    print("=" * 60)
    print()

    raw = load_input()

    print(
        f"Raw entries: {len(raw):,}"
    )

    entries = build_clean_dictionary(
        raw
    )

    print(
        f"Clean entries: {len(entries):,}"
    )

    # -----------------------------------------------------
    # Statistics
    # -----------------------------------------------------

    with_details = sum(
        1
        for x in entries
        if x["status"] == "has_details"
    )

    no_entry = sum(
        1
        for x in entries
        if x["status"] == "no_entry"
    )

    no_details = sum(
        1
        for x in entries
        if x["status"] == "no_details"
    )

    print()
    print(
        f"With definitions : {with_details:,}"
    )

    print(
        f"No entry         : {no_entry:,}"
    )

    print(
        f"No details       : {no_details:,}"
    )

    # -----------------------------------------------------
    # Save clean JSON
    # -----------------------------------------------------

    with open(
        CLEAN_JSON,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            entries,
            f,
            ensure_ascii=False,
            indent=2
        )

    print()
    print(
        f"✓ {CLEAN_JSON}"
    )

    # -----------------------------------------------------
    # Game JSON
    # -----------------------------------------------------

    build_game_json(
        entries
    )

    print(
        f"✓ {GAME_JSON}"
    )

    # -----------------------------------------------------
    # SQLite
    # -----------------------------------------------------

    create_database(
        entries
    )

    print(
        f"✓ {DB_FILE}"
    )

    print()
    print("=" * 60)
    print("DONE")
    print("=" * 60)


if __name__ == "__main__":

    main()

