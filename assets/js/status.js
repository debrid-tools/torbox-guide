// Fetches the daily-updated plan status and updates the badge.
// The status file is committed by .github/workflows/check-plan.yml
(function () {
	"use strict";

	var STATUS_FILE = "assets/data/status.json";

	function setText(id, text) {
		var el = document.getElementById(id);
		if (el) {
			el.textContent = text;
		}
	}

	function setLight(id, state) {
		var el = document.getElementById(id);
		if (!el) {
			return;
		}
		el.classList.remove("is-active", "is-inactive", "is-checking");
		el.classList.add(state);
	}

	function formatDate(iso) {
		if (!iso) {
			return "—";
		}

		var date = new Date(iso);
		if (Number.isNaN(date.getTime())) {
			return iso;
		}

		return date.toLocaleString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZoneName: "short"
		});
	}

	function applyStatus(data) {
		var active = Boolean(data && data.plan_active);
		var state = active ? "is-active" : "is-inactive";
		var title = active ? "Referrer's plan is active!" : "Referrer's plan is NOT active";
		var sub = active
		? "The referral code above is backed by a paid TorBox plan. Last checked (local time): " + formatDate(data && data.checked_at)
		: "The referrer does not currently have a paid plan — a referral would not grant a bonus right now. Last checked (local time): " + formatDate(data && data.checked_at);
		setLight("status-light", state);
		setText("status-title", title);
		setText("status-sub", sub);
	}

	function fail() {
		setLight("status-light", "is-checking");
		setText("status-title", "Couldn't verify plan status");
		setText("status-sub", "The status file is unavailable. Check the GitHub Actions workflow.");
	}

	fetch(STATUS_FILE + "?t=" + Date.now())
		.then(function (response) {
			if (!response.ok) {
				throw new Error("status fetch failed");
			}
			return response.json();
		})
		.then(applyStatus)
		.catch(fail);

	var copyBtn = document.getElementById("copy-btn");
	var codeEl = document.getElementById("referral-code");
	if (copyBtn && codeEl) {
		copyBtn.addEventListener("click", function () {
			var code = codeEl.textContent.trim();
			var label = copyBtn.querySelector(".copy-label");
			var done = function () {
				if (label) {
					label.textContent = "Copied!";
				}
				copyBtn.classList.add("copied");
				window.setTimeout(function () {
					if (label) {
						label.textContent = "Copy";
					}
					copyBtn.classList.remove("copied");
				}, 1800);
			};

			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(code).then(done, done);
				return;
			}

			var textArea = document.createElement("textarea");
			textArea.value = code;
			textArea.setAttribute("readonly", "");
			textArea.style.position = "fixed";
			textArea.style.left = "-9999px";
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand("copy");
			} catch (error) {
				// Ignore copy fallback errors and still show success feedback.
			}
			document.body.removeChild(textArea);
			done();
		});
	}
})();
