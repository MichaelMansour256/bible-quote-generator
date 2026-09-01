import json
import os
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import quote

import requests
from tqdm import tqdm


BASE_URL = "https://service.arabicbible.com/api/bible/dictionary"

# الحروف التي سنجربها
LETTERS = [
    "ا", "أ", "إ", "آ", "ء",
    "ب", "ت", "ث", "ج", "ح", "خ",
    "د", "ذ", "ر", "ز", "س", "ش",
    "ص", "ض", "ط", "ظ", "ع", "غ",
    "ف", "ق", "ك", "ل", "م", "ن",
    "ه", "و", "ي"
]

WORDS_FILE = "bible_dictionary_words.json"
DATA_FILE = "bible_dictionary.json"
FAILED_FILE = "bible_dictionary_failed.json"

TIMEOUT = 30
RETRIES = 3
MAX_WORKERS = 8


def normalize(text):
    """
    Normalization بسيطة لمنع التكرار.
    لا نغير النص الأصلي المحفوظ.
    """
    if not text:
        return ""

    text = unicodedata.normalize("NFC", text)
    text = " ".join(text.split())

    return text.strip()


def load_json(filename, default):
    if not os.path.exists(filename):
        return default

    try:
        with open(filename, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        print(f"⚠️ تعذر قراءة {filename}")
        return default


def save_json(filename, data):
    """
    نحفظ أولاً في ملف مؤقت ثم نستبدله.
    هذا يقلل احتمال تلف الملف لو البرنامج توقف أثناء الكتابة.
    """

    temp_file = filename + ".tmp"

    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2
        )

    os.replace(temp_file, filename)


def request_json(session, url):
    """
    Request مع Retry.
    """

    last_error = None

    for attempt in range(1, RETRIES + 1):

        try:

            response = session.get(
                url,
                timeout=TIMEOUT,
                headers={
                    "Accept": "application/json",
                    "User-Agent": "BibleDictionaryDownloader/1.0"
                }
            )

            response.raise_for_status()

            return response.json()

        except Exception as e:

            last_error = str(e)

            if attempt < RETRIES:
                time.sleep(attempt)

    raise RuntimeError(last_error)


# ---------------------------------------------------------
# 1. تحميل قائمة الكلمات
# ---------------------------------------------------------

def download_word_index():

    session = requests.Session()

    all_words = []

    print()
    print("=" * 60)
    print("تحميل قائمة كلمات قاموس الكتاب المقدس")
    print("=" * 60)

    for letter in LETTERS:

        encoded_letter = quote(letter, safe="")

        url = f"{BASE_URL}/words/{encoded_letter}"

        try:

            data = request_json(session, url)

            if not isinstance(data, list):

                print(
                    f"⚠️ استجابة غير متوقعة للحرف: {letter}"
                )

                continue

            for item in data:

                if not isinstance(item, dict):
                    continue

                text = item.get("text")

                if not text:
                    continue

                all_words.append(
                    {
                        "text": text,
                        "paragraphs": item.get("paragraphs")
                    }
                )

            print(
                f"✓ {letter} → {len(data):,} كلمة"
            )

        except Exception as e:

            print(
                f"✗ {letter} → {e}"
            )

    # -----------------------------------------------------
    # إزالة التكرارات
    # -----------------------------------------------------

    unique_words = {}

    for item in all_words:

        key = normalize(item["text"])

        if not key:
            continue

        if key not in unique_words:

            unique_words[key] = item

    words = list(unique_words.values())

    save_json(
        WORDS_FILE,
        words
    )

    print()
    print(
        f"إجمالي الكلمات الفريدة: {len(words):,}"
    )

    return words


# ---------------------------------------------------------
# 2. تحميل تفاصيل كلمة واحدة
# ---------------------------------------------------------

def download_word_details(item):

    word = item["text"]

    encoded_word = quote(
        word,
        safe=""
    )

    url = (
        f"{BASE_URL}/details/"
        f"{encoded_word}"
    )

    session = requests.Session()

    try:

        data = request_json(
            session,
            url
        )

        result = {
            "word": word,
            "paragraphs": item.get("paragraphs"),
            "details": data
        }

        return word, result, None

    except Exception as e:

        return word, None, str(e)


# ---------------------------------------------------------
# 3. تحميل القاموس بالكامل
# ---------------------------------------------------------

def download_dictionary(words):

    dictionary = load_json(
        DATA_FILE,
        {}
    )

    failed = load_json(
        FAILED_FILE,
        []
    )

    # تحويل failed إلى dictionary لتسهيل التعامل معه
    failed_map = {}

    for item in failed:

        if not isinstance(item, dict):
            continue

        word = item.get("word")

        if word:

            failed_map[
                normalize(word)
            ] = item

    # الكلمات التي لم يتم تحميل تفاصيلها بعد
    pending = []

    for item in words:

        key = normalize(
            item["text"]
        )

        if key not in dictionary:

            pending.append(item)

    print()
    print("=" * 60)
    print("تحميل تفاصيل الكلمات")
    print("=" * 60)

    print(
        f"تم تحميلها مسبقًا : {len(dictionary):,}"
    )

    print(
        f"المتبقي           : {len(pending):,}"
    )

    print(
        f"عدد Workers        : {MAX_WORKERS}"
    )

    print()

    if not pending:

        print("✓ لا توجد كلمات جديدة.")

        return

    completed = 0

    with ThreadPoolExecutor(
        max_workers=MAX_WORKERS
    ) as executor:

        futures = []

        for item in pending:

            future = executor.submit(
                download_word_details,
                item
            )

            futures.append(future)

        for future in tqdm(
            as_completed(futures),
            total=len(futures),
            unit="word",
            desc="Definitions"
        ):

            word, result, error = future.result()

            key = normalize(word)

            if result is not None:

                dictionary[key] = result

                # لو كانت فشلت سابقًا، نشيلها من failed
                failed_map.pop(
                    key,
                    None
                )

            else:

                failed_map[key] = {
                    "word": word,
                    "error": error
                }

            completed += 1

            # حفظ التقدم كل 25 كلمة
            if completed % 25 == 0:

                save_json(
                    DATA_FILE,
                    dictionary
                )

                save_json(
                    FAILED_FILE,
                    list(failed_map.values())
                )

    # حفظ نهائي
    save_json(
        DATA_FILE,
        dictionary
    )

    save_json(
        FAILED_FILE,
        list(failed_map.values())
    )

    print()
    print("=" * 60)
    print("انتهى التحميل")
    print("=" * 60)

    print(
        f"الكلمات المحملة : {len(dictionary):,}"
    )

    print(
        f"الكلمات الفاشلة : {len(failed_map):,}"
    )

    print()
    print(
        f"✓ {DATA_FILE}"
    )

    print(
        f"✓ {WORDS_FILE}"
    )

    if failed_map:

        print(
            f"⚠️ {FAILED_FILE}"
        )

        print()
        print(
            "شغل السكريبت مرة أخرى لإعادة محاولة الكلمات الفاشلة."
        )


# ---------------------------------------------------------
# MAIN
# ---------------------------------------------------------

def main():

    print()
    print("Bible Dictionary Downloader")
    print()

    # لو قائمة الكلمات موجودة بالفعل، نستخدمها
    words = load_json(
        WORDS_FILE,
        None
    )

    if not isinstance(words, list) or not words:

        words = download_word_index()

    else:

        print(
            f"استخدام قائمة موجودة: "
            f"{len(words):,} كلمة"
        )

    if not words:

        print(
            "❌ لم يتم العثور على أي كلمات."
        )

        return

    download_dictionary(
        words
    )


if __name__ == "__main__":

    main()

