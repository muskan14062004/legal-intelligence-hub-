import pytest

def test_user_registration(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "counsel1@firm.com",
            "password": "SecretPassword123",
            "full_name": "Counsel One"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "counsel1@firm.com"
    assert data["user"]["full_name"] == "Counsel One"

def test_duplicate_registration_rejected(client):
    # Attempting to register same email
    response = client.post(
        "/api/auth/register",
        json={
            "email": "counsel1@firm.com",
            "password": "AnotherPassword456",
            "full_name": "Duplicate User"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

def test_user_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "counsel1@firm.com",
            "password": "SecretPassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "counsel1@firm.com"

def test_user_login_invalid_password(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "counsel1@firm.com",
            "password": "WrongPassword!"
        }
    )
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()

def test_protected_me_endpoint(client):
    # First login
    login_resp = client.post(
        "/api/auth/login",
        json={
            "email": "counsel1@firm.com",
            "password": "SecretPassword123"
        }
    )
    token = login_resp.json()["access_token"]

    # Call /api/auth/me with Bearer token
    me_resp = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "counsel1@firm.com"

def test_protected_endpoint_without_token(client):
    me_resp = client.get("/api/auth/me")
    assert me_resp.status_code == 401
