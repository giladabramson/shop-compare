import gzip
import hashlib
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

from firebase_admin import credentials, firestore, initialize_app
from firebase_functions import https_fn, storage_fn
from google.cloud import storage
import requests

# Initialize Admin SDK once per instance
initialize_app(credentials.ApplicationDefault())
db = firestore.client()

NAME_CLEAN_RE = re.compile(r"[^a-z0-9\s]")


def normalize_name(value: str) -> str:
    if not value:
        return ""
    lowered = value.strip().lower()
    cleaned = NAME_CLEAN_RE.sub(" ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def hash_name(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]


def get_text(node, *tags) -> str:
    for tag in tags:
        found = node.find(tag)
        if found is not None and found.text:
            return found.text.strip()
    return ""


def to_float(value: str) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_store_id(root: ET.Element) -> str:
    for tag in ("StoreId", "StoreCode", "Store", "Branch"):  # best-effort
        value = get_text(root, tag)
        if value:
            return value
    return ""


def process_items(root: ET.Element, retailer_id: str, store_id: str, source_name: str) -> int:
    batch = db.batch()
    operations = 0
    processed = 0

    for item in root.iter():
        if item.tag not in ("Item", "Product", "ItemDetails"):
            continue

        barcode = get_text(item, "ItemCode", "Barcode", "ItemId")
        name = get_text(item, "ItemName", "Name")
        brand = get_text(item, "ManufacturerName", "Brand")
        unit_size = get_text(item, "UnitQty", "UnitSize")
        price_value = to_float(get_text(item, "ItemPrice", "Price"))

        if not name or price_value is None:
            continue

        normalized = normalize_name(name)
        product_id = barcode if barcode else f"n_{hash_name(normalized)}"

        product_ref = db.collection("products").document(product_id)
        batch.set(
            product_ref,
            {
                "barcode": barcode,
                "name": name,
                "brand": brand,
                "unitSize": unit_size,
                "normalizedName": normalized,
                "updatedAt": firestore.SERVER_TIMESTAMP,
            },
            merge=True,
        )

        retailer_item_ref = product_ref.collection("retailerItems").document(retailer_id)
        batch.set(
            retailer_item_ref,
            {
                "retailerItemId": barcode or "",
                "retailerName": retailer_id,
                "lastSeenAt": firestore.SERVER_TIMESTAMP,
                "source": source_name,
            },
            merge=True,
        )

        writes = 2
        if store_id:
            store_item_ref = (
                db.collection("storeItems")
                .document(store_id)
                .collection("items")
                .document(product_id)
            )
            batch.set(
                store_item_ref,
                {
                    "productId": product_id,
                    "retailerId": retailer_id,
                    "storeId": store_id,
                    "price": price_value,
                    "currency": "ILS",
                    "sourceFile": source_name,
                    "updatedAt": firestore.SERVER_TIMESTAMP,
                },
                merge=True,
            )
            writes += 1

        operations += writes
        processed += 1
        if operations >= 450:
            batch.commit()
            batch = db.batch()
            operations = 0

    if operations > 0:
        batch.commit()

    return processed


def load_xml_from_url(url: str) -> ET.Element:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    payload = response.content

    if url.endswith(".gz") or payload[:2] == b"\x1f\x8b":
        payload = gzip.decompress(payload)

    xml_text = payload.decode("utf-8", errors="replace")
    return ET.fromstring(xml_text)


@storage_fn.on_object_finalized()
def parse_price_file(event: storage_fn.Event[storage_fn.StorageObjectData]):
    # Only handle XML files under a prices/ prefix.
    if not event.data.name or not event.data.name.startswith("prices/"):
        return
    if not event.data.name.endswith(".xml"):
        return

    bucket_name = event.data.bucket
    file_name = event.data.name

    storage_client = storage.Client()
    blob = storage_client.bucket(bucket_name).blob(file_name)
    xml_content = blob.download_as_text(encoding="utf-8")

    root = ET.fromstring(xml_content)
    retailer_id = event.data.metadata.get("retailerId", "unknown") if event.data.metadata else "unknown"
    store_id = parse_store_id(root) or event.data.metadata.get("storeId", "") if event.data.metadata else ""

    process_items(root, retailer_id, store_id, file_name)


@https_fn.on_request()
def fetch_price_file(req: https_fn.Request) -> https_fn.Response:
    payload = req.get_json(silent=True) or {}
    url = req.args.get("url") if req.args else None
    url = url or payload.get("url")
    retailer_id = payload.get("retailerId") or req.args.get("retailerId") if req.args else None
    store_id = payload.get("storeId") or req.args.get("storeId") if req.args else None

    if not url:
        return https_fn.Response("Missing url", status=400)

    parsed = urlparse(url)
    source_name = parsed.path.split("/")[-1] or url
    retailer_id = retailer_id or "unknown"
    store_id = store_id or ""

    root = load_xml_from_url(url)
    processed = process_items(root, retailer_id, store_id, source_name)

    return https_fn.Response(
        f"Processed {processed} items from {source_name}",
        status=200,
    )
