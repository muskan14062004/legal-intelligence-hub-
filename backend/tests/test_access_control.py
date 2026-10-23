import pytest

def test_document_ownership_and_access_control(client):
    # 1. Register User A
    user_a = client.post(
        "/api/auth/register",
        json={"email": "alice@legal.com", "password": "Password123", "full_name": "Alice Counsel"}
    ).json()
    token_a = user_a["access_token"]

    # 2. Register User B
    user_b = client.post(
        "/api/auth/register",
        json={"email": "bob@legal.com", "password": "Password123", "full_name": "Bob Counsel"}
    ).json()
    token_b = user_b["access_token"]

    # 3. User A lists documents (initially empty)
    res_a = client.get("/api/documents", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200
    assert len(res_a.json()) == 0

    # 4. User B attempts to access a non-existent or other user's document
    res_b = client.get(
        "/api/documents/non-existent-or-unauthorized-id",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_b.status_code == 404

def test_chat_conversation_isolation(client):
    # Register two users
    u1 = client.post(
        "/api/auth/register",
        json={"email": "user1@firm.com", "password": "Password123", "full_name": "User One"}
    ).json()
    token1 = u1["access_token"]

    u2 = client.post(
        "/api/auth/register",
        json={"email": "user2@firm.com", "password": "Password123", "full_name": "User Two"}
    ).json()
    token2 = u2["access_token"]

    # User 1 sends message
    chat_res = client.post(
        "/api/chat",
        headers={"Authorization": f"Bearer {token1}"},
        json={"message": "What is the liability cap?"}
    ).json()
    conv_id = chat_res["conversation_id"]

    # User 2 attempts to fetch User 1's conversation
    unauth_get = client.get(
        f"/api/chat/{conv_id}",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert unauth_get.status_code == 404

    # User 2 attempts to delete User 1's conversation
    unauth_del = client.delete(
        f"/api/chat/{conv_id}",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert unauth_del.status_code == 404
