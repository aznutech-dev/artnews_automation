import bleach

ALLOWED_TAGS = [
    "p", "br", "h2", "h3", "h4", "ul", "ol", "li", "blockquote",
    "a", "img", "strong", "em", "code", "pre", "figure", "figcaption",
    "hr", "table", "thead", "tbody", "tr", "th", "td",
]

ALLOWED_ATTRS = {
    "a": ["href", "title", "rel", "target"],
    "img": ["src", "alt", "title", "loading", "width", "height"],
}

ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


def sanitize_html(html: str) -> str:
    cleaned = bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )
    return bleach.linkify(
        cleaned,
        callbacks=[lambda attrs, new=False: {**attrs, (None, "rel"): "noopener nofollow"}],
    )
