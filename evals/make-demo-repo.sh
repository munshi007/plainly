#!/usr/bin/env bash
# Builds the small demo repo used for the README screenshot.
#   evals/make-demo-repo.sh /tmp/demo-shop
#   cd /tmp/demo-shop && claude --plugin-dir <path-to-plainly>
#   > Explain how payments/retry.py works. I'm about to change MAX_ATTEMPTS.
# "You" wrote payments/refund.py (the anchor plainly should find via git log);
# a teammate wrote the rest, including two planted problems: the nightly sweep
# resets attempts forever, and uncaught timeouts can race the webhook.
set -euo pipefail
R="${1:?usage: make-demo-repo.sh <target-dir>}"
[ -e "$R" ] && { echo "$R exists; pick a new path" >&2; exit 1; }
mkdir -p "$R/payments" "$R/worker" "$R/webhooks" && cd "$R"
git init -q && git config user.email you@example.com && git config user.name You
cat > payments/refund.py <<'PY'
from payments.store import load_payment, save_payment

MAX_REFUND_ATTEMPTS = 3


def refund(payment_id, provider):
    """Refund a captured payment. Retries on provider timeouts, then gives up."""
    payment = load_payment(payment_id)
    if payment.status != "captured":
        raise ValueError(f"cannot refund payment in state {payment.status}")

    for attempt in range(1, MAX_REFUND_ATTEMPTS + 1):
        try:
            provider.refund(payment.provider_ref, payment.amount)
            payment.status = "refunded"
            break
        except TimeoutError:
            payment.refund_attempts = attempt
    else:
        payment.status = "refund_failed"

    save_payment(payment)
    return payment
PY
cat > payments/store.py <<'PY'
_DB = {}


def load_payment(payment_id):
    return _DB[payment_id]


def save_payment(payment):
    _DB[payment.id] = payment
PY
git add -A && git commit -q -m "Add refunds with bounded retries" --date="2026-03-03T10:00:00"
cat > payments/retry.py <<'PY'
import time

from payments.store import load_payment, save_payment
from payments.policy import next_delay, MAX_ATTEMPTS


def retry_charge(payment_id, provider, sleep=time.sleep):
    """Retry a failed charge with backoff. Called by the API right after a decline."""
    payment = load_payment(payment_id)
    while payment.attempts < MAX_ATTEMPTS:
        payment.attempts += 1
        try:
            provider.charge(payment.card_token, payment.amount)
            payment.status = "paid"
            save_payment(payment)
            return payment
        except provider.SoftDecline:
            sleep(next_delay(payment.attempts))
        except provider.HardDecline:
            break
    payment.status = "failed"
    save_payment(payment)
    return payment
PY
cat > payments/policy.py <<'PY'
MAX_ATTEMPTS = 4
BASE_DELAY_SECONDS = 2


def next_delay(attempt):
    """Exponential backoff: 2s, 4s, 8s, ..."""
    return BASE_DELAY_SECONDS * (2 ** (attempt - 1))
PY
cat > worker/nightly.py <<'PY'
from payments.store import _DB
from payments.retry import retry_charge


def run(provider):
    """Nightly sweep: retry every payment still marked failed."""
    for payment in list(_DB.values()):
        if payment.status == "failed":
            payment.attempts = 0
            retry_charge(payment.id, provider)
PY
cat > webhooks/provider.py <<'PY'
from payments.store import load_payment, save_payment


def on_charge_succeeded(event):
    """Provider callback. A charge that timed out on our side may still succeed."""
    payment = load_payment(event["payment_id"])
    payment.status = "paid"
    save_payment(payment)
PY
git add -A && git -c user.email=teammate@example.com -c user.name=Teammate commit -q -m "Add charge retries, nightly sweep, provider webhook"
echo "Demo repo ready at $R"
