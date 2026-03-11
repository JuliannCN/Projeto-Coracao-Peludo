def forum_entity(post) -> dict:
    return {
        "id": str(post["_id"]),
        "title": post.get("title"),
        "content": post.get("content"),
        "author_id": post.get("author_id"),
        "created_at": post.get("created_at")
    }


def forums_entity(posts) -> list:
    return [forum_entity(post) for post in posts]