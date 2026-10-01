import os

os.environ["DATABASE_URL"] = "sqlite:///./test_ezze.db"
os.environ["SECRET_KEY"] = "test-secret"

import pytest
from fastapi.testclient import TestClient

from server.app import Base, app, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield


def register(email="a@example.com", pw="longenough1"):
    return client.post("/api/auth/register", json={"email": email, "password": pw, "name": "A"})


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_register_login_and_me():
    r = register()
    assert r.status_code == 201
    token = r.json()["token"]
    assert client.get("/api/me", headers=auth(token)).json()["email"] == "a@example.com"
    ok = client.post("/api/auth/login", json={"email": "A@Example.com", "password": "longenough1"})
    assert ok.status_code == 200


def test_rejects_weak_password_duplicate_and_bad_login():
    assert register(pw="12345").status_code == 422
    assert register().status_code == 201
    assert register().status_code == 409
    bad = client.post("/api/auth/login", json={"email": "a@example.com", "password": "wrongwrong"})
    assert bad.status_code == 401
    unknown = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "wrongwrong"})
    assert unknown.json()["detail"] == bad.json()["detail"]  # no account enumeration


def test_state_requires_auth_and_roundtrips():
    assert client.get("/api/state").status_code == 401
    token = register().json()["token"]
    assert client.get("/api/state", headers=auth(token)).json() == {"data": None, "rev": 0}
    put = client.put("/api/state", headers=auth(token), json={"data": {"dsa": {"two-sum": {"solved": True}}}})
    assert put.json()["rev"] == 1
    got = client.get("/api/state", headers=auth(token)).json()
    assert got["data"]["dsa"]["two-sum"]["solved"] is True and got["rev"] == 1


def test_users_cannot_see_each_others_data():
    t1 = register("one@example.com").json()["token"]
    t2 = register("two@example.com").json()["token"]
    client.put("/api/state", headers=auth(t1), json={"data": {"secret": 1}})
    assert client.get("/api/state", headers=auth(t2)).json()["data"] is None


def test_stale_write_is_refused_with_server_copy():
    token = register().json()["token"]
    client.put("/api/state", headers=auth(token), json={"data": {"v": 1}})
    client.put("/api/state", headers=auth(token), json={"data": {"v": 2}, "base_rev": 1})
    stale = client.put("/api/state", headers=auth(token), json={"data": {"v": 99}, "base_rev": 1})
    assert stale.status_code == 409
    assert stale.json()["detail"]["data"] == {"v": 2}


def test_delete_account_removes_everything():
    token = register().json()["token"]
    client.put("/api/state", headers=auth(token), json={"data": {"v": 1}})
    assert client.delete("/api/account", headers=auth(token)).status_code == 204
    assert client.get("/api/me", headers=auth(token)).status_code == 401
